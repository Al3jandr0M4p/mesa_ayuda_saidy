import { useEffect, useMemo, useState, type FormEvent } from "react";
import type { DateSelectArg, EventClickArg } from "@fullcalendar/core";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import timeGridPlugin from "@fullcalendar/timegrid";
import {
  CalendarPlus,
  ExternalLink,
  Link as LinkIcon,
  LoaderCircle,
  MapPin,
  MessageSquareText,
  PencilLine,
  Send,
  ShieldCheck,
  Trash2,
  TicketCheck,
  UserCog,
  UserPlus,
  UsersRound,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import {
  actualizarEstadoTicketAdmin,
  actualizarUsuarioAdmin,
  crearComentarioAdmin,
  crearEventoAdmin,
  crearUsuarioAdmin,
  eliminarUsuarioAdmin,
  obtenerDashboardAdmin,
  type AdminDashboardData,
} from "../services/edgeFunctions";
import type { CommentWithUser, Event, EventPlatform, TicketStatus, TicketWithUser } from "../types/database";
import {
  estilosEstadoTicketEmpleada,
  estilosPrioridadTicketEmpleada,
  etiquetasEstadoTicketEmpleada,
  etiquetasPlataformaEvento,
  etiquetasPrioridadTicketEmpleada,
} from "../modules/empleada/constantes";
import { formatearFechaTicketEmpleada } from "../modules/empleada/utilidades";

const estadosTicket: TicketStatus[] = ["abierto", "en_progreso", "cerrado"];

const plataformasReunion: Array<{ value: EventPlatform; label: string }> = [
  { value: "google_meet", label: "Google Meet" },
  { value: "microsoft_teams", label: "Microsoft Teams" },
  { value: "zoom", label: "Zoom" },
  { value: "presencial", label: "Presencial" },
  { value: "otro", label: "Otro" },
];

const toDatetimeLocalValue = (value: Date | string) => {
  const date = typeof value === "string" ? new Date(value) : value;
  const timezoneOffset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - timezoneOffset).toISOString().slice(0, 16);
};

const emptyAdminData: AdminDashboardData = {
  users: [],
  tickets: [],
  comments: [],
  events: [],
};

export function AdminDashboardPage() {
  const { profile } = useAuth();
  const [data, setData] = useState<AdminDashboardData>(emptyAdminData);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [fecha, setFecha] = useState("");
  const [plataforma, setPlataforma] = useState<EventPlatform>("google_meet");
  const [enlaceReunion, setEnlaceReunion] = useState("");
  const [userNombre, setUserNombre] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userRol, setUserRol] = useState<"admin" | "empleado">("empleado");
  const [userPassword, setUserPassword] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmittingUser, setIsSubmittingUser] = useState(false);
  const [isSubmittingEvent, setIsSubmittingEvent] = useState(false);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [updatingTicketId, setUpdatingTicketId] = useState<string | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const cargarDashboard = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const dashboardData = await obtenerDashboardAdmin();
        setData(dashboardData);
        setSelectedTicketId(dashboardData.tickets[0]?.id ?? null);
      } catch (nextError) {
        setError(nextError instanceof Error ? nextError.message : "No se pudo cargar el panel admin.");
      } finally {
        setIsLoading(false);
      }
    };

    void cargarDashboard();
  }, []);

  const selectedTicket = useMemo(
    () => data.tickets.find((ticket) => ticket.id === selectedTicketId) ?? null,
    [data.tickets, selectedTicketId],
  );

  const selectedComments = useMemo(
    () => data.comments.filter((comment) => comment.ticket_id === selectedTicketId),
    [data.comments, selectedTicketId],
  );

  const selectedUser = useMemo(
    () => data.users.find((user) => user.id === selectedUserId) ?? null,
    [data.users, selectedUserId],
  );

  const stats = useMemo(
    () => [
      {
        label: "Usuarios",
        value: data.users.length,
        icon: UsersRound,
        tone: "bg-sky-50 text-sky-700",
      },
      {
        label: "Tickets abiertos",
        value: data.tickets.filter((ticket) => ticket.estado !== "cerrado").length,
        icon: TicketCheck,
        tone: "bg-emerald-50 text-emerald-700",
      },
      {
        label: "Comentarios",
        value: data.comments.length,
        icon: MessageSquareText,
        tone: "bg-violet-50 text-violet-700",
      },
    ],
    [data],
  );

  const calendarEvents = useMemo(
    () =>
      data.events.map((event) => ({
        id: event.id,
        title: event.titulo,
        start: event.fecha,
        extendedProps: {
          descripcion: event.descripcion,
          plataforma: event.plataforma,
          enlaceReunion: event.enlace_reunion,
        },
      })),
    [data.events],
  );

  const replaceTicket = (nextTicket: TicketWithUser) => {
    setData((current) => ({
      ...current,
      tickets: current.tickets.map((ticket) => (ticket.id === nextTicket.id ? nextTicket : ticket)),
    }));
  };

  const appendEvent = (event: Event) => {
    setData((current) => ({
      ...current,
      events: [...current.events, event].sort((a, b) => a.fecha.localeCompare(b.fecha)),
    }));
  };

  const replaceUser = (nextUser: (typeof data.users)[number]) => {
    setData((current) => ({
      ...current,
      users: current.users.map((user) => (user.id === nextUser.id ? nextUser : user)),
    }));
  };

  const appendUser = (nextUser: (typeof data.users)[number]) => {
    setData((current) => ({
      ...current,
      users: [...current.users, nextUser].sort((a, b) => b.created_at.localeCompare(a.created_at)),
    }));
  };

  const removeUser = (userId: string) => {
    setData((current) => ({
      ...current,
      users: current.users.filter((user) => user.id !== userId),
    }));
  };

  const clearUserForm = () => {
    setSelectedUserId(null);
    setUserNombre("");
    setUserEmail("");
    setUserRol("empleado");
    setUserPassword("");
  };

  const loadUserForm = (user: (typeof data.users)[number]) => {
    setSelectedUserId(user.id);
    setUserNombre(user.nombre);
    setUserEmail(user.email);
    setUserRol(user.rol);
    setUserPassword("");
  };

  const handleUserSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!userNombre.trim() || !userEmail.trim()) {
      setError("Completa nombre y email del usuario.");
      return;
    }

    if (!selectedUserId && userPassword.trim().length < 6) {
      setError("La password debe tener al menos 6 caracteres.");
      return;
    }

    setIsSubmittingUser(true);

    try {
      if (selectedUserId) {
        const updatedUser = await actualizarUsuarioAdmin({
          id: selectedUserId,
          nombre: userNombre.trim(),
          email: userEmail.trim(),
          rol: userRol,
          password: userPassword.trim() || undefined,
        });

        replaceUser(updatedUser);
        setSuccess("Usuario actualizado.");
      } else {
        const createdUser = await crearUsuarioAdmin({
          nombre: userNombre.trim(),
          email: userEmail.trim(),
          rol: userRol,
          password: userPassword.trim(),
        });

        appendUser(createdUser);
        setSelectedUserId(createdUser.id);
        setSuccess("Usuario creado.");
      }

      setUserPassword("");
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "No se pudo guardar el usuario.");
    } finally {
      setIsSubmittingUser(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUserId) {
      return;
    }

    setError(null);
    setSuccess(null);
    setDeletingUserId(selectedUserId);

    try {
      await eliminarUsuarioAdmin(selectedUserId);
      removeUser(selectedUserId);
      clearUserForm();
      setSuccess("Usuario eliminado.");
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "No se pudo eliminar el usuario.");
    } finally {
      setDeletingUserId(null);
    }
  };

  const handleStatusChange = async (ticketId: string, estado: TicketStatus) => {
    setError(null);
    setSuccess(null);
    setUpdatingTicketId(ticketId);

    try {
      const nextTicket = await actualizarEstadoTicketAdmin(ticketId, estado);
      replaceTicket(nextTicket);
      setSuccess("Estado del ticket actualizado.");
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "No se pudo actualizar el ticket.");
    } finally {
      setUpdatingTicketId(null);
    }
  };

  const handleEventSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!titulo.trim() || !descripcion.trim() || !fecha) {
      setError("Completa titulo, descripcion y fecha del evento.");
      return;
    }

    if (plataforma !== "presencial" && plataforma !== "google_meet" && !enlaceReunion.trim()) {
      setError("Agrega el enlace de la reunion para la plataforma seleccionada.");
      return;
    }

    setIsSubmittingEvent(true);

    try {
      const createdEvent = await crearEventoAdmin({
        titulo: titulo.trim(),
        descripcion: descripcion.trim(),
        fecha: new Date(fecha).toISOString(),
        plataforma,
        enlace_reunion: enlaceReunion.trim() || null,
      });

      appendEvent(createdEvent);
      setTitulo("");
      setDescripcion("");
      setFecha("");
      setPlataforma("google_meet");
      setEnlaceReunion("");
      setSuccess("Reunion publicada correctamente.");
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "No se pudo crear el evento.");
    } finally {
      setIsSubmittingEvent(false);
    }
  };

  const handleDateSelect = (selection: DateSelectArg) => {
    setFecha(toDatetimeLocalValue(selection.start));
    setSuccess("Fecha seleccionada en el calendario.");
    setError(null);
  };

  const handleCalendarEventClick = (eventClick: EventClickArg) => {
    const clickedEvent = data.events.find((event) => event.id === eventClick.event.id);

    if (!clickedEvent) {
      return;
    }

    setTitulo(clickedEvent.titulo);
    setDescripcion(clickedEvent.descripcion);
    setFecha(toDatetimeLocalValue(clickedEvent.fecha));
    setPlataforma(clickedEvent.plataforma);
    setEnlaceReunion(clickedEvent.enlace_reunion ?? "");
    setSuccess("Reunion cargada en el formulario.");
    setError(null);
  };

  const handleCommentSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!selectedTicketId) {
      setError("Selecciona un ticket antes de comentar.");
      return;
    }

    if (!mensaje.trim()) {
      setError("Escribe un comentario antes de enviarlo.");
      return;
    }

    setIsSubmittingComment(true);

    try {
      const comment = await crearComentarioAdmin(selectedTicketId, mensaje.trim());
      setData((current) => ({ ...current, comments: [...current.comments, comment] }));
      setMensaje("");
      setSuccess("Comentario agregado al ticket.");
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "No se pudo agregar el comentario.");
    } finally {
      setIsSubmittingComment(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-80 items-center justify-center gap-3 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-500 shadow-sm">
        <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
        Cargando panel administrativo...
      </div>
    );
  }

  return (
    <section className="space-y-6">
      <div className="rounded-lg border border-slate-800 bg-slate-950 p-6 text-white shadow-sm">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-300">Administrador</p>
            <h1 className="mt-2 text-3xl font-black">Panel administrativo</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
              Sesion activa para {profile?.nombre ?? "administrador"}. Desde aqui puedes ver usuarios, gestionar
              tickets, cambiar estados, comentar y publicar eventos.
            </p>
          </div>

          <div className="flex w-full items-center gap-3 rounded-lg border border-white/10 bg-white/10 p-4 md:w-auto">
            <div className="grid h-11 w-11 place-items-center rounded-lg bg-emerald-300 text-emerald-950">
              <ShieldCheck className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <p className="text-2xl font-black">{data.tickets.length}</p>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-300">Tickets totales</p>
            </div>
          </div>
        </div>
      </div>

      {(error || success) && (
        <div
          className={[
            "rounded-lg px-4 py-3 text-sm font-medium",
            error ? "border border-red-200 bg-red-50 text-red-700" : "border border-emerald-200 bg-emerald-50 text-emerald-700",
          ].join(" ")}
        >
          {error ?? success}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((stat) => (
          <article key={stat.label} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className={`mb-5 flex h-11 w-11 items-center justify-center rounded-lg ${stat.tone}`}>
              <stat.icon className="h-5 w-5" aria-hidden="true" />
            </div>
            <p className="text-3xl font-black">{String(stat.value).padStart(2, "0")}</p>
            <p className="mt-1 text-sm font-bold text-slate-500">{stat.label}</p>
          </article>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="text-base font-black">Tickets</h2>
            <p className="mt-1 text-sm text-slate-500">Todos los tickets registrados por empleados.</p>
          </div>

          {data.tickets.length === 0 ? (
            <div className="px-5 py-8 text-sm text-slate-500">Todavia no hay tickets creados.</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {data.tickets.map((ticket) => (
                <article
                  key={ticket.id}
                  role="button"
                  tabIndex={0}
                  className={[
                    "cursor-pointer px-5 py-4 transition hover:bg-slate-50",
                    selectedTicketId === ticket.id ? "bg-emerald-50/70" : "",
                  ].join(" ")}
                  onClick={() => setSelectedTicketId(ticket.id)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      setSelectedTicketId(ticket.id);
                    }
                  }}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="text-sm font-black text-slate-950">{ticket.titulo}</h3>
                      <p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-600">{ticket.descripcion}</p>
                      <p className="mt-2 text-xs font-medium text-slate-500">
                        {ticket.usuarios?.nombre ?? "Usuario"} · {ticket.usuarios?.email ?? ticket.user_id}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className={`rounded-md px-2.5 py-1 text-xs font-black ${estilosPrioridadTicketEmpleada[ticket.prioridad]}`}>
                        {etiquetasPrioridadTicketEmpleada[ticket.prioridad]}
                      </span>
                      <select
                        value={ticket.estado}
                        disabled={updatingTicketId === ticket.id}
                        onClick={(event) => event.stopPropagation()}
                        onChange={(event) => void handleStatusChange(ticket.id, event.target.value as TicketStatus)}
                        className={`h-8 rounded-md border-0 px-2 text-xs font-black outline-none ${estilosEstadoTicketEmpleada[ticket.estado]}`}
                      >
                        {estadosTicket.map((estado) => (
                          <option key={estado} value={estado}>
                            {etiquetasEstadoTicketEmpleada[estado]}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="text-base font-black">Detalle y comentarios</h2>
            <p className="mt-1 text-sm text-slate-500">Selecciona un ticket para responder.</p>
          </div>

          {!selectedTicket ? (
            <div className="px-5 py-8 text-sm text-slate-500">No hay ticket seleccionado.</div>
          ) : (
            <>
              <div className="space-y-3 px-5 py-5">
                <h3 className="text-lg font-black text-slate-950">{selectedTicket.titulo}</h3>
                <p className="whitespace-pre-line text-sm leading-7 text-slate-600">{selectedTicket.descripcion}</p>
                <div className="flex flex-wrap gap-2">
                  <span className={`rounded-md px-2.5 py-1 text-xs font-black ${estilosEstadoTicketEmpleada[selectedTicket.estado]}`}>
                    {etiquetasEstadoTicketEmpleada[selectedTicket.estado]}
                  </span>
                  <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-black text-slate-700">
                    {formatearFechaTicketEmpleada(selectedTicket.created_at)}
                  </span>
                </div>
              </div>

              <form className="border-y border-slate-200 px-5 py-5" onSubmit={handleCommentSubmit}>
                <label className="block">
                  <span className="mb-2 block text-sm font-bold text-slate-700">Nuevo comentario</span>
                  <textarea
                    value={mensaje}
                    onChange={(event) => setMensaje(event.target.value)}
                    rows={4}
                    placeholder="Escribe una respuesta o actualizacion."
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-950 outline-none transition focus:border-emerald-300 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                  />
                </label>

                <button
                  type="submit"
                  disabled={isSubmittingComment}
                  className="mt-4 inline-flex h-11 items-center gap-2 rounded-lg bg-emerald-400 px-4 text-sm font-black text-emerald-950 shadow-sm transition hover:bg-emerald-300 focus:outline-none focus:ring-4 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isSubmittingComment ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Send className="h-4 w-4" aria-hidden="true" />}
                  {isSubmittingComment ? "Enviando..." : "Agregar comentario"}
                </button>
              </form>

              {selectedComments.length === 0 ? (
                <div className="px-5 py-6 text-sm text-slate-500">Este ticket todavia no tiene comentarios.</div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {selectedComments.map((comment: CommentWithUser) => (
                    <article key={comment.id} className="px-5 py-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                          {comment.usuarios?.nombre ?? comment.user_id}
                        </p>
                        <p className="text-xs font-medium text-slate-500">
                          {formatearFechaTicketEmpleada(comment.created_at)}
                        </p>
                      </div>
                      <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-700">{comment.mensaje}</p>
                    </article>
                  ))}
                </div>
              )}
            </>
          )}
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-lg bg-slate-950 text-white">
              <CalendarPlus className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-950">Crear reunion</h2>
              <p className="mt-1 text-sm text-slate-500">Selecciona una fecha en el calendario o escribela manualmente.</p>
            </div>
          </div>

          <form className="mt-6 space-y-5" onSubmit={handleEventSubmit}>
            <label className="block">
              <span className="mb-2 block text-sm font-bold text-slate-700">Titulo</span>
              <input
                type="text"
                value={titulo}
                onChange={(event) => setTitulo(event.target.value)}
                className="h-12 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-950 outline-none transition focus:border-emerald-300 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                placeholder="Ej. Reunion de seguimiento"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-bold text-slate-700">Descripcion</span>
              <textarea
                value={descripcion}
                onChange={(event) => setDescripcion(event.target.value)}
                rows={4}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-950 outline-none transition focus:border-emerald-300 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                placeholder="Agenda, participantes o detalles importantes."
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-bold text-slate-700">Fecha</span>
              <input
                type="datetime-local"
                value={fecha}
                onChange={(event) => setFecha(event.target.value)}
                className="h-12 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-950 outline-none transition focus:border-emerald-300 focus:bg-white focus:ring-4 focus:ring-emerald-100"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-bold text-slate-700">Plataforma</span>
              <select
                value={plataforma}
                onChange={(event) => setPlataforma(event.target.value as EventPlatform)}
                className="h-12 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-950 outline-none transition focus:border-emerald-300 focus:bg-white focus:ring-4 focus:ring-emerald-100"
              >
                {plataformasReunion.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-700">
                <LinkIcon className="h-4 w-4" aria-hidden="true" />
                Enlace de reunion
              </span>
              <input
                type="url"
                value={enlaceReunion}
                onChange={(event) => setEnlaceReunion(event.target.value)}
                className="h-12 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-950 outline-none transition focus:border-emerald-300 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                placeholder={
                  plataforma === "microsoft_teams"
                    ? "https://teams.microsoft.com/l/meetup-join/..."
                    : plataforma === "google_meet"
                      ? "Pega un link de Meet o dejalo vacio para generarlo"
                      : "https://..."
                }
              />
              {plataforma === "google_meet" ? (
                <p className="mt-2 text-xs text-slate-500">
                  Si dejas este campo vacio, la reunion se crea en Google Calendar y el enlace de Meet se genera
                  automaticamente.
                </p>
              ) : null}
            </label>

            <button
              type="submit"
              disabled={isSubmittingEvent}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-emerald-400 px-4 text-sm font-black text-emerald-950 shadow-sm transition hover:bg-emerald-300 focus:outline-none focus:ring-4 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmittingEvent ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
              {isSubmittingEvent ? "Guardando..." : "Crear reunion"}
            </button>
          </form>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="text-base font-black">Calendario de reuniones</h2>
            <p className="mt-1 text-sm text-slate-500">Las reuniones creadas quedan visibles para empleados como eventos internos.</p>
          </div>

          <div className="admin-calendar p-4">
            <FullCalendar
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              headerToolbar={{
                left: "prev,next today",
                center: "title",
                right: "dayGridMonth,timeGridWeek,timeGridDay",
              }}
              buttonText={{
                today: "Hoy",
                month: "Mes",
                week: "Semana",
                day: "Dia",
              }}
              locale="es"
              selectable
              selectMirror
              nowIndicator
              height="auto"
              events={calendarEvents}
              select={handleDateSelect}
              eventClick={handleCalendarEventClick}
            />
          </div>
        </section>
      </div>

      <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="text-base font-black">Usuarios y reuniones</h2>
          <p className="mt-1 text-sm text-slate-500">Resumen operativo del sistema.</p>
        </div>

        <div className="grid gap-0 md:grid-cols-2">
          <div className="border-b border-slate-200 md:border-b-0 md:border-r">
            <div className="border-b border-slate-200 px-5 py-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-base font-black text-slate-950">Usuarios</h3>
                  <p className="mt-1 text-sm text-slate-500">Crear, editar y eliminar empleados o administradores.</p>
                </div>
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-emerald-50 text-emerald-700">
                  <UserCog className="h-5 w-5" aria-hidden="true" />
                </div>
              </div>
            </div>

            <form className="space-y-4 px-5 py-5" onSubmit={handleUserSubmit}>
              <label className="block">
                <span className="mb-2 block text-sm font-bold text-slate-700">Nombre</span>
                <input
                  type="text"
                  value={userNombre}
                  onChange={(event) => setUserNombre(event.target.value)}
                  className="h-12 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-950 outline-none transition focus:border-emerald-300 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                  placeholder="Ej. Ana Perez"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-bold text-slate-700">Email</span>
                <input
                  type="email"
                  value={userEmail}
                  onChange={(event) => setUserEmail(event.target.value)}
                  className="h-12 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-950 outline-none transition focus:border-emerald-300 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                  placeholder="usuario@empresa.com"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-bold text-slate-700">Rol</span>
                <select
                  value={userRol}
                  onChange={(event) => setUserRol(event.target.value as "admin" | "empleado")}
                  className="h-12 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-950 outline-none transition focus:border-emerald-300 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                >
                  <option value="empleado">Empleado</option>
                  <option value="admin">Administrador</option>
                </select>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-bold text-slate-700">
                  {selectedUserId ? "Nueva password" : "Password inicial"}
                </span>
                <input
                  type="password"
                  value={userPassword}
                  onChange={(event) => setUserPassword(event.target.value)}
                  className="h-12 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-950 outline-none transition focus:border-emerald-300 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                  placeholder={selectedUserId ? "Dejar vacio para no cambiar" : "Minimo 6 caracteres"}
                />
              </label>

              <div className="flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={isSubmittingUser}
                  className="inline-flex h-11 items-center gap-2 rounded-lg bg-emerald-400 px-4 text-sm font-black text-emerald-950 shadow-sm transition hover:bg-emerald-300 focus:outline-none focus:ring-4 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isSubmittingUser ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> : <UserPlus className="h-4 w-4" aria-hidden="true" />}
                  {isSubmittingUser ? "Guardando..." : selectedUserId ? "Actualizar usuario" : "Crear usuario"}
                </button>

                {selectedUserId ? (
                  <>
                    <button
                      type="button"
                      onClick={clearUserForm}
                      className="inline-flex h-11 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-slate-100"
                    >
                      <PencilLine className="h-4 w-4" aria-hidden="true" />
                      Limpiar
                    </button>

                    <button
                      type="button"
                      onClick={() => void handleDeleteUser()}
                      disabled={deletingUserId === selectedUserId}
                      className="inline-flex h-11 items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 text-sm font-black text-red-700 transition hover:bg-red-100 focus:outline-none focus:ring-4 focus:ring-red-100 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {deletingUserId === selectedUserId ? (
                        <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
                      ) : (
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      )}
                      Eliminar
                    </button>
                  </>
                ) : null}
              </div>

              {selectedUser ? (
                <p className="text-xs font-medium text-slate-500">
                  Editando {selectedUser.nombre} ({selectedUser.email})
                </p>
              ) : (
                <p className="text-xs font-medium text-slate-500">
                  Crea un usuario nuevo o selecciona uno de la lista para editarlo.
                </p>
              )}
            </form>

            <div className="divide-y divide-slate-100 border-t border-slate-200">
              {data.users.length === 0 ? (
                <div className="px-5 py-6 text-sm text-slate-500">No hay usuarios registrados.</div>
              ) : (
                data.users.map((user) => {
                  const isSelected = user.id === selectedUserId;

                  return (
                    <article
                      key={user.id}
                      role="button"
                      tabIndex={0}
                      className={[
                        "cursor-pointer px-5 py-4 transition hover:bg-slate-50",
                        isSelected ? "bg-emerald-50/70" : "",
                      ].join(" ")}
                      onClick={() => loadUserForm(user)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          loadUserForm(user);
                        }
                      }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-black text-slate-950">{user.nombre}</p>
                          <p className="mt-1 text-sm text-slate-500">{user.email}</p>
                          <p className="mt-2 text-xs font-bold uppercase tracking-[0.14em] text-emerald-700">
                            {user.rol === "admin" ? "Administrador" : "Empleado"}
                          </p>
                        </div>
                        <div className="text-right text-xs text-slate-500">
                          <p>{formatearFechaTicketEmpleada(user.created_at)}</p>
                        </div>
                      </div>
                    </article>
                  );
                })
              )}
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {data.events.length === 0 ? (
              <div className="px-5 py-6 text-sm text-slate-500">Todavia no hay reuniones publicadas.</div>
            ) : (
              data.events.map((event) => (
                <article key={event.id} className="px-5 py-4">
                  <p className="text-sm font-black text-slate-950">{event.titulo}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{event.descripcion}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2.5 py-1 text-xs font-black text-slate-700">
                      <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                      {etiquetasPlataformaEvento[event.plataforma]}
                    </span>
                    <span className="inline-flex rounded-md bg-slate-100 px-2.5 py-1 text-xs font-black text-slate-700">
                      {formatearFechaTicketEmpleada(event.fecha)}
                    </span>
                    {event.enlace_reunion ? (
                      <a
                        href={event.enlace_reunion}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-black text-emerald-700 transition hover:bg-emerald-100"
                      >
                        Abrir enlace
                        <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                      </a>
                    ) : null}
                  </div>
                </article>
              ))
            )}
          </div>
        </div>
      </section>
    </section>
  );
}
