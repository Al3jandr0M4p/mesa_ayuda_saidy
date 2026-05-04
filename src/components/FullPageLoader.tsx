import { Loader2 } from "lucide-react";

export function FullPageLoader({ label = "Cargando sesion..." }: { label?: string }) {
  return (
    <div className="grid min-h-screen place-items-center bg-slate-950 text-white">
      <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/10 px-4 py-3 shadow-2xl">
        <Loader2 className="h-5 w-5 animate-spin text-cyan-300" aria-hidden="true" />
        <span className="text-sm font-medium text-slate-100">{label}</span>
      </div>
    </div>
  );
}
