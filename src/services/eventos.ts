import { supabase } from "./supabaseClient";
import type { Database, Event } from "../types/database";

const EVENT_COLUMNS = "id, titulo, descripcion, fecha, plataforma, enlace_reunion, created_at";

export async function obtenerEventos() {
  const { data, error } = await supabase
    .from("eventos")
    .select(EVENT_COLUMNS)
    .order("fecha", { ascending: true });

  if (error) {
    throw new Error("No se pudieron cargar los eventos.");
  }

  return (data ?? []) as Event[];
}

export async function crearEvento(input: { titulo: string; descripcion: string; fecha: string }) {
  const payload: Database["public"]["Tables"]["eventos"]["Insert"] = input;

  const { data, error } = await supabase
    .from("eventos")
    .insert([payload as never])
    .select(EVENT_COLUMNS)
    .single();

  if (error) {
    throw new Error("No se pudo crear el evento.");
  }

  return data as Event;
}
