import type { Ticket, TicketPriority } from "../../types/database";

export const prioridadesTicketEmpleada: TicketPriority[] = ["baja", "media", "alta"];

export const estilosPrioridadTicketEmpleada: Record<TicketPriority, string> = {
  baja: "bg-sky-50 text-sky-700",
  media: "bg-amber-50 text-amber-700",
  alta: "bg-rose-50 text-rose-700",
};

export const estilosEstadoTicketEmpleada: Record<Ticket["estado"], string> = {
  abierto: "bg-rose-50 text-rose-700",
  en_progreso: "bg-amber-50 text-amber-700",
  cerrado: "bg-emerald-50 text-emerald-700",
};

export const etiquetasPrioridadTicketEmpleada: Record<TicketPriority, string> = {
  baja: "Baja",
  media: "Media",
  alta: "Alta",
};

export const etiquetasEstadoTicketEmpleada: Record<Ticket["estado"], string> = {
  abierto: "Pendiente",
  en_progreso: "En proceso",
  cerrado: "Resuelto",
};
