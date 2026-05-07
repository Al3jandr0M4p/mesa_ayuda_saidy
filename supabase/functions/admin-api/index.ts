import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { requireAdmin } from "../_shared/auth.ts";
import { jsonResponse, optionsResponse } from "../_shared/http.ts";
import { createGoogleMeetEvent } from "../_shared/google.ts";
import { getUserClient } from "../_shared/supabase.ts";

const USER_COLUMNS = "id, nombre, email, rol, created_at, updated_at";
const TICKET_COLUMNS = "id, titulo, descripcion, prioridad, estado, user_id, created_at, updated_at";
const COMMENT_COLUMNS = "id, ticket_id, user_id, mensaje, created_at";
const EVENT_COLUMNS = "id, titulo, descripcion, fecha, plataforma, enlace_reunion, created_at";

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
  durationMinutes?: number;
  nombre?: string;
  email?: string;
  rol?: "admin" | "empleado";
  password?: string;
};

function getPath(req: Request) {
  return new URL(req.url).pathname.split("/").filter(Boolean).at(-1) ?? "";
}

async function getDashboard(userClient: ReturnType<typeof getUserClient>) {
  const [users, tickets, comments, events] = await Promise.all([
    userClient.from("usuarios").select(USER_COLUMNS).order("created_at", { ascending: false }),
    userClient
      .from("tickets")
      .select(`${TICKET_COLUMNS}, usuarios:user_id(nombre, email, rol)`)
      .order("created_at", { ascending: false }),
    userClient
      .from("comentarios")
      .select(`${COMMENT_COLUMNS}, usuarios:user_id(nombre, email)`)
      .order("created_at", { ascending: true }),
    userClient.from("eventos").select(EVENT_COLUMNS).order("fecha", { ascending: true }),
  ]);

  const firstError = users.error ?? tickets.error ?? comments.error ?? events.error;

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

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

async function createManagedUser(payload: AdminPayload) {
  const serviceClient = getServiceClient();
  const nombre = payload.nombre?.trim();
  const email = payload.email ? normalizeEmail(payload.email) : "";
  const rol = payload.rol;
  const password = payload.password ?? "";

  if (!nombre || !email || !rol || !password) {
    return jsonResponse({ error: "nombre, email, rol y password son requeridos." }, 400);
  }

  if (password.length < 6) {
    return jsonResponse({ error: "La password debe tener al menos 6 caracteres." }, 400);
  }

  const { data: existing, error: existingError } = await serviceClient
    .from("usuarios")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (existingError) {
    return jsonResponse({ error: "No se pudo validar el email." }, 500);
  }

  if (existing) {
    return jsonResponse({ error: "Ya existe un usuario con ese email." }, 409);
  }

  const { data: authData, error: authError } = await serviceClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { nombre },
  });

  if (authError || !authData.user) {
    return jsonResponse({ error: authError?.message ?? "No se pudo crear el usuario auth." }, 500);
  }

  const { data: profile, error: profileError } = await serviceClient
    .from("usuarios")
    .insert({
      id: authData.user.id,
      nombre,
      email,
      rol,
    })
    .select(USER_COLUMNS)
    .single();

  if (profileError || !profile) {
    await serviceClient.auth.admin.deleteUser(authData.user.id);
    return jsonResponse({ error: profileError?.message ?? "No se pudo crear el perfil del usuario." }, 500);
  }

  return jsonResponse({ user: profile }, 201);
}

async function updateManagedUser(payload: AdminPayload) {
  const serviceClient = getServiceClient();
  const id = payload.id?.trim();

  if (!id) {
    return jsonResponse({ error: "id es requerido." }, 400);
  }

  const { data: currentUser, error: currentUserError } = await serviceClient
    .from("usuarios")
    .select(USER_COLUMNS)
    .eq("id", id)
    .maybeSingle();

  if (currentUserError) {
    return jsonResponse({ error: "No se pudo cargar el usuario." }, 500);
  }

  if (!currentUser) {
    return jsonResponse({ error: "Usuario no encontrado." }, 404);
  }

  const nextNombre = payload.nombre?.trim() || currentUser.nombre;
  const nextEmail = payload.email ? normalizeEmail(payload.email) : currentUser.email;
  const nextRol = payload.rol ?? currentUser.rol;
  const nextPassword = payload.password?.trim();

  if (!nextNombre || !nextEmail || !nextRol) {
    return jsonResponse({ error: "nombre, email y rol son requeridos." }, 400);
  }

  if (nextPassword && nextPassword.length < 6) {
    return jsonResponse({ error: "La password debe tener al menos 6 caracteres." }, 400);
  }

  const { data: duplicateUser, error: duplicateError } = await serviceClient
    .from("usuarios")
    .select("id")
    .eq("email", nextEmail)
    .neq("id", id)
    .maybeSingle();

  if (duplicateError) {
    return jsonResponse({ error: "No se pudo validar el email." }, 500);
  }

  if (duplicateUser) {
    return jsonResponse({ error: "Ya existe otro usuario con ese email." }, 409);
  }

  const { data: profile, error: profileError } = await serviceClient
    .from("usuarios")
    .update({
      nombre: nextNombre,
      email: nextEmail,
      rol: nextRol,
    })
    .eq("id", id)
    .select(USER_COLUMNS)
    .single();

  if (profileError || !profile) {
    return jsonResponse({ error: profileError?.message ?? "No se pudo actualizar el perfil." }, 500);
  }

  const authUpdates: { email?: string; password?: string; user_metadata?: Record<string, unknown> } = {
    email: nextEmail,
    user_metadata: { nombre: nextNombre },
  };

  if (nextPassword) {
    authUpdates.password = nextPassword;
  }

  const { error: authError } = await serviceClient.auth.admin.updateUserById(id, authUpdates);

  if (authError) {
    await serviceClient
      .from("usuarios")
      .update({
        nombre: currentUser.nombre,
        email: currentUser.email,
        rol: currentUser.rol,
      })
      .eq("id", id);

    return jsonResponse({ error: authError.message }, 500);
  }

  return jsonResponse({ user: profile });
}

async function deleteManagedUser(payload: AdminPayload, currentAdminId: string) {
  const serviceClient = getServiceClient();
  const id = payload.id?.trim();

  if (!id) {
    return jsonResponse({ error: "id es requerido." }, 400);
  }

  if (id === currentAdminId) {
    return jsonResponse({ error: "No puedes eliminar tu propio usuario." }, 400);
  }

  const { data: currentUser, error: currentUserError } = await serviceClient
    .from("usuarios")
    .select("id, rol")
    .eq("id", id)
    .maybeSingle();

  if (currentUserError) {
    return jsonResponse({ error: "No se pudo cargar el usuario." }, 500);
  }

  if (!currentUser) {
    return jsonResponse({ error: "Usuario no encontrado." }, 404);
  }

  if (currentUser.rol === "admin") {
    const { count, error: adminCountError } = await serviceClient
      .from("usuarios")
      .select("id", { count: "exact", head: true })
      .eq("rol", "admin");

    if (adminCountError) {
      return jsonResponse({ error: "No se pudo validar el total de administradores." }, 500);
    }

    if ((count ?? 0) <= 1) {
      return jsonResponse({ error: "No puedes eliminar el ultimo administrador." }, 400);
    }
  }

  const { error: authError } = await serviceClient.auth.admin.deleteUser(id);

  if (authError) {
    return jsonResponse({ error: authError.message }, 500);
  }

  return jsonResponse({ ok: true });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return optionsResponse();
  }

  const admin = await requireAdmin(req);

  if (admin instanceof Response) {
    return admin;
  }

  const userClient = getUserClient(admin.token);
  const path = getPath(req);

  try {
    if (req.method === "GET") {
      if (path === "admin-api" || path === "dashboard") {
        return jsonResponse(await getDashboard(userClient));
      }

      return jsonResponse({ error: "Route not found" }, 404);
    }

    if (!["POST", "PATCH", "DELETE"].includes(req.method)) {
      return jsonResponse({ error: "Method not allowed" }, 405);
    }

    const payload = (await req.json()) as AdminPayload;

    if (payload.action === "update-ticket-status") {
      if (!payload.id || !payload.estado) {
        return jsonResponse({ error: "id y estado son requeridos." }, 400);
      }

      const { data, error } = await userClient
        .from("tickets")
        .update({ estado: payload.estado })
        .eq("id", payload.id)
        .select(`${TICKET_COLUMNS}, usuarios:user_id(nombre, email, rol)`)
        .single();

      if (error) {
        throw error;
      }

      return jsonResponse({ ticket: data });
    }

    if (payload.action === "add-comment") {
      if (!payload.ticket_id || !payload.mensaje?.trim()) {
        return jsonResponse({ error: "ticket_id y mensaje son requeridos." }, 400);
      }

      const { data, error } = await userClient
        .from("comentarios")
        .insert({
          ticket_id: payload.ticket_id,
          user_id: admin.user.id,
          mensaje: payload.mensaje.trim(),
        })
        .select(`${COMMENT_COLUMNS}, usuarios:user_id(nombre, email)`)
        .single();

      if (error) {
        throw error;
      }

      return jsonResponse({ comment: data }, 201);
    }

    if (payload.action === "create-user") {
      return await createManagedUser(payload);
    }

    if (payload.action === "update-user") {
      return await updateManagedUser(payload);
    }

    if (payload.action === "delete-user") {
      return await deleteManagedUser(payload, admin.user.id);
    }

    if (payload.action === "create-event") {
      if (!payload.titulo?.trim() || !payload.descripcion?.trim() || !payload.fecha) {
        return jsonResponse({ error: "Titulo, descripcion y fecha son requeridos." }, 400);
      }

      let enlaceReunion = payload.enlace_reunion?.trim() || null;

      if (payload.plataforma === "google_meet" && !enlaceReunion) {
        const meet = await createGoogleMeetEvent({
          summary: payload.titulo.trim(),
          description: payload.descripcion.trim(),
          start: payload.fecha,
          durationMinutes: payload.durationMinutes,
        });

        enlaceReunion = meet.meetLink;
      }

      const { data, error } = await userClient
        .from("eventos")
        .insert({
          titulo: payload.titulo.trim(),
          descripcion: payload.descripcion.trim(),
          fecha: payload.fecha,
          plataforma: payload.plataforma ?? "otro",
          enlace_reunion: enlaceReunion,
        })
        .select(EVENT_COLUMNS)
        .single();

      if (error) {
        throw error;
      }

      return jsonResponse({ event: data }, 201);
    }

    return jsonResponse({ error: "Unknown action" }, 400);
  } catch (error) {
    console.error("ADMIN EDGE ERROR:", error);

    return jsonResponse(
      {
        error: error instanceof Error ? error.message : "No se pudo procesar la solicitud admin.",
      },
      500,
    );
  }
});
