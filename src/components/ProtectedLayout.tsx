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
  const isEmployee = role === "empleado";

  return (
    <div
      className={[
        "min-h-screen text-slate-950",
        isEmployee
          ? "bg-[linear-gradient(180deg,#eef4fb_0%,#e7effa_18%,#f4f7fb_42%,#f6f8f7_100%)]"
          : "bg-[#f5f7fa]",
      ].join(" ")}
    >
      <aside
        className={[
          "fixed inset-y-0 left-0 hidden w-72 border-r lg:block",
          isEmployee ? "border-slate-300/70 bg-[#f7fbff] shadow-[18px_0_48px_-38px_rgba(15,23,42,0.35)]" : "border-slate-200 bg-white",
        ].join(" ")}
      >
        <div className="flex h-full flex-col">
          <div className="px-5 py-6">
            <div
              className={[
                "flex items-center gap-3 p-4 text-white",
                isEmployee
                  ? "rounded-[24px] bg-slate-950 shadow-[0_28px_60px_-34px_rgba(2,6,23,0.9)]"
                  : "rounded-lg bg-slate-950",
              ].join(" ")}
            >
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-white text-emerald-700">
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
                      "flex items-center gap-3 px-4 py-3 text-sm font-bold transition duration-300",
                      isActive
                        ? isEmployee
                          ? "rounded-2xl bg-slate-950 text-white shadow-[0_22px_40px_-28px_rgba(15,23,42,0.95)]"
                          : "rounded-lg bg-emerald-50 text-emerald-800 ring-1 ring-emerald-100"
                        : isEmployee
                          ? "rounded-2xl text-slate-600 hover:bg-white hover:text-slate-950"
                          : "rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-950",
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
            <div
              className={[
                "mb-3 border p-3",
                isEmployee
                  ? "rounded-2xl border-slate-200/90 bg-[linear-gradient(135deg,#ffffff_0%,#f0f9ff_100%)] shadow-[0_12px_32px_-26px_rgba(15,23,42,0.4)]"
                  : "rounded-lg border-slate-200 bg-slate-50",
              ].join(" ")}
            >
              <p className="truncate text-sm font-black">{profile?.nombre ?? "Usuario"}</p>
              <p className="truncate text-xs text-slate-500">{profile?.email}</p>
            </div>
            <button
              type="button"
              onClick={() => void signOut()}
              className={[
                "flex w-full items-center justify-center gap-2 px-4 py-3 text-sm font-bold text-white transition duration-300 focus:outline-none focus:ring-4",
                isEmployee
                  ? "rounded-2xl bg-slate-950 hover:-translate-y-0.5 hover:bg-cyan-700 hover:shadow-[0_22px_38px_-24px_rgba(8,47,73,0.55)] focus:ring-cyan-100"
                  : "rounded-lg bg-slate-950 hover:bg-emerald-700 focus:ring-emerald-500/20",
              ].join(" ")}
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              Cerrar sesion
            </button>
          </div>
        </div>
      </aside>

      <div className="lg:pl-72">
        <header
          className={[
            "sticky top-0 z-10 px-4 py-4 backdrop-blur md:px-8",
            isEmployee
              ? "border-b border-slate-200/80 bg-[#f8fbff]"
              : "border-b border-slate-200 bg-white/95",
          ].join(" ")}
        >
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
            <div>
              <p className={`text-xs font-bold uppercase tracking-[0.18em] ${isEmployee ? "text-cyan-700" : "text-emerald-700"}`}>
                {role === "admin" ? "Panel administrativo" : "Workspace personal"}
              </p>
              <h2 className="text-xl font-black text-slate-950">Centro de soporte</h2>
            </div>

            <div className="flex items-center gap-3">
              <nav
                className={[
                  "hidden items-center gap-1 p-1 md:flex lg:hidden",
                  isEmployee
                    ? "rounded-2xl border border-slate-200/80 bg-white"
                    : "rounded-lg border border-slate-200 bg-slate-50",
                ].join(" ")}
              >
                {navItems.map((item) =>
                  role && item.roles.includes(role) ? (
                    <NavLink
                      key={item.href}
                      to={item.href}
                      className={({ isActive }) =>
                        [
                          "flex h-10 items-center gap-2 px-3 text-sm font-bold transition duration-300",
                          isActive
                            ? isEmployee
                              ? "rounded-xl bg-slate-950 text-white shadow-[0_14px_26px_-20px_rgba(15,23,42,0.95)]"
                              : "rounded-md bg-white text-emerald-800 shadow-sm"
                            : isEmployee
                              ? "rounded-xl text-slate-500 hover:bg-slate-50 hover:text-slate-950"
                              : "rounded-md text-slate-500 hover:text-slate-950",
                        ].join(" ")
                      }
                    >
                      <item.icon className="h-4 w-4" aria-hidden="true" />
                      {item.label}
                    </NavLink>
                  ) : null,
                )}
              </nav>

              <div
                className={[
                  "flex items-center gap-3 border px-3 py-2 shadow-sm transition duration-300",
                  isEmployee
                    ? "rounded-2xl border-slate-200/90 bg-white shadow-[0_12px_28px_-22px_rgba(15,23,42,0.35)] hover:-translate-y-0.5"
                    : "rounded-lg border-slate-200 bg-white",
                ].join(" ")}
              >
                <div className={`grid h-9 w-9 place-items-center ${isEmployee ? "rounded-xl bg-cyan-50 text-cyan-700" : "rounded-lg bg-emerald-50 text-emerald-700"}`}>
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
                className={[
                  "grid h-11 w-11 place-items-center border text-red-700 shadow-sm transition duration-300 hover:border-red-200 hover:bg-red-100 focus:outline-none focus:ring-4 focus:ring-red-100 lg:hidden",
                  isEmployee ? "rounded-2xl border-red-100 bg-red-50" : "rounded-lg border-red-100 bg-red-50",
                ].join(" ")}
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
                      "flex h-10 flex-none items-center gap-2 px-3 text-sm font-bold transition duration-300",
                      isActive
                        ? isEmployee
                          ? "rounded-xl bg-slate-950 text-white"
                          : "rounded-lg bg-slate-950 text-white"
                        : isEmployee
                          ? "rounded-xl bg-white text-slate-600"
                          : "rounded-lg bg-slate-100 text-slate-600",
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
