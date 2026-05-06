import { useEffect, useState, type FormEvent } from "react";
import { CalendarPlus, Database, LoaderCircle, ShieldCheck, TicketCheck, UsersRound } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { crearEvento, obtenerEventos } from "../services/eventos";
import type { Event } from "../types/database";
import { formatearFechaTicketEmpleada } from "../modules/empleada/utilidades";

const adminCards = [
  {
    title: "Usuarios",
    description: "Perfiles extendidos vinculados a auth.users.",
    icon: UsersRound,
    tone: "bg-sky-50 text-sky-700",
  },
  {
    title: "RLS activo",
    description: "Policies listas para aislar empleado y habilitar admin.",
    icon: ShieldCheck,
    tone: "bg-emerald-50 text-emerald-700",
  },
  {
    title: "Supabase",
    description: "Auth, Database y Edge Functions sin backend propio.",
    icon: Database,
    tone: "bg-violet-50 text-violet-700",
  },
];

export function AdminDashboardPage() {
  const { profile } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [fecha, setFecha] = useState("");
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [eventError, setEventError] = useState<string | null>(null);
  const [eventSuccess, setEventSuccess] = useState<string | null>(null);

  useEffect(() => {
    const cargarEventos = async () => {
      setIsLoadingEvents(true);
      setEventError(null);

      try {
        const nextEvents = await obtenerEventos();
        setEvents(nextEvents);
      } catch (error) {
        setEventError(error instanceof Error ? error.message : "No se pudieron cargar los eventos.");
      } finally {
        setIsLoadingEvents(false);
      }
    };

    void cargarEventos();
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setEventError(null);
    setEventSuccess(null);

    if (!titulo.trim() || !descripcion.trim() || !fecha) {
      setEventError("Completa titulo, descripcion y fecha del evento.");
      return;
    }

    setIsSubmitting(true);

    try {
      const createdEvent = await crearEvento({
        titulo: titulo.trim(),
        descripcion: descripcion.trim(),
        fecha: new Date(fecha).toISOString(),
      });

      setEvents((current) => [...current, createdEvent].sort((a, b) => a.fecha.localeCompare(b.fecha)));
      setTitulo("");
      setDescripcion("");
      setFecha("");
      setEventSuccess("Evento publicado correctamente.");
    } catch (error) {
      setEventError(error instanceof Error ? error.message : "No se pudo crear el evento.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="space-y-6">
      <div className="rounded-lg border border-slate-800 bg-slate-950 p-6 text-white shadow-sm">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-300">Admin</p>
            <h1 className="mt-2 text-3xl font-black">Panel administrativo</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
              Sesion activa para {profile?.nombre ?? "administrador"}. Este espacio queda preparado para manejar
              usuarios, tickets, comentarios y eventos con permisos completos.
            </p>
          </div>

          <div className="flex w-full items-center gap-3 rounded-lg border border-white/10 bg-white/10 p-4 md:w-auto">
            <div className="grid h-11 w-11 place-items-center rounded-lg bg-emerald-300 text-emerald-950">
              <TicketCheck className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <p className="text-2xl font-black">14</p>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-300">Tickets totales</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {adminCards.map((card) => (
          <article key={card.title} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className={`mb-5 flex h-11 w-11 items-center justify-center rounded-lg ${card.tone}`}>
              <card.icon className="h-5 w-5" aria-hidden="true" />
            </div>
            <h2 className="text-lg font-black">{card.title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">{card.description}</p>
          </article>
        ))}
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-black">Checklist de integracion</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {["SQL aplicado", "Usuarios creados", "Edge Function copiada"].map((item) => (
            <div key={item} className="rounded-lg bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700">
              {item}
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-lg bg-slate-950 text-white">
              <CalendarPlus className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-950">Publicar evento</h2>
              <p className="mt-1 text-sm text-slate-500">Disponible para todos los empleados autenticados.</p>
            </div>
          </div>

          <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
            <label className="block">
              <span className="mb-2 block text-sm font-bold text-slate-700">Titulo</span>
              <input
                type="text"
                value={titulo}
                onChange={(event) => setTitulo(event.target.value)}
                className="h-12 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-950 outline-none transition focus:border-emerald-300 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                placeholder="Ej. Mantenimiento programado"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-bold text-slate-700">Descripcion</span>
              <textarea
                value={descripcion}
                onChange={(event) => setDescripcion(event.target.value)}
                rows={4}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-950 outline-none transition focus:border-emerald-300 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                placeholder="Comparte la informacion importante del evento."
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

            {(eventError || eventSuccess) && (
              <div
                className={[
                  "rounded-lg px-4 py-3 text-sm font-medium",
                  eventError
                    ? "border border-red-200 bg-red-50 text-red-700"
                    : "border border-emerald-200 bg-emerald-50 text-emerald-700",
                ].join(" ")}
              >
                {eventError ?? eventSuccess}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-emerald-400 px-4 text-sm font-black text-emerald-950 shadow-sm transition hover:bg-emerald-300 focus:outline-none focus:ring-4 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
              {isSubmitting ? "Publicando..." : "Crear evento"}
            </button>
          </form>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="text-base font-black">Eventos publicados</h2>
            <p className="mt-1 text-sm text-slate-500">Vista previa de lo que vera el empleado.</p>
          </div>

          {isLoadingEvents ? (
            <div className="flex items-center justify-center gap-3 px-5 py-10 text-sm font-medium text-slate-500">
              <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
              Cargando eventos...
            </div>
          ) : events.length === 0 ? (
            <div className="px-5 py-8 text-sm text-slate-500">Todavia no hay eventos publicados.</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {events.map((item) => (
                <article key={item.id} className="px-5 py-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-black text-slate-950">{item.titulo}</h3>
                      <p className="mt-2 text-sm leading-6 text-slate-600">{item.descripcion}</p>
                    </div>
                    <span className="rounded-md bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">
                      {formatearFechaTicketEmpleada(item.fecha)}
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
