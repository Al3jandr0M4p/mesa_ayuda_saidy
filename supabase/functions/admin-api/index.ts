// supabase/functions/admin-api/index.ts

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const USER_COLUMNS = "id, nombre, email, rol, created_at, updated_at";
const TICKET_COLUMNS =
  "id, titulo, descripcion, prioridad, estado, user_id, created_at, updated_at";
const COMMENT_COLUMNS = "id, ticket_id, user_id, mensaje, created_at";
const EVENT_COLUMNS =
  "id, titulo, descripcion, fecha, plataforma, enlace_reunion, created_at";

type AdminPayload = {
  action?: string;
  id?: string;
  ticket_id?: string;
  titulo?: string;
  descripcion?: string;
  estado?: "abierto" | "en_progreso" | "cerrado";
  mensaje?: string;
  fecha?: string;
  plataforma?: "google_meet" | "microsoft_teams" | "zoom" | "presencial" | "otro";
  enlace_reunion?: string;
  link?: string;
  url?: string;
  enlace?: string;
  durationMinutes?: number;
  nombre?: string;
  email?: string;
  rol?: "admin" | "empleado";
  password?: string;
};

type AuthenticatedRequest = {
  user: {
    id: string;
    email?: string;
  };
  token: string;
};

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
  };
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods":
    "GET, POST, PATCH, DELETE, OPTIONS",
};

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

function optionsResponse() {
  return new Response("ok", {
    headers: corsHeaders,
  });
}

function getRequiredEnv(name: string) {
  const value = Deno.env.get(name);

  if (!value) {
    throw new Error(`Missing env variable: ${name}`);
  }

  return value;
}

function getServiceClient() {
  return createClient(
    getRequiredEnv("SUPABASE_URL"),
    getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    },
  );
}

function getUserClient(token: string) {
  return createClient(
    getRequiredEnv("SUPABASE_URL"),
    getRequiredEnv("SUPABASE_ANON_KEY"),
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    },
  );
}

async function requireAuth(
  req: Request,
): Promise<AuthenticatedRequest | Response> {
  const authHeader = req.headers.get("Authorization");
  const token = authHeader?.replace("Bearer ", "");

  if (!token) {
    return jsonResponse(
      { error: "Missing bearer token" },
      401,
    );
  }

  const supabase = getServiceClient();

  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    return jsonResponse(
      { error: "Invalid or expired session" },
      401,
    );
  }

  return {
    user: {
      id: data.user.id,
      email: data.user.email,
    },
    token,
  };
}

async function requireAdmin(
  req: Request,
): Promise<AuthenticatedRequest | Response> {
  const auth = await requireAuth(req);

  if (auth instanceof Response) {
    return auth;
  }

  const supabase = getServiceClient();

  const { data, error } = await supabase
    .from("usuarios")
    .select("rol")
    .eq("id", auth.user.id)
    .maybeSingle();

  if (error) {
    return jsonResponse(
      { error: "Could not verify user role" },
      500,
    );
  }

  if (data?.rol !== "admin") {
    return jsonResponse(
      { error: "Admin role required" },
      403,
    );
  }

  return auth;
}

function getPath(req: Request) {
  return new URL(req.url)
    .pathname
    .split("/")
    .filter(Boolean)
    .at(-1) ?? "";
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function normalizeMeetingLink(payload: AdminPayload) {
  const raw =
    payload.enlace_reunion ??
    payload.link ??
    payload.url ??
    payload.enlace ??
    null;

  if (typeof raw !== "string") {
    return null;
  }

  const link = raw.trim();

  return link.length > 0 ? link : null;
}

function assertValidUrl(link: string) {
  try {
    const url = new URL(link);

    if (!["http:", "https:"].includes(url.protocol)) {
      throw new Error();
    }
  } catch {
    throw new Error("El enlace no es valido.");
  }
}

async function refreshGoogleAccessToken() {
  const body = new URLSearchParams({
    client_id: getRequiredEnv("GOOGLE_CLIENT_ID"),
    client_secret: getRequiredEnv("GOOGLE_CLIENT_SECRET"),
    refresh_token: getRequiredEnv("GOOGLE_REFRESH_TOKEN"),
    grant_type: "refresh_token",
  });

  const response = await fetch(
    "https://oauth2.googleapis.com/token",
    {
      method: "POST",
      headers: {
        "Content-Type":
          "application/x-www-form-urlencoded",
      },
      body,
    },
  );

  const payload =
    (await response.json()) as GoogleTokenResponse;

  if (!response.ok || !payload.access_token) {
    throw new Error(
      payload.error_description ??
        payload.error ??
        "No se pudo refrescar el token",
    );
  }

  return payload.access_token;
}

function extractMeetLink(
  payload: GoogleCalendarEventResponse,
) {
  return (
    payload.hangoutLink ??
    payload.conferenceData?.entryPoints?.find(
      (entry) => entry.uri,
    )?.uri ??
    null
  );
}

async function createGoogleMeetEvent(
  input: GoogleMeetEventInput,
) {
  const accessToken =
    await refreshGoogleAccessToken();

  const calendarId =
    Deno.env.get("GOOGLE_CALENDAR_ID") ||
    "primary";

  const start = new Date(input.start);

  if (Number.isNaN(start.getTime())) {
    throw new Error("Fecha invalida");
  }

  const durationMinutes =
    input.durationMinutes ?? 60;

  const end = new Date(
    start.getTime() + durationMinutes * 60_000,
  );

  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?conferenceDataVersion=1`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        summary: input.summary,
        description: input.description,
        start: {
          dateTime: start.toISOString(),
        },
        end: {
          dateTime: end.toISOString(),
        },
        conferenceData: {
          createRequest: {
            requestId: crypto.randomUUID(),
            conferenceSolutionKey: {
              type: "hangoutsMeet",
            },
          },
        },
      }),
    },
  );

  const data =
    (await response.json()) as GoogleCalendarEventResponse;

  if (!response.ok) {
    throw new Error(
      "No se pudo crear la reunion",
    );
  }

  const meetLink = extractMeetLink(data);

  if (!meetLink) {
    throw new Error(
      "Google Meet no devolvio link",
    );
  }

  return {
    meetLink,
    googleEventId: data.id ?? null,
    googleCalendarLink:
      data.htmlLink ?? null,
  };
}

async function getDashboard(
  userClient: ReturnType<
    typeof getUserClient
  >,
) {
  const [users, tickets, comments, events] =
    await Promise.all([
      userClient
        .from("usuarios")
        .select(USER_COLUMNS)
        .order("created_at", {
          ascending: false,
        }),

      userClient
        .from("tickets")
        .select(
          `${TICKET_COLUMNS}, usuarios:user_id(nombre, email, rol)`,
        )
        .order("created_at", {
          ascending: false,
        }),

      userClient
        .from("comentarios")
        .select(
          `${COMMENT_COLUMNS}, usuarios:user_id(nombre, email)`,
        )
        .order("created_at", {
          ascending: true,
        }),

      userClient
        .from("eventos")
        .select(EVENT_COLUMNS)
        .order("fecha", {
          ascending: true,
        }),
    ]);

  const firstError =
    users.error ??
    tickets.error ??
    comments.error ??
    events.error;

  if (firstError) {
    throw firstError;
  }

  return {
    users: users.data ?? [],
    tickets: tickets.data ?? [],
    comments: comments.data ?? [],
    events: events.data ?? [],
  };
}

async function createManagedUser(
  payload: AdminPayload,
) {
  const supabase = getServiceClient();

  const nombre = payload.nombre?.trim();
  const email = payload.email
    ? normalizeEmail(payload.email)
    : "";

  const rol = payload.rol;
  const password = payload.password ?? "";

  if (
    !nombre ||
    !email ||
    !rol ||
    !password
  ) {
    return jsonResponse(
      {
        error:
          "nombre, email, rol y password requeridos",
      },
      400,
    );
  }

  const { data: exists } = await supabase
    .from("usuarios")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (exists) {
    return jsonResponse(
      {
        error:
          "Ya existe un usuario con ese email",
      },
      409,
    );
  }

  const { data: authData, error: authError } =
    await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        nombre,
      },
    });

  if (authError || !authData.user) {
    return jsonResponse(
      {
        error:
          authError?.message ??
          "No se pudo crear usuario",
      },
      500,
    );
  }

  const { data, error } = await supabase
    .from("usuarios")
    .insert({
      id: authData.user.id,
      nombre,
      email,
      rol,
    })
    .select(USER_COLUMNS)
    .single();

  if (error) {
    await supabase.auth.admin.deleteUser(
      authData.user.id,
    );

    return jsonResponse(
      {
        error:
          "No se pudo crear perfil",
      },
      500,
    );
  }

  return jsonResponse(
    { user: data },
    201,
  );
}

async function updateManagedUser(
  payload: AdminPayload,
) {
  const supabase = getServiceClient();

  const id = payload.id?.trim();

  if (!id) {
    return jsonResponse(
      { error: "id requerido" },
      400,
    );
  }

  const { data: currentUser } =
    await supabase
      .from("usuarios")
      .select(USER_COLUMNS)
      .eq("id", id)
      .maybeSingle();

  if (!currentUser) {
    return jsonResponse(
      {
        error:
          "Usuario no encontrado",
      },
      404,
    );
  }

  const nextNombre =
    payload.nombre?.trim() ??
    currentUser.nombre;

  const nextEmail = payload.email
    ? normalizeEmail(payload.email)
    : currentUser.email;

  const nextRol =
    payload.rol ??
    currentUser.rol;

  const nextPassword =
    payload.password?.trim();

  const { data, error } = await supabase
    .from("usuarios")
    .update({
      nombre: nextNombre,
      email: nextEmail,
      rol: nextRol,
    })
    .eq("id", id)
    .select(USER_COLUMNS)
    .single();

  if (error) {
    return jsonResponse(
      {
        error:
          "No se pudo actualizar",
      },
      500,
    );
  }

  const authPayload: {
    email?: string;
    password?: string;
    user_metadata?: Record<
      string,
      unknown
    >;
  } = {
    email: nextEmail,
    user_metadata: {
      nombre: nextNombre,
    },
  };

  if (nextPassword) {
    authPayload.password =
      nextPassword;
  }

  const { error: authError } =
    await supabase.auth.admin.updateUserById(
      id,
      authPayload,
    );

  if (authError) {
    return jsonResponse(
      {
        error:
          authError.message,
      },
      500,
    );
  }

  return jsonResponse({
    user: data,
  });
}

async function deleteManagedUser(
  payload: AdminPayload,
  currentAdminId: string,
) {
  const supabase = getServiceClient();

  const id = payload.id?.trim();

  if (!id) {
    return jsonResponse(
      { error: "id requerido" },
      400,
    );
  }

  if (id === currentAdminId) {
    return jsonResponse(
      {
        error:
          "No puedes eliminarte",
      },
      400,
    );
  }

  const { error } =
    await supabase.auth.admin.deleteUser(
      id,
    );

  if (error) {
    return jsonResponse(
      {
        error:
          error.message,
      },
      500,
    );
  }

  return jsonResponse({
    ok: true,
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return optionsResponse();
  }

  try {
    const admin = await requireAdmin(req);

    if (admin instanceof Response) {
      return admin;
    }

    const userClient = getUserClient(
      admin.token,
    );

    const path = getPath(req);

    if (req.method === "GET") {
      if (
        path === "admin-api" ||
        path === "dashboard"
      ) {
        return jsonResponse(
          await getDashboard(userClient),
        );
      }

      return jsonResponse(
        {
          error:
            "Route not found",
        },
        404,
      );
    }

    const payload =
      (await req.json()) as AdminPayload;

    if (
      payload.action ===
      "update-ticket-status"
    ) {
      if (
        !payload.id ||
        !payload.estado
      ) {
        return jsonResponse(
          {
            error:
              "id y estado requeridos",
          },
          400,
        );
      }

      const { data, error } =
        await userClient
          .from("tickets")
          .update({
            estado:
              payload.estado,
          })
          .eq("id", payload.id)
          .select(
            `${TICKET_COLUMNS}, usuarios:user_id(nombre, email, rol)`,
          )
          .single();

      if (error) {
        throw error;
      }

      return jsonResponse({
        ticket: data,
      });
    }

    if (
      payload.action ===
      "add-comment"
    ) {
      const { data, error } =
        await userClient
          .from("comentarios")
          .insert({
            ticket_id:
              payload.ticket_id,
            user_id:
              admin.user.id,
            mensaje:
              payload.mensaje?.trim(),
          })
          .select(
            `${COMMENT_COLUMNS}, usuarios:user_id(nombre, email)`,
          )
          .single();

      if (error) {
        throw error;
      }

      return jsonResponse(
        {
          comment: data,
        },
        201,
      );
    }

    if (
      payload.action ===
      "create-user"
    ) {
      return await createManagedUser(
        payload,
      );
    }

    if (
      payload.action ===
      "update-user"
    ) {
      return await updateManagedUser(
        payload,
      );
    }

    if (
      payload.action ===
      "delete-user"
    ) {
      return await deleteManagedUser(
        payload,
        admin.user.id,
      );
    }

    if (
      payload.action ===
      "create-event"
    ) {
      if (
        !payload.titulo?.trim() ||
        !payload.descripcion?.trim() ||
        !payload.fecha
      ) {
        return jsonResponse(
          {
            error:
              "titulo, descripcion y fecha requeridos",
          },
          400,
        );
      }

      let enlaceReunion =
        normalizeMeetingLink(
          payload,
        );

      if (enlaceReunion) {
        assertValidUrl(
          enlaceReunion,
        );
      }

      if (
        payload.plataforma ===
          "google_meet" &&
        !enlaceReunion
      ) {
        const meet =
          await createGoogleMeetEvent(
            {
              summary:
                payload.titulo.trim(),
              description:
                payload.descripcion.trim(),
              start:
                payload.fecha,
              durationMinutes:
                payload.durationMinutes,
            },
          );

        enlaceReunion =
          meet.meetLink;
      }

      const { data, error } =
        await userClient
          .from("eventos")
          .insert({
            titulo:
              payload.titulo.trim(),
            descripcion:
              payload.descripcion.trim(),
            fecha:
              payload.fecha,
            plataforma:
              payload.plataforma ??
              "otro",
            enlace_reunion:
              enlaceReunion,
          })
          .select(EVENT_COLUMNS)
          .single();

      if (error) {
        throw error;
      }

      return jsonResponse(
        {
          event: data,
        },
        201,
      );
    }

    return jsonResponse(
      {
        error:
          "Unknown action",
      },
      400,
    );
  } catch (error) {
    console.error(
      "ADMIN EDGE ERROR:",
      error,
    );

    return jsonResponse(
      {
        error:
          error instanceof Error
            ? error.message
            : "Internal server error",
      },
      500,
    );
  }
});
