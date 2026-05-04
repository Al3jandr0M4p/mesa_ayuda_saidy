import { LogOut, PanelLeft, ShieldCheck, TicketCheck, UserRound } from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import type { UserRole } from "../types/database";

const navItems: Array<{
  label: string;
  href: string;
  icon: typeof TicketCheck;
  roles: UserRole[];
}> = [
  { label: "Dashboard", href: "/dashboard", icon: TicketCheck, roles: ["empleado", "admin"] },
  { label: "Admin", href: "/admin", icon: ShieldCheck, roles: ["admin"] },
];

export function ProtectedLayout() {
  const { profile, role, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-[#f5f7fa] text-slate-950">
      <aside className="fixed inset-y-0 left-0 hidden w-72 border-r border-slate-200 bg-white lg:block">
        <div className="flex h-full flex-col">
          <div className="px-5 py-6">
            <div className="flex items-center gap-3 rounded-lg bg-slate-950 p-4 text-white">
              <div className="grid h-11 w-11 place-items-center rounded-lg bg-white text-emerald-700">
                <PanelLeft className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-200">Saidy</p>
                <h1 className="text-lg font-black leading-tight">Support Desk</h1>
              </div>
            </div>
          </div>

          <nav className="flex-1 space-y-1 px-4">
            {navItems.map((item) =>
              role && item.roles.includes(role) ? (
                <NavLink
                  key={item.href}
                  to={item.href}
                  className={({ isActive }) =>
                    [
                      "flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-bold transition",
                      isActive
                        ? "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-100"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-950",
                    ].join(" ")
                  }
                >
                  <item.icon className="h-5 w-5" aria-hidden="true" />
                  {item.label}
                </NavLink>
              ) : null,
            )}
          </nav>

          <div className="p-4">
            <div className="mb-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
              <p className="truncate text-sm font-black">{profile?.nombre ?? "Usuario"}</p>
              <p className="truncate text-xs text-slate-500">{profile?.email}</p>
            </div>
            <button
              type="button"
              onClick={() => void signOut()}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 py-3 text-sm font-bold text-white transition hover:bg-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-500/20"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              Cerrar sesion
            </button>
          </div>
        </div>
      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 px-4 py-4 backdrop-blur md:px-8">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">
                {role === "admin" ? "Panel administrativo" : "Panel de empleado"}
              </p>
              <h2 className="text-xl font-black text-slate-950">Centro de soporte</h2>
            </div>

            <div className="flex items-center gap-3">
              <nav className="hidden items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1 md:flex lg:hidden">
                {navItems.map((item) =>
                  role && item.roles.includes(role) ? (
                    <NavLink
                      key={item.href}
                      to={item.href}
                      className={({ isActive }) =>
                        [
                          "flex h-10 items-center gap-2 rounded-md px-3 text-sm font-bold transition",
                          isActive ? "bg-white text-emerald-800 shadow-sm" : "text-slate-500 hover:text-slate-950",
                        ].join(" ")
                      }
                    >
                      <item.icon className="h-4 w-4" aria-hidden="true" />
                      {item.label}
                    </NavLink>
                  ) : null,
                )}
              </nav>

              <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-sm">
                <div className="grid h-9 w-9 place-items-center rounded-lg bg-emerald-50 text-emerald-700">
                  <UserRound className="h-5 w-5" aria-hidden="true" />
                </div>
                <div className="hidden min-w-0 sm:block">
                  <p className="truncate text-sm font-black text-slate-950">{profile?.nombre ?? "Usuario"}</p>
                  <p className="truncate text-xs text-slate-500">{profile?.email}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => void signOut()}
                className="grid h-11 w-11 place-items-center rounded-lg border border-red-100 bg-red-50 text-red-700 shadow-sm transition hover:border-red-200 hover:bg-red-100 focus:outline-none focus:ring-4 focus:ring-red-100 lg:hidden"
                aria-label="Cerrar sesion"
              >
                <LogOut className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
          </div>

          <nav className="mt-4 flex gap-2 overflow-x-auto md:hidden">
            {navItems.map((item) =>
              role && item.roles.includes(role) ? (
                <NavLink
                  key={item.href}
                  to={item.href}
                  className={({ isActive }) =>
                    [
                      "flex h-10 flex-none items-center gap-2 rounded-lg px-3 text-sm font-bold transition",
                      isActive ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-600",
                    ].join(" ")
                  }
                >
                  <item.icon className="h-4 w-4" aria-hidden="true" />
                  {item.label}
                </NavLink>
              ) : null,
            )}
          </nav>
        </header>

        <main className="mx-auto max-w-6xl px-4 py-8 md:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
