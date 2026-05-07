type GoogleMeetEventInput = {
  summary: string;
  description: string;
  start: string;
  durationMinutes?: number;
};

type GoogleTokenResponse = {
  access_token?: string;
  error?: string;
  error_description?: string;
};

type GoogleCalendarEventResponse = {
  id?: string;
  htmlLink?: string;
  hangoutLink?: string;
  conferenceData?: {
    entryPoints?: Array<{
      uri?: string;
      entryPointType?: string;
    }>;
    createRequest?: {
      status?: {
        statusCode?: string;
      };
    };
  };
};

function getRequiredEnv(name: string) {
  const value = Deno.env.get(name);

  if (!value) {
    throw new Error(`Missing required Google environment variable: ${name}`);
  }

  return value;
}

async function refreshGoogleAccessToken() {
  const clientId = getRequiredEnv("GOOGLE_CLIENT_ID");
  const clientSecret = getRequiredEnv("GOOGLE_CLIENT_SECRET");
  const refreshToken = getRequiredEnv("GOOGLE_REFRESH_TOKEN");

  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
    grant_type: "refresh_token",
  });

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  const payload = (await response.json()) as GoogleTokenResponse;

  if (!response.ok || !payload.access_token) {
    throw new Error(payload.error_description ?? payload.error ?? "Could not refresh Google access token");
  }

  return payload.access_token;
}

function extractMeetLink(payload: GoogleCalendarEventResponse) {
  return (
    payload.hangoutLink ??
    payload.conferenceData?.entryPoints?.find((entryPoint) => entryPoint.uri)?.uri ??
    null
  );
}

async function fetchCalendarEvent(accessToken: string, calendarId: string, eventId: string) {
  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}?conferenceDataVersion=1`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  if (!response.ok) {
    return null;
  }

  return (await response.json()) as GoogleCalendarEventResponse;
}

export async function createGoogleMeetEvent(input: GoogleMeetEventInput) {
  const calendarId = Deno.env.get("GOOGLE_CALENDAR_ID") || "primary";
  const accessToken = await refreshGoogleAccessToken();

  const start = new Date(input.start);
  if (Number.isNaN(start.getTime())) {
    throw new Error("Invalid Google Meet start date");
  }

  const durationMinutes = input.durationMinutes ?? 60;
  const end = new Date(start.getTime() + durationMinutes * 60_000);
  const requestId = crypto.randomUUID();

  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?conferenceDataVersion=1&sendUpdates=none`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        summary: input.summary,
        description: input.description,
        start: { dateTime: start.toISOString() },
        end: { dateTime: end.toISOString() },
        conferenceData: {
          createRequest: {
            requestId,
            conferenceSolutionKey: {
              type: "hangoutsMeet",
            },
          },
        },
      }),
    },
  );

  const createdEvent = (await response.json()) as GoogleCalendarEventResponse;

  if (!response.ok) {
    throw new Error("No se pudo crear la reunion en Google Calendar");
  }

  let meetLink = extractMeetLink(createdEvent);

  if (!meetLink && createdEvent.id) {
    for (let attempt = 0; attempt < 3 && !meetLink; attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, 700));
      const freshEvent = await fetchCalendarEvent(accessToken, calendarId, createdEvent.id);
      if (!freshEvent) {
        continue;
      }

      meetLink = extractMeetLink(freshEvent);
    }
  }

  if (!meetLink) {
    throw new Error("Google Calendar no devolvio un enlace de Meet");
  }

  return {
    meetLink,
    googleEventId: createdEvent.id ?? null,
    googleCalendarLink: createdEvent.htmlLink ?? null,
  };
}
