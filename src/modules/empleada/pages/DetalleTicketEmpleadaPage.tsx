import { useEffect, useState, type FormEvent } from "react";
import { ArrowLeft, CalendarDays, LoaderCircle, MessageSquareText, Send, Tag, UserRound } from "lucide-react";
import { Link, Navigate, useParams } from "react-router-dom";
import { useAuth } from "../../../hooks/useAuth";
import type { Comment, Ticket } from "../../../types/database";
import {
  estilosEstadoTicketEmpleada,
  estilosPrioridadTicketEmpleada,
  etiquetasEstadoTicketEmpleada,
  etiquetasPrioridadTicketEmpleada,
} from "../constantes";
import {
  crearComentarioTicketEmpleada,
  obtenerComentariosTicketEmpleada,
  obtenerDetalleTicketEmpleada,
} from "../services/ticketsEmpleada";
import { formatearFechaTicketEmpleada } from "../utilidades";

export function DetalleTicketEmpleadaPage() {
  const { ticketId } = useParams();
  const { user } = useAuth();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState("");
  const [commentError, setCommentError] = useState<string | null>(null);
  const [commentSuccess, setCommentSuccess] = useState<string | null>(null);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  useEffect(() => {
    if (!user?.id || !ticketId) {
      queueMicrotask(() => setIsLoading(false));
      return;
    }

    const cargarDetalle = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const [ticketData, commentsData] = await Promise.all([
          obtenerDetalleTicketEmpleada(ticketId, user.id),
          obtenerComentariosTicketEmpleada(ticketId),
        ]);

        setTicket(ticketData);
        setComments(commentsData);
      } catch (nextError) {
        setError(nextError instanceof Error ? nextError.message : "No se pudo cargar el ticket.");
      } finally {
        setIsLoading(false);
      }
    };

    void cargarDetalle();
  }, [ticketId, user?.id]);

  const handleCommentSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setCommentError(null);
    setCommentSuccess(null);

    if (!ticketId || !user?.id) {
      setCommentError("No se detecto una sesion valida.");
      return;
    }

    if (!mensaje.trim()) {
      setCommentError("Escribe un comentario antes de enviarlo.");
      return;
    }

    setIsSubmittingComment(true);

    try {
      const newComment = await crearComentarioTicketEmpleada({
        ticketId,
        userId: user.id,
        mensaje: mensaje.trim(),
      });

      setComments((current) => [...current, newComment]);
      setMensaje("");
      setCommentSuccess("Comentario enviado correctamente.");
    } catch (nextError) {
      setCommentError(nextError instanceof Error ? nextError.message : "No se pudo guardar el comentario.");
    } finally {
      setIsSubmittingComment(false);
    }
  };

  if (!ticketId) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <section className="space-y-6">
      <Link
        to="/dashboard"
        className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm transition hover:border-emerald-200 hover:text-emerald-800"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Volver a mis tickets
      </Link>

      {isLoading ? (
        <div className="flex min-h-60 items-center justify-center gap-3 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-500 shadow-sm">
          <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
          Cargando detalle del ticket...
        </div>
      ) : error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-700">
          {error}
        </div>
      ) : !ticket ? (
        <div className="rounded-lg border border-slate-200 bg-white px-5 py-8 text-sm font-medium text-slate-600 shadow-sm">
          No se encontro el ticket solicitado.
        </div>
      ) : (
        <>
          <article className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">Detalle de ticket</p>
                <h1 className="mt-2 text-3xl font-black text-slate-950">{ticket.titulo}</h1>
              </div>

              <div className="flex gap-2">
                <span
                  className={`rounded-md px-3 py-1 text-xs font-black ${estilosPrioridadTicketEmpleada[ticket.prioridad]}`}
                >
                  {etiquetasPrioridadTicketEmpleada[ticket.prioridad]}
                </span>
                <span
                  className={`rounded-md px-3 py-1 text-xs font-black ${estilosEstadoTicketEmpleada[ticket.estado]}`}
                >
                  {etiquetasEstadoTicketEmpleada[ticket.estado]}
                </span>
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <div className="rounded-lg bg-slate-50 p-4">
                <div className="flex items-center gap-2 text-sm font-black text-slate-800">
                  <CalendarDays className="h-4 w-4" aria-hidden="true" />
                  Fecha de creacion
                </div>
                <p className="mt-2 text-sm text-slate-600">{formatearFechaTicketEmpleada(ticket.created_at)}</p>
              </div>

              <div className="rounded-lg bg-slate-50 p-4">
                <div className="flex items-center gap-2 text-sm font-black text-slate-800">
                  <Tag className="h-4 w-4" aria-hidden="true" />
                  Prioridad
                </div>
                <p className="mt-2 text-sm text-slate-600">{etiquetasPrioridadTicketEmpleada[ticket.prioridad]}</p>
              </div>

              <div className="rounded-lg bg-slate-50 p-4">
                <div className="flex items-center gap-2 text-sm font-black text-slate-800">
                  <UserRound className="h-4 w-4" aria-hidden="true" />
                  Usuario propietario
                </div>
                <p className="mt-2 break-all text-sm text-slate-600">{ticket.user_id}</p>
              </div>
            </div>

            <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-5">
              <h2 className="text-base font-black text-slate-950">Descripcion completa</h2>
              <p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-600">{ticket.descripcion}</p>
            </div>
          </article>

          <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center gap-3 border-b border-slate-200 px-5 py-4">
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-slate-950 text-white">
                <MessageSquareText className="h-4 w-4" aria-hidden="true" />
              </div>
              <div>
                <h2 className="text-base font-black text-slate-950">Historial de comentarios</h2>
                <p className="mt-1 text-sm text-slate-500">Comentarios asociados al ticket seleccionado.</p>
              </div>
            </div>

            <form className="border-b border-slate-200 px-5 py-5" onSubmit={handleCommentSubmit}>
              <label className="block">
                <span className="mb-2 block text-sm font-bold text-slate-700">Nuevo comentario</span>
                <textarea
                  value={mensaje}
                  onChange={(event) => setMensaje(event.target.value)}
                  rows={4}
                  placeholder="Escribe una actualizacion o detalle adicional para soporte."
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-950 outline-none transition focus:border-emerald-300 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                />
              </label>

              {(commentError || commentSuccess) && (
                <div
                  className={[
                    "mt-4 rounded-lg px-4 py-3 text-sm font-medium",
                    commentError
                      ? "border border-red-200 bg-red-50 text-red-700"
                      : "border border-emerald-200 bg-emerald-50 text-emerald-700",
                  ].join(" ")}
                >
                  {commentError ?? commentSuccess}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmittingComment}
                className="mt-4 inline-flex h-11 items-center gap-2 rounded-lg bg-emerald-400 px-4 text-sm font-black text-emerald-950 shadow-sm transition hover:bg-emerald-300 focus:outline-none focus:ring-4 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmittingComment ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Send className="h-4 w-4" aria-hidden="true" />}
                {isSubmittingComment ? "Enviando..." : "Agregar comentario"}
              </button>
            </form>

            {comments.length === 0 ? (
              <div className="px-5 py-8 text-sm text-slate-500">Este ticket todavia no tiene comentarios.</div>
            ) : (
              <div className="divide-y divide-slate-100">
                {comments.map((comment) => (
                  <article key={comment.id} className="px-5 py-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                        Autor {comment.user_id}
                      </p>
                      <p className="text-xs font-medium text-slate-500">
                        {formatearFechaTicketEmpleada(comment.created_at)}
                      </p>
                    </div>
                    <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-700">{comment.mensaje}</p>
                  </article>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </section>
  );
}
