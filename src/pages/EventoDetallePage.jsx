import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";

import { useEventSubtasks } from "../hooks/useEventSubtasks";
import { EVENT_TYPE_LABELS } from "../data/mockGestiones";
import { formatShortDate } from "../utils/dateUtils";

import EmptyState from "../components/common/EmptyState";
import ErrorState from "../components/common/ErrorState";
import Toast from "../components/common/Toast";
import AddSubtaskModal from "../components/common/AddSubtaskModal";

/**
 * EventoDetallePage.jsx — route "/evento/:id" (US-02, T1; base para US-03/06/09).
 * Sprint 1: ver el evento y gestionar su plan inicial de subtareas logísticas.
 * Sprints futuros agregan editar/eliminar (US-03), reprogramar (US-06), etc.
 */
export default function EventoDetallePage() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  // Si llegamos aquí desde /crear (o cualquier otra pantalla) con un toast
  // en el state de navegación, lo mostramos y limpiamos el state para que
  // un refresh o "atrás" del navegador no lo vuelva a disparar.
  useEffect(() => {
    if (location.state?.toast) {
      setToast({ message: location.state.toast });
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);
  const { event, subtasks, status, errorMessage, addSubtask, reload } = useEventSubtasks(id);

  const [modalOpen, setModalOpen] = useState(false);
  const [toast, setToast] = useState(null);

  async function handleAddSubtask(payload) {
    // Si addSubtask lanza, dejamos que el modal muestre su generalError y
    // NO cerramos — el usuario no pierde lo que escribió.
    await addSubtask(payload);
    setModalOpen(false);
    setToast({ message: "Gestión agregada" });
  }

  return (
    <div className="max-w-[1440px] mx-auto px-4 md:px-8 lg:px-12 py-8">
      {/* ---------- Encabezado ---------- */}
      <header className="mb-7">
        <Link
          to="/hoy"
          className="font-body text-xs text-ink-muted hover:text-terracotta inline-flex items-center gap-1 mb-3 focus:outline-none focus:ring-2 focus:ring-terracotta focus:ring-offset-1 rounded-sharp"
        >
          <span className="material-symbols-outlined text-[16px]">arrow_back</span>
          <span>Volver a hoy</span>
        </Link>

        {status === "success" && event && (
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-5 border-b border-sepia-border">
            <div className="space-y-1.5">
              {event.type && (
                <span className="font-mono-stamp text-[11px] text-terracotta-dark bg-terracotta-light/70 border border-terracotta/30 px-2 py-0.5 rounded-sharp uppercase tracking-wide inline-block">
                  {EVENT_TYPE_LABELS[event.type] ?? event.type}
                </span>
              )}
              <h1 className="font-serif text-4xl sm:text-5xl text-ink-charcoal font-semibold tracking-tight leading-[1.08]">
                {event.name}
              </h1>
              <p className="font-body text-sm text-ink-muted">
                Plan de gestiones logísticas
              </p>
            </div>

            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="self-start sm:self-end inline-flex items-center gap-1.5 px-4 py-2 bg-terracotta hover:bg-terracotta-dark text-[#FAF6F0] font-body text-sm font-semibold rounded-sharp shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-terracotta focus:ring-offset-2 focus:ring-offset-paper-base"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              <span>Agregar gestión</span>
            </button>
          </div>
        )}
      </header>

      {/* ---------- Estados ---------- */}
      {status === "loading" && <LoadingRows />}

      {status === "error" && (
        <ErrorState message={errorMessage} onRetry={reload} />
      )}

      {status === "success" && subtasks.length === 0 && (
        <EmptyState
          icon="playlist_add"
          title="Aún no tienes gestiones logísticas para este evento"
          description="Descompón el evento en gestiones con plazo y horas estimadas para armar tu plan inicial."
          ctaLabel="Agregar subtarea"
          onCta={() => setModalOpen(true)}
        />
      )}

      {status === "success" && subtasks.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-baseline justify-between pb-2 border-b border-sepia-border">
            <h2 className="font-serif text-2xl text-ink-charcoal font-semibold">
              Plan inicial
            </h2>
            <span className="font-body text-xs text-ink-muted">
              {subtasks.length} {subtasks.length === 1 ? "gestión" : "gestiones"}
            </span>
          </div>
          <ul className="grid grid-cols-1 gap-3">
            {subtasks.map((s) => (
              <SubtaskListItem key={s.id} subtask={s} />
            ))}
          </ul>
        </section>
      )}

      {/* ---------- Overlays ---------- */}
      {modalOpen && (
        <AddSubtaskModal
          onCancel={() => setModalOpen(false)}
          onSubmit={handleAddSubtask}
        />
      )}
      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}

function SubtaskListItem({ subtask }) {
  return (
    <li className="bg-paper-card border border-sepia-border border-l-4 border-l-terracotta rounded-sharp p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 warm-card-shadow">
      <div className="space-y-1 min-w-0">
        <h3 className="font-serif text-lg text-ink-charcoal font-bold leading-snug truncate">
          {subtask.title}
        </h3>
        <p className="font-mono-stamp text-[11px] text-ink-muted">
          {formatShortDate(subtask.targetDate)}
          <span className="text-sepia-dark mx-1.5">•</span>
          {subtask.estimatedHours} hrs estimadas
        </p>
      </div>
      <span className="font-body text-[11px] font-bold uppercase tracking-wide text-terracotta-dark bg-terracotta-light/60 border border-terracotta/30 px-2 py-0.5 rounded-sharp self-start sm:self-center">
        {subtask.status}
      </span>
    </li>
  );
}

function LoadingRows() {
  return (
    <div className="space-y-3">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="h-20 bg-paper-linen border border-sepia-border border-l-4 border-l-sepia-dark/40 rounded-sharp animate-warm-pulse"
        />
      ))}
    </div>
  );
}