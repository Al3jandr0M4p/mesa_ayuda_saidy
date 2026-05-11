import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  AlertCircle,
  ArrowUpRight,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Clock3,
  ExternalLink,
  LoaderCircle,
  MapPin,
  PencilLine,
  Send,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../../../hooks/useAuth";
import { obtenerEventos } from "../../../services/eventos";
import type { Event, Ticket, TicketPriority } from "../../../types/database";
import {
  estilosEstadoTicketEmpleada,
  estilosPrioridadTicketEmpleada,
  etiquetasEstadoTicketEmpleada,
  etiquetasPlataformaEvento,
  etiquetasPrioridadTicketEmpleada,
  prioridadesTicketEmpleada,
} from "../constantes";
import { actualizarPerfilEmpleada } from "../services/perfilEmpleada";
import { crearTicketEmpleada, obtenerTicketsEmpleada } from "../services/ticketsEmpleada";
import { formatearFechaTicketEmpleada } from "../utilidades";

export function PanelEmpleadaPage() {
  const { profile, refreshProfile, user } = useAuth();
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

  const [nombre, setNombre] = useState(profile?.nombre ?? "");
  const [password, setPassword] = useState("");
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  useEffect(() => {
    queueMicrotask(() => {
      setNombre(profile?.nombre ?? "");
    });
  }, [profile?.nombre]);

  useEffect(() => {
    if (!user?.id) {
      queueMicrotask(() => {
        setTickets([]);
        setIsLoadingTickets(false);
      });
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
        label: "Tickets creados",
        value: tickets.length,
        icon: ClipboardList,
        tone: "from-sky-500/20 to-cyan-400/10 text-sky-700 ring-sky-200/70",
      },
      {
        label: "Pendientes",
        value: tickets.filter((ticket) => ticket.estado === "abierto").length,
        icon: Clock3,
        tone: "from-rose-500/20 to-orange-400/10 text-rose-700 ring-rose-200/70",
      },
      {
        label: "Resueltos",
        value: tickets.filter((ticket) => ticket.estado === "cerrado").length,
        icon: CheckCircle2,
        tone: "from-emerald-500/20 to-lime-400/10 text-emerald-700 ring-emerald-200/70",
      },
    ],
    [tickets],
  );

  const resumenPendiente = tickets.find((ticket) => ticket.estado !== "cerrado");

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

  const handleProfileSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setProfileError(null);
    setProfileSuccess(null);

    if (!user?.id) {
      setProfileError("No se detecto una sesion valida.");
      return;
    }

    if (!nombre.trim()) {
      setProfileError("Ingresa tu nombre para guardar el perfil.");
      return;
    }

    if (password && password.length < 8) {
      setProfileError("La nueva contrasena debe tener al menos 8 caracteres.");
      return;
    }

    setIsSavingProfile(true);

    try {
      await actualizarPerfilEmpleada({
        userId: user.id,
        nombre: nombre.trim(),
        password: password || undefined,
      });

      await refreshProfile();
      setPassword("");
      setProfileSuccess("Perfil actualizado correctamente.");
    } catch (error) {
      setProfileError(error instanceof Error ? error.message : "No se pudo actualizar el perfil.");
    } finally {
      setIsSavingProfile(false);
    }
  };

  return (
    <section className="space-y-6">
      <div className="relative overflow-hidden rounded-[36px] border border-slate-800 bg-slate-950 p-6 text-white shadow-[0_34px_90px_-46px_rgba(2,6,23,0.88)] sm:p-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.16),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(16,185,129,0.14),transparent_30%)]" />
        <div className="absolute right-0 top-0 h-full w-1/3 bg-[linear-gradient(180deg,rgba(15,23,42,0.08),rgba(15,23,42,0.22))]" />

        <div className="relative grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-slate-950/70 px-3 py-2 text-xs font-bold uppercase tracking-[0.22em] text-cyan-100">
              <Sparkles className="h-4 w-4 text-emerald-200" aria-hidden="true" />
              Espacio personal de soporte
            </div>

            <h1 className="mt-5 max-w-3xl text-3xl font-black leading-tight tracking-[-0.04em] text-white sm:text-5xl">
              Gestiona tus solicitudes, sigue el progreso y mantente al tanto sin salir del panel.
            </h1>

            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-200 sm:text-base">
              Crea tickets, revisa novedades internas y actualiza tu perfil desde una sola experiencia pensada para ir
              rapido y sentirse limpia.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <div className="rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 transition duration-300 hover:-translate-y-0.5 hover:border-cyan-400/40">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-100">Nombre</p>
                <p className="mt-1 text-sm font-semibold text-white">{profile?.nombre ?? "Usuario"}</p>
              </div>
              <div className="rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 transition duration-300 hover:-translate-y-0.5 hover:border-cyan-400/40">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-100">Correo</p>
                <p className="mt-1 text-sm font-semibold text-white">{profile?.email ?? user?.email ?? "Sin correo"}</p>
              </div>
            </div>
          </div>

          <div className="grid gap-3 self-start">
            <div className="rounded-[28px] border border-slate-700 bg-slate-950/72 p-5 transition duration-300 hover:-translate-y-1 hover:border-cyan-400/40 hover:shadow-[0_24px_44px_-30px_rgba(6,182,212,0.28)]">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-200">Siguiente foco</p>
                  <h2 className="mt-2 text-lg font-black text-white">
                    {resumenPendiente ? resumenPendiente.titulo : "Todo bajo control"}
                  </h2>
                </div>
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-cyan-950 text-cyan-100">
                  <ShieldCheck className="h-5 w-5" aria-hidden="true" />
                </div>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-200">
                {resumenPendiente
                  ? "Tienes una solicitud activa que todavia necesita seguimiento."
                  : "No tienes tickets abiertos ahora mismo. Si aparece un problema, puedes reportarlo de inmediato."}
              </p>
              {resumenPendiente ? (
                <Link
                  to={`/tickets/${resumenPendiente.id}`}
                  className="mt-4 inline-flex items-center gap-2 text-sm font-black text-emerald-200 transition duration-300 hover:gap-3 hover:text-white"
                >
                  Abrir ticket
                  <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              ) : null}
            </div>

            <div className="rounded-[28px] border border-slate-700 bg-slate-950/72 p-5 transition duration-300 hover:-translate-y-1 hover:border-emerald-400/40">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-100">Estado de acceso</p>
              <p className="mt-2 text-2xl font-black text-white">Sesion activa</p>
              <p className="mt-2 text-sm leading-6 text-slate-200">
                Tus tickets solo son visibles para ti y el panel administrativo.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((stat) => (
          <article
            key={stat.label}
            className="group rounded-[28px] border border-slate-200/90 bg-white p-5 shadow-[0_22px_54px_-40px_rgba(15,23,42,0.4)] transition duration-300 hover:-translate-y-1 hover:border-slate-300 hover:shadow-[0_28px_70px_-40px_rgba(15,23,42,0.55)]"
          >
            <div
              className={`mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-linear-to-br ${stat.tone} ring-1 shadow-sm`}
            >
              <stat.icon className="h-5 w-5" aria-hidden="true" />
            </div>
            <p className="text-3xl font-black tracking-[-0.03em] text-slate-950">
              {String(stat.value).padStart(2, "0")}
            </p>
            <p className="mt-1 text-sm font-bold text-slate-500">{stat.label}</p>
          </article>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <section className="rounded-[30px] border border-slate-200/90 bg-white p-6 shadow-[0_22px_54px_-40px_rgba(15,23,42,0.42)] transition duration-300 hover:border-slate-300 hover:shadow-[0_28px_70px_-40px_rgba(15,23,42,0.58)]">
          <div className="flex items-start gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-slate-950 text-white shadow-lg shadow-slate-950/20">
              <Send className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-[-0.02em] text-slate-950">Crear ticket</h2>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                Describe el problema con claridad y el sistema lo dejara como pendiente.
              </p>
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
                className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-950 outline-none transition duration-300 focus:border-emerald-300 focus:bg-white focus:ring-4 focus:ring-emerald-100"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-bold text-slate-700">Descripcion</span>
              <textarea
                value={descripcion}
                onChange={(event) => setDescripcion(event.target.value)}
                rows={5}
                placeholder="Describe el problema, el impacto y cualquier detalle util para soporte."
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-950 outline-none transition duration-300 focus:border-emerald-300 focus:bg-white focus:ring-4 focus:ring-emerald-100"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-bold text-slate-700">Prioridad</span>
              <select
                value={prioridad}
                onChange={(event) => setPrioridad(event.target.value as TicketPriority)}
                className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-950 outline-none transition duration-300 focus:border-emerald-300 focus:bg-white focus:ring-4 focus:ring-emerald-100"
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
                  "flex gap-3 rounded-2xl px-4 py-3 text-sm font-medium",
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
              className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-400 px-4 text-sm font-black text-emerald-950 shadow-[0_20px_38px_-20px_rgba(16,185,129,0.42)] transition duration-300 hover:-translate-y-0.5 hover:bg-emerald-300 hover:shadow-[0_24px_48px_-18px_rgba(16,185,129,0.5)] focus:outline-none focus:ring-4 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
              {isSubmitting ? "Enviando ticket..." : "Crear ticket"}
            </button>
          </form>
        </section>

        <section className="rounded-[30px] border border-slate-200/90 bg-white shadow-[0_22px_54px_-40px_rgba(15,23,42,0.42)] transition duration-300 hover:border-slate-300 hover:shadow-[0_28px_70px_-40px_rgba(15,23,42,0.58)]">
          <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
            <div>
              <h2 className="text-base font-black text-slate-950">Mis tickets</h2>
              <p className="mt-1 text-sm text-slate-500">Solo ves tus solicitudes y su estado actual.</p>
            </div>
            <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-slate-600">
              {tickets.length} activos
            </div>
          </div>

          {isLoadingTickets ? (
            <div className="flex items-center justify-center gap-3 px-5 py-12 text-sm font-medium text-slate-500">
              <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
              Cargando tickets...
            </div>
          ) : loadError ? (
            <div className="px-5 py-6 text-sm font-medium text-red-700">{loadError}</div>
          ) : tickets.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <p className="text-base font-black text-slate-800">Todavia no has creado tickets.</p>
              <p className="mt-2 text-sm text-slate-500">Cuando reportes un problema, aparecera aqui con su progreso.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {tickets.map((ticket) => (
                <article key={ticket.id} className="space-y-3 px-5 py-4 transition duration-300 hover:bg-slate-50">
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
                    <div className="flex flex-wrap gap-2">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-black ${estilosPrioridadTicketEmpleada[ticket.prioridad]}`}
                      >
                        {etiquetasPrioridadTicketEmpleada[ticket.prioridad]}
                      </span>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-black ${estilosEstadoTicketEmpleada[ticket.estado]}`}
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
                      className="inline-flex items-center gap-1 text-xs font-black uppercase tracking-[0.14em] text-emerald-700 transition hover:gap-2 hover:text-emerald-900"
                    >
                      Ver detalle
                      <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
        <section className="rounded-[30px] border border-slate-200/90 bg-white p-6 shadow-[0_22px_54px_-40px_rgba(15,23,42,0.42)] transition duration-300 hover:border-slate-300 hover:shadow-[0_28px_70px_-40px_rgba(15,23,42,0.58)]">
          <div className="flex items-start gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-cyan-600 text-white shadow-lg shadow-cyan-500/20">
              <PencilLine className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-[-0.02em] text-slate-950">Perfil</h2>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                Actualiza tu nombre visible y, si quieres, define una nueva contrasena.
              </p>
            </div>
          </div>

          <form className="mt-6 space-y-5" onSubmit={handleProfileSubmit}>
            <label className="block">
              <span className="mb-2 block text-sm font-bold text-slate-700">Nombre</span>
              <input
                type="text"
                value={nombre}
                onChange={(event) => setNombre(event.target.value)}
                className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-950 outline-none transition duration-300 focus:border-cyan-300 focus:bg-white focus:ring-4 focus:ring-cyan-100"
                placeholder="Tu nombre completo"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-bold text-slate-700">Correo</span>
              <input
                type="email"
                value={profile?.email ?? user?.email ?? ""}
                disabled
                className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-100 px-4 text-sm font-medium text-slate-500 outline-none"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-bold text-slate-700">Nueva contrasena</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-950 outline-none transition duration-300 focus:border-cyan-300 focus:bg-white focus:ring-4 focus:ring-cyan-100"
                placeholder="Opcional, minimo 8 caracteres"
              />
            </label>

            {(profileError || profileSuccess) && (
              <div
                className={[
                  "rounded-2xl px-4 py-3 text-sm font-medium",
                  profileError
                    ? "border border-red-200 bg-red-50 text-red-700"
                    : "border border-cyan-200 bg-cyan-50 text-cyan-700",
                ].join(" ")}
              >
                {profileError ?? profileSuccess}
              </div>
            )}

            <button
              type="submit"
              disabled={isSavingProfile}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-950 px-4 text-sm font-black text-white shadow-[0_20px_38px_-24px_rgba(15,23,42,0.82)] transition duration-300 hover:-translate-y-0.5 hover:bg-cyan-700 hover:shadow-[0_24px_44px_-22px_rgba(8,145,178,0.45)] focus:outline-none focus:ring-4 focus:ring-cyan-100 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSavingProfile ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
              {isSavingProfile ? "Guardando..." : "Guardar cambios"}
            </button>
          </form>
        </section>

        <section className="overflow-hidden rounded-[30px] border border-slate-200/90 bg-white shadow-[0_22px_54px_-40px_rgba(15,23,42,0.42)] transition duration-300 hover:border-slate-300 hover:shadow-[0_28px_70px_-40px_rgba(15,23,42,0.58)]">
          <div className="flex items-center gap-3 border-b border-slate-200 bg-[linear-gradient(135deg,#eff6ff_0%,#ecfeff_100%)] px-5 py-4">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-slate-950 text-white">
              <CalendarClock className="h-4 w-4" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-950">Eventos internos</h2>
              <p className="mt-1 text-sm text-slate-500">Novedades y avisos compartidos por administracion.</p>
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
              {events.map((event, index) => (
                <article
                  key={event.id}
                  className="px-5 py-4 transition duration-300 hover:bg-slate-50"
                  style={{ animationDelay: `${index * 70}ms` }}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-black text-slate-950">{event.titulo}</h3>
                      <p className="mt-2 text-sm leading-6 text-slate-600">{event.descripcion}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2.5 py-1 text-xs font-black text-slate-700">
                          <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                          {etiquetasPlataformaEvento[event.plataforma]}
                        </span>
                        {event.enlace_reunion ? (
                          <a
                            href={event.enlace_reunion}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-black text-emerald-700 transition hover:bg-emerald-100"
                          >
                            Entrar
                            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                          </a>
                        ) : null}
                      </div>
                    </div>
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">
                      <TicketCheck className="h-3.5 w-3.5" aria-hidden="true" />
                      {formatearFechaTicketEmpleada(event.fecha)}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </section>
  );
}
