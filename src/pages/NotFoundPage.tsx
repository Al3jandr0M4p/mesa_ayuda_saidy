import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-950 px-4 text-white">
      <div className="max-w-md text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-200">404</p>
        <h1 className="mt-3 text-4xl font-black">Ruta no encontrada</h1>
        <p className="mt-3 text-sm leading-6 text-slate-300">La pagina solicitada no existe o no esta disponible.</p>
        <Link
          to="/"
          className="mt-6 inline-flex rounded-lg bg-cyan-300 px-5 py-3 text-sm font-bold text-cyan-950 transition hover:bg-cyan-200"
        >
          Volver
        </Link>
      </div>
    </main>
  );
}
