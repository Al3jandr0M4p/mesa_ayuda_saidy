import { supabase } from "./supabaseClient";
import type { CommentWithUser, Event, TicketStatus, TicketWithUser, UserProfile, UserRole } from "../types/database";

type LoginResponse = {
  ok: boolean;
  profile: UserProfile;
};

export type AdminDashboardData = {
  users: UserProfile[];
  tickets: TicketWithUser[];
  comments: CommentWithUser[];
  events: Event[];
};

type ProtectedTestResponse = {
  ok: boolean;
  message: string;
  user: {
    id: string;
    email?: string;
  };
};

async function getEdgeFunctionErrorMessage(error: unknown) {
  if (error && typeof error === "object" && "context" in error) {
    const response = (error as { context?: unknown; message?: string }).context;

    if (response instanceof Response) {
      const body = await response.json().catch(() => null);
      return typeof body?.error === "string"
        ? body.error
        : (error as { message?: string }).message ?? "Error inesperado";
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Error inesperado";
}

export async function callProtectedTest() {
  const { data, error } = await supabase.functions.invoke<ProtectedTestResponse>("protected-test", {
    method: "GET",
  });

  if (error) {
    throw new Error(await getEdgeFunctionErrorMessage(error));
  }

  return data;
}

export async function loginWithEdgeFunction(email: string, password: string) {
  const { error: loginError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (loginError) {
    throw new Error(loginError.message);
  }

  const { data, error } = await supabase.functions.invoke<LoginResponse>("auth-login", {
    method: "GET",
  });

  if (error) {
    throw new Error(await getEdgeFunctionErrorMessage(error));
  }

  if (!data?.profile) {
    throw new Error("La funcion de login no devolvio el perfil del usuario.");
  }

  return data.profile;
}

export async function obtenerDashboardAdmin() {
  const { data, error } = await supabase.functions.invoke<AdminDashboardData>("admin-api", {
    method: "GET",
  });

  if (error) {
    throw new Error(await getEdgeFunctionErrorMessage(error));
  }

  if (!data) {
    throw new Error("La funcion admin no devolvio datos.");
  }

  return data;
}

export async function actualizarEstadoTicketAdmin(id: string, estado: TicketStatus) {
  const { data, error } = await supabase.functions.invoke<{ ticket: TicketWithUser }>("admin-api", {
    method: "POST",
    body: { action: "update-ticket-status", id, estado },
  });

  if (error) {
    throw new Error(await getEdgeFunctionErrorMessage(error));
  }

  if (!data?.ticket) {
    throw new Error("No se recibio el ticket actualizado.");
  }

  return data.ticket;
}

export async function crearComentarioAdmin(ticketId: string, mensaje: string) {
  const { data, error } = await supabase.functions.invoke<{ comment: CommentWithUser }>("admin-api", {
    method: "POST",
    body: { action: "add-comment", ticket_id: ticketId, mensaje },
  });

  if (error) {
    throw new Error(await getEdgeFunctionErrorMessage(error));
  }

  if (!data?.comment) {
    throw new Error("No se recibio el comentario creado.");
  }

  return data.comment;
}

export async function crearEventoAdmin(input: {
  titulo: string;
  descripcion: string;
  fecha: string;
  plataforma: Event["plataforma"];
  enlace_reunion?: string | null;
}) {
  const { data, error } = await supabase.functions.invoke<{ event: Event }>("admin-api", {
    method: "POST",
    body: { action: "create-event", ...input },
  });

  if (error) {
    throw new Error(await getEdgeFunctionErrorMessage(error));
  }

  if (!data?.event) {
    throw new Error("No se recibio el evento creado.");
  }

  return data.event;
}

export async function crearUsuarioAdmin(input: {
  nombre: string;
  email: string;
  rol: UserRole;
  password: string;
}) {
  const { data, error } = await supabase.functions.invoke<{ user: UserProfile }>("admin-api", {
    method: "POST",
    body: { action: "create-user", ...input },
  });

  if (error) {
    throw new Error(await getEdgeFunctionErrorMessage(error));
  }

  if (!data?.user) {
    throw new Error("No se recibio el usuario creado.");
  }

  return data.user;
}

export async function actualizarUsuarioAdmin(input: {
  id: string;
  nombre: string;
  email: string;
  rol: UserRole;
  password?: string;
}) {
  const { data, error } = await supabase.functions.invoke<{ user: UserProfile }>("admin-api", {
    method: "POST",
    body: { action: "update-user", ...input },
  });

  if (error) {
    throw new Error(await getEdgeFunctionErrorMessage(error));
  }

  if (!data?.user) {
    throw new Error("No se recibio el usuario actualizado.");
  }

  return data.user;
}

export async function eliminarUsuarioAdmin(id: string) {
  const { data, error } = await supabase.functions.invoke<{ ok: true }>("admin-api", {
    method: "POST",
    body: { action: "delete-user", id },
  });

  if (error) {
    throw new Error(await getEdgeFunctionErrorMessage(error));
  }

  if (!data?.ok) {
    throw new Error("No se pudo eliminar el usuario.");
  }

  return true;
}
