import { Database, ShieldCheck, TicketCheck, UsersRound } from "lucide-react";
import { useAuth } from "../hooks/useAuth";

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
    </section>
  );
}
