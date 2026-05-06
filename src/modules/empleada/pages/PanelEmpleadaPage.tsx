import { useEffect, useMemo, useState, type FormEvent } from "react";
import { AlertCircle, CalendarClock, ClipboardList, Clock3, LoaderCircle, PlusCircle, Send, TicketCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../../../hooks/useAuth";
import { obtenerEventos } from "../../../services/eventos";
import type { Event, Ticket, TicketPriority } from "../../../types/database";
import {
  estilosEstadoTicketEmpleada,
  estilosPrioridadTicketEmpleada,
  etiquetasEstadoTicketEmpleada,
  etiquetasPrioridadTicketEmpleada,
  prioridadesTicketEmpleada,
} from "../constantes";
import { crearTicketEmpleada, obtenerTicketsEmpleada } from "../services/ticketsEmpleada";
import { formatearFechaTicketEmpleada } from "../utilidades";

export function PanelEmpleadaPage() {
  const { profile, user } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoadingTickets, setIsLoadingTickets] = useState(true);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [eventsError, setEventsError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [prioridad, setPrioridad] = useState<TicketPriority>("media");

  useEffect(() => {
    if (!user?.id) {
      setTickets([]);
      setIsLoadingTickets(false);
      return;
    }

    const cargarTickets = async () => {
      setIsLoadingTickets(true);
      setLoadError(null);

      try {
        const nextTickets = await obtenerTicketsEmpleada(user.id);
        setTickets(nextTickets);
      } catch (error) {
        setLoadError(error instanceof Error ? error.message : "No se pudieron cargar tus tickets.");
      } finally {
        setIsLoadingTickets(false);
      }
    };

    void cargarTickets();
  }, [user?.id]);

  useEffect(() => {
    const cargarEventos = async () => {
      setIsLoadingEvents(true);
      setEventsError(null);

      try {
        const nextEvents = await obtenerEventos();
        setEvents(nextEvents);
      } catch (error) {
        setEventsError(error instanceof Error ? error.message : "No se pudieron cargar los eventos.");
      } finally {
        setIsLoadingEvents(false);
      }
    };

    void cargarEventos();
  }, []);

  const stats = useMemo(
    () => [
      {
        label: "Total de tickets",
        value: tickets.length,
        icon: ClipboardList,
        tone: "bg-sky-50 text-sky-700",
      },
      {
        label: "Pendientes",
        value: tickets.filter((ticket) => ticket.estado === "abierto").length,
        icon: Clock3,
        tone: "bg-rose-50 text-rose-700",
      },
      {
        label: "Creados por ti",
        value: tickets.filter((ticket) => ticket.user_id === user?.id).length,
        icon: TicketCheck,
        tone: "bg-emerald-50 text-emerald-700",
      },
    ],
    [tickets, user?.id],
  );

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError(null);
    setSubmitSuccess(null);

    if (!user?.id) {
      setSubmitError("No se detecto una sesion valida.");
      return;
    }

    if (!titulo.trim() || !descripcion.trim()) {
      setSubmitError("Completa el titulo y la descripcion del ticket.");
      return;
    }

    setIsSubmitting(true);

    try {
      const createdTicket = await crearTicketEmpleada({
        titulo: titulo.trim(),
        descripcion: descripcion.trim(),
        prioridad,
        userId: user.id,
      });

      setTickets((current) => [createdTicket, ...current]);
      setTitulo("");
      setDescripcion("");
      setPrioridad("media");
      setSubmitSuccess("Ticket creado correctamente con estado Pendiente.");
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "No se pudo crear el ticket.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">Empleado autenticado</p>
          <h1 className="mt-2 text-3xl font-black text-slate-950">Hola, {profile?.nombre ?? "usuario"}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
            Tu sesion permanece activa con Supabase. Desde aqui puedes crear tickets y consultar solo los que te
            pertenecen.
          </p>
        </div>

        <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-6">
          <div className="mb-4 grid h-11 w-11 place-items-center rounded-lg bg-white text-emerald-700 shadow-sm">
            <PlusCircle className="h-5 w-5" aria-hidden="true" />
          </div>
          <p className="text-sm font-black text-emerald-950">Usuario en sesion</p>
          <p className="mt-2 text-sm leading-6 text-emerald-800">{profile?.email ?? user?.email ?? "Sin correo"}</p>
          <p className="mt-3 text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">Rol {profile?.rol}</p>
        </div>
      </div>

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

      <div className="grid gap-6 xl:grid-cols-[0.88fr_1.12fr]">
        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-lg bg-slate-950 text-white">
              <Send className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-950">Crear ticket</h2>
              <p className="mt-1 text-sm text-slate-500">Envialo con prioridad y quedara registrado como Pendiente.</p>
            </div>
          </div>

          <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
            <label className="block">
              <span className="mb-2 block text-sm font-bold text-slate-700">Titulo</span>
              <input
                type="text"
                value={titulo}
                onChange={(event) => setTitulo(event.target.value)}
                placeholder="Ej. No puedo acceder al correo corporativo"
                className="h-12 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-950 outline-none transition focus:border-emerald-300 focus:bg-white focus:ring-4 focus:ring-emerald-100"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-bold text-slate-700">Descripcion</span>
              <textarea
                value={descripcion}
                onChange={(event) => setDescripcion(event.target.value)}
                rows={5}
                placeholder="Describe el problema, impacto y cualquier detalle util para soporte."
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-950 outline-none transition focus:border-emerald-300 focus:bg-white focus:ring-4 focus:ring-emerald-100"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-bold text-slate-700">Prioridad</span>
              <select
                value={prioridad}
                onChange={(event) => setPrioridad(event.target.value as TicketPriority)}
                className="h-12 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-950 outline-none transition focus:border-emerald-300 focus:bg-white focus:ring-4 focus:ring-emerald-100"
              >
                {prioridadesTicketEmpleada.map((option) => (
                  <option key={option} value={option}>
                    {etiquetasPrioridadTicketEmpleada[option]}
                  </option>
                ))}
              </select>
            </label>

            {(submitError || submitSuccess) && (
              <div
                className={[
                  "flex gap-3 rounded-lg px-4 py-3 text-sm font-medium",
                  submitError
                    ? "border border-red-200 bg-red-50 text-red-700"
                    : "border border-emerald-200 bg-emerald-50 text-emerald-700",
                ].join(" ")}
              >
                <AlertCircle className="mt-0.5 h-5 w-5 flex-none" aria-hidden="true" />
                <p>{submitError ?? submitSuccess}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-emerald-400 px-4 text-sm font-black text-emerald-950 shadow-sm transition hover:bg-emerald-300 focus:outline-none focus:ring-4 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
              {isSubmitting ? "Enviando ticket..." : "Crear ticket"}
            </button>
          </form>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="text-base font-black">Mis tickets</h2>
            <p className="mt-1 text-sm text-slate-500">Listado en tiempo de consulta para el usuario autenticado.</p>
          </div>

          {isLoadingTickets ? (
            <div className="flex items-center justify-center gap-3 px-5 py-12 text-sm font-medium text-slate-500">
              <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
              Cargando tickets...
            </div>
          ) : loadError ? (
            <div className="px-5 py-6 text-sm font-medium text-red-700">{loadError}</div>
          ) : tickets.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <p className="text-sm font-black text-slate-800">Todavia no has creado tickets.</p>
              <p className="mt-2 text-sm text-slate-500">Usa el formulario para registrar tu primera solicitud.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {tickets.map((ticket) => (
                <article key={ticket.id} className="space-y-3 px-5 py-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link
                        to={`/tickets/${ticket.id}`}
                        className="text-sm font-black text-slate-950 transition hover:text-emerald-700"
                      >
                        {ticket.titulo}
                      </Link>
                      <p className="mt-1 text-sm leading-6 text-slate-600">{ticket.descripcion}</p>
                    </div>
                    <div className="flex gap-2">
                      <span
                        className={`rounded-md px-2.5 py-1 text-xs font-black ${estilosPrioridadTicketEmpleada[ticket.prioridad]}`}
                      >
                        {etiquetasPrioridadTicketEmpleada[ticket.prioridad]}
                      </span>
                      <span
                        className={`rounded-md px-2.5 py-1 text-xs font-black ${estilosEstadoTicketEmpleada[ticket.estado]}`}
                      >
                        {etiquetasEstadoTicketEmpleada[ticket.estado]}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-xs font-medium text-slate-500">
                      Creado el {formatearFechaTicketEmpleada(ticket.created_at)}
                    </p>
                    <Link
                      to={`/tickets/${ticket.id}`}
                      className="text-xs font-black uppercase tracking-[0.14em] text-emerald-700 transition hover:text-emerald-900"
                    >
                      Ver detalle
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>

      <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center gap-3 border-b border-slate-200 px-5 py-4">
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-slate-950 text-white">
            <CalendarClock className="h-4 w-4" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-base font-black text-slate-950">Eventos internos</h2>
            <p className="mt-1 text-sm text-slate-500">Actividades y avisos creados por administracion.</p>
          </div>
        </div>

        {isLoadingEvents ? (
          <div className="flex items-center justify-center gap-3 px-5 py-10 text-sm font-medium text-slate-500">
            <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
            Cargando eventos...
          </div>
        ) : eventsError ? (
          <div className="px-5 py-6 text-sm font-medium text-red-700">{eventsError}</div>
        ) : events.length === 0 ? (
          <div className="px-5 py-8 text-sm text-slate-500">Todavia no hay eventos publicados.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {events.map((event) => (
              <article key={event.id} className="px-5 py-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-black text-slate-950">{event.titulo}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{event.descripcion}</p>
                  </div>
                  <span className="rounded-md bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">
                    {formatearFechaTicketEmpleada(event.fecha)}
                  </span>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </section>
  );
}
