import { useMemo, useState, type FormEvent } from "react";
import { AlertCircle, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck, Sparkles } from "lucide-react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { getDashboardPath } from "../utils/routes";

export function LoginPage() {
  const { signIn, user, role, isLoading, error } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const redirectTo = useMemo(() => {
    const state = location.state as { from?: { pathname?: string } } | null;
    return state?.from?.pathname ?? "/";
  }, [location.state]);

  if (!isLoading && user) {
    return <Navigate to={getDashboardPath(role)} replace />;
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    if (!email.trim() || !password) {
      setFormError("Ingresa tu email y contrasena para continuar.");
      return;
    }

    setIsSubmitting(true);
    const result = await signIn(email.trim(), password);
    setIsSubmitting(false);

    if (!result.ok) {
      setFormError(result.error ?? "No se pudo iniciar sesion.");
      return;
    }

    navigate(redirectTo, { replace: true });
  };

  return (
    <main className="min-h-screen bg-[#f7f9fc] text-slate-950">
      <div className="grid min-h-screen lg:grid-cols-[0.95fr_1.05fr]">
        <section className="relative hidden overflow-hidden lg:block">
          <img
            src="https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1600&q=80"
            alt="Equipo trabajando en soporte tecnico"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-slate-950/60" />

          <div className="relative flex h-full flex-col justify-between p-10 xl:p-14">
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-lg bg-white text-emerald-700 shadow-xl">
                <ShieldCheck className="h-6 w-6" aria-hidden="true" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-emerald-200">Mesa de ayuda</p>
                <h1 className="text-2xl font-black text-white">Support</h1>
              </div>
            </div>

            <div className="max-w-xl text-white">
              <div className="mb-6 inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/15 px-3 py-2 text-sm font-semibold backdrop-blur">
                <Sparkles className="h-4 w-4 text-amber-200" aria-hidden="true" />
                Acceso interno seguro
              </div>
              <h2 className="text-5xl font-black leading-tight tracking-normal xl:text-6xl">
                Tickets, roles y sesiones en un solo lugar.
              </h2>
              <p className="mt-5 max-w-lg text-base leading-7 text-slate-100">
                Un portal privado para que administradores y empleados trabajen con permisos claros desde la plataforma
                de soporte tecnico.
              </p>
            </div>
          </div>
        </section>

        <section className="relative flex items-center justify-center overflow-hidden bg-slate-950 px-4 py-10 sm:px-6 lg:px-12">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.22),transparent_32%),radial-gradient(circle_at_bottom_left,rgba(14,165,233,0.16),transparent_34%)]" />
          <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-emerald-300/40 to-transparent" />

          <div className="relative w-full max-w-110">
            <div className="mb-8 flex items-center justify-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-lg bg-white text-emerald-700 shadow-lg shadow-emerald-950/40">
                <ShieldCheck className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-300">Mesa de ayuda</p>
                <h1 className="text-xl font-black text-white">Support Access</h1>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-lg border backdrop-blur-xl">
              <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-white/45 to-transparent" />

              <div className="px-7 pt-7 sm:px-8">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-300">Acceso seguro</p>
                <h2 className="mt-2 text-3xl font-black tracking-normal text-white">Iniciar sesion</h2>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  Entra con las credenciales asignadas por administracion.
                </p>
              </div>

              <form className="space-y-5 px-7 py-7 sm:px-8" onSubmit={handleSubmit}>
                <label className="block">
                  <span className="mb-2 block text-sm font-bold text-slate-200">Correo electronico</span>
                  <span className="group flex h-14 items-center rounded-lg border border-white/12 bg-slate-950/55 shadow-sm transition focus-within:border-emerald-300/80 focus-within:bg-slate-950/75 focus-within:shadow-[0_0_0_4px_rgba(16,185,129,0.14)]">
                    <span className="grid h-full w-14 place-items-center text-slate-500 transition group-focus-within:text-emerald-300">
                      <Mail className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <input
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      autoComplete="email"
                      className="h-full w-full bg-transparent pr-4 text-[15px] font-semibold text-white outline-none placeholder:font-medium placeholder:text-slate-500"
                      placeholder="usuario@empresa.com"
                    />
                  </span>
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-bold text-slate-200">Contrasena</span>
                  <span className="group flex h-14 items-center rounded-lg border border-white/12 bg-slate-950/55 shadow-sm transition focus-within:border-emerald-300/80 focus-within:bg-slate-950/75 focus-within:shadow-[0_0_0_4px_rgba(16,185,129,0.14)]">
                    <span className="grid h-full w-14 place-items-center text-slate-500 transition group-focus-within:text-emerald-300">
                      <LockKeyhole className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      autoComplete="current-password"
                      className="h-full w-full bg-transparent pr-2 text-[15px] font-semibold text-white outline-none placeholder:font-medium placeholder:text-slate-500"
                      placeholder="Tu contrasena"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((current) => !current)}
                      className="mr-3 grid h-9 w-9 place-items-center rounded-md text-slate-500 transition hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-emerald-300"
                      aria-label={showPassword ? "Ocultar contrasena" : "Mostrar contrasena"}
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </span>
                </label>

                {(formError || error) && (
                  <div className="flex gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                    <AlertCircle className="mt-0.5 h-5 w-5 flex-none" aria-hidden="true" />
                    <p>{formError || error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex h-14 w-full items-center justify-center rounded-lg bg-emerald-400 px-4 text-sm font-black text-emerald-950 shadow-lg shadow-emerald-950/30 transition hover:bg-emerald-300 focus:outline-none focus:ring-4 focus:ring-emerald-300/25 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isSubmitting ? "Validando..." : "Entrar"}
                </button>
              </form>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
