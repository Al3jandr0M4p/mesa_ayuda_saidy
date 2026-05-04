import { AlertTriangle, Clock3, MessageSquareText, TicketCheck } from "lucide-react";
import { useAuth } from "../hooks/useAuth";

const stats = [
  { label: "Abiertos", value: "08", icon: TicketCheck, tone: "bg-emerald-50 text-emerald-700" },
  { label: "En progreso", value: "03", icon: Clock3, tone: "bg-amber-50 text-amber-700" },
  { label: "Comentarios", value: "21", icon: MessageSquareText, tone: "bg-sky-50 text-sky-700" },
];

const tickets = [
  { title: "No puedo acceder al correo", status: "Alta", time: "Hace 12 min" },
  { title: "Instalacion de impresora", status: "Media", time: "Hace 1 h" },
  { title: "Solicitud de acceso VPN", status: "Baja", time: "Ayer" },
];

export function DashboardPage() {
  const { profile } = useAuth();

  return (
    <section className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-[1.45fr_0.55fr]">
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">Empleado</p>
          <h1 className="mt-2 text-3xl font-black text-slate-950">Hola, {profile?.nombre ?? "usuario"}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
            Esta vista esta protegida por sesion. Cuando conectes la data real, Supabase RLS filtrara los tickets para
            que cada empleado vea solo sus solicitudes.
          </p>
        </div>

        <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-6">
          <div className="mb-4 grid h-11 w-11 place-items-center rounded-lg bg-white text-emerald-700 shadow-sm">
            <AlertTriangle className="h-5 w-5" aria-hidden="true" />
          </div>
          <p className="text-sm font-black text-emerald-950">Siguiente paso</p>
          <p className="mt-2 text-sm leading-6 text-emerald-800">
            Conectar consultas de tickets desde Supabase usando el usuario autenticado.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((stat) => (
          <article key={stat.label} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className={`mb-5 flex h-11 w-11 items-center justify-center rounded-lg ${stat.tone}`}>
              <stat.icon className="h-5 w-5" aria-hidden="true" />
            </div>
            <p className="text-3xl font-black">{stat.value}</p>
            <p className="mt-1 text-sm font-bold text-slate-500">{stat.label}</p>
          </article>
        ))}
      </div>

      <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="text-base font-black">Tickets recientes</h2>
            <p className="mt-1 text-sm text-slate-500">Ejemplo visual listo para conectar a Supabase.</p>
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {tickets.map((ticket) => (
            <div key={ticket.title} className="flex items-center justify-between gap-4 px-5 py-4">
              <div className="min-w-0">
                <p className="truncate text-sm font-black text-slate-950">{ticket.title}</p>
                <p className="mt-1 text-xs font-medium text-slate-500">{ticket.time}</p>
              </div>
              <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-black text-slate-700">
                {ticket.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
