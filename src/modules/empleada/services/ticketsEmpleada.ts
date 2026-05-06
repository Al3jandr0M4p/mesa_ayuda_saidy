import { supabase } from "../../../services/supabaseClient";
import type { Comment, Database, Ticket, TicketPriority } from "../../../types/database";

type CrearTicketEmpleadaInput = {
  titulo: string;
  descripcion: string;
  prioridad: TicketPriority;
  userId: string;
};

const TICKET_COLUMNS = "id, titulo, descripcion, prioridad, estado, user_id, created_at, updated_at";

export async function obtenerTicketsEmpleada(userId: string) {
  const { data, error } = await supabase
    .from("tickets")
    .select(TICKET_COLUMNS)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error("No se pudieron cargar tus tickets.");
  }

  return (data ?? []) as Ticket[];
}

export async function crearTicketEmpleada({ titulo, descripcion, prioridad, userId }: CrearTicketEmpleadaInput) {
  const payload: Database["public"]["Tables"]["tickets"]["Insert"] = {
    titulo,
    descripcion,
    prioridad,
    estado: "abierto",
    user_id: userId,
  };

  const { data, error } = await (supabase
    .from("tickets") as any)
    .insert([payload])
    .select(TICKET_COLUMNS)
    .single();

  if (error) {
    throw new Error("No se pudo crear el ticket. Intenta nuevamente.");
  }

  return data as Ticket;
}

export async function obtenerDetalleTicketEmpleada(ticketId: string, userId: string) {
  const { data, error } = await supabase
    .from("tickets")
    .select(TICKET_COLUMNS)
    .eq("id", ticketId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error("No se pudo cargar el detalle del ticket.");
  }

  if (!data) {
    throw new Error("El ticket no existe o no te pertenece.");
  }

  return data as Ticket;
}

export async function obtenerComentariosTicketEmpleada(ticketId: string) {
  const { data, error } = await supabase
    .from("comentarios")
    .select("id, ticket_id, user_id, mensaje, created_at")
    .eq("ticket_id", ticketId)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error("No se pudo cargar el historial de comentarios.");
  }

  return (data ?? []) as Comment[];
}

export async function crearComentarioTicketEmpleada({
  ticketId,
  userId,
  mensaje,
}: {
  ticketId: string;
  userId: string;
  mensaje: string;
}) {
  const payload: Database["public"]["Tables"]["comentarios"]["Insert"] = {
    ticket_id: ticketId,
    user_id: userId,
    mensaje,
  };

  const { data, error } = await (supabase
    .from("comentarios") as any)
    .insert([payload])
    .select("id, ticket_id, user_id, mensaje, created_at")
    .single();

  if (error) {
    throw new Error("No se pudo guardar el comentario.");
  }

  return data as Comment;
}
