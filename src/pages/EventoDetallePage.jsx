import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";

import { useEventSubtasks } from "../hooks/useEventSubtasks";
import { deleteEvent } from "../services/api";
import { EVENT_TYPE_LABELS } from "../data/mockGestiones";
import { formatShortDate } from "../utils/dateUtils";

import EmptyState from "../components/common/EmptyState";
import ErrorState from "../components/common/ErrorState";
import Toast from "../components/common/Toast";
import AddSubtaskModal from "../components/common/AddSubtaskModal";
import ConfirmDeleteModal from "../components/common/ConfirmDeleteModal";
import EditEventModal from "../components/common/EditEventModal";

/**
 * EventoDetallePage.jsx — route "/evento/:id"
 * Sprint 1: US-01/02 (crear evento + gestiones) + US-03 (editar/eliminar).
 * EventoDetallePage.jsx — route "/evento/:id" (US-02, T1; base para US-03/06/09).
 * Sprint 1: ver el evento y gestionar su plan inicial de subtareas logísticas.
 * Sprints futuros agregan editar/eliminar (US-03), reprogramar (US-06), etc.
 */
export default function EventoDetallePage() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const {
    event,
    subtasks,
    status,
    errorMessage,
    addSubtask,
    updateEvent,
    updateSubtask,
    removeSubtask,
    reload,
  } = useEventSubtasks(id);

  const [toast, setToast] = useState(null);

  // Modales activos (null = cerrado).
  const [addOpen, setAddOpen] = useState(false);
  const [editEventOpen, setEditEventOpen] = useState(false);
  const [deleteEventOpen, setDeleteEventOpen] = useState(false);
  const [editingSubtask, setEditingSubtask] = useState(null); // subtask obj o null
  const [deletingSubtask, setDeletingSubtask] = useState(null);

  // Toast desde navegación (crear evento, etc.)
  useEffect(() => {
    if (location.state?.toast) {
      setToast({ message: location.state.toast });
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  // --- Handlers ---

  async function handleAdd(payload) {
    await addSubtask(payload);
    setAddOpen(false);
    setToast({ message: "Gestión agregada" });
  }

  async function handleEditSubtask(payload) {
    await updateSubtask(editingSubtask.id, payload);
    setEditingSubtask(null);
    setToast({ message: "Cambios guardados" });
  }

  async function handleEditEvent(payload) {
    await updateEvent(payload);
    setEditEventOpen(false);
    setToast({ message: "Cambios guardados" });
  }

  async function handleDeleteEvent() {
    await deleteEvent(id);
    // Navegamos FUERA de esta página: el evento ya no existe.
    navigate("/hoy", { state: { toast: "Evento eliminado" } });
  }

  async function handleDeleteSubtask() {
    await removeSubtask(deletingSubtask.id);
    setDeletingSubtask(null);
    setToast({ message: "Gestión eliminada" });
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
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-5 border-b border-sepia-border">
            <div className="space-y-1.5 min-w-0">
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

            <div className="flex flex-wrap items-center gap-2 self-start lg:self-end">
              <button
                type="button"
                onClick={() => setEditEventOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-sharp bg-paper-card hover:bg-paper-linen border border-sepia-border text-ink-charcoal font-body text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-terracotta focus:ring-offset-2 focus:ring-offset-paper-base"
              >
                <span className="material-symbols-outlined text-[18px] text-ink-muted">edit</span>
                <span>Editar</span>
              </button>
              <button
                type="button"
                onClick={() => setDeleteEventOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-sharp bg-paper-card hover:bg-crimson-paper border border-sepia-border hover:border-crimson-urgent/40 text-crimson-urgent font-body text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-crimson-urgent focus:ring-offset-2 focus:ring-offset-paper-base"
              >
                <span className="material-symbols-outlined text-[18px]">delete</span>
                <span>Eliminar</span>
              </button>
              <button
                type="button"
                onClick={() => setAddOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-terracotta hover:bg-terracotta-dark text-[#FAF6F0] font-body text-sm font-semibold rounded-sharp shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-terracotta focus:ring-offset-2 focus:ring-offset-paper-base"
              >
                <span className="material-symbols-outlined text-[18px]">add</span>
                <span>Agregar gestión</span>
              </button>
            </div>
          </div>
        )}
      </header>

      {/* ---------- Estados ---------- */}
      {status === "loading" && <LoadingRows />}

      {status === "error" && <ErrorState message={errorMessage} onRetry={reload} />}

      {status === "success" && subtasks.length === 0 && (
        <EmptyState
          icon="playlist_add"
          title="Aún no tienes gestiones logísticas para este evento"
          description="Descompón el evento en gestiones con plazo y horas estimadas para armar tu plan inicial."
          ctaLabel="Agregar subtarea"
          onCta={() => setAddOpen(true)}
        />
      )}

      {status === "success" && subtasks.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-baseline justify-between pb-2 border-b border-sepia-border">
            <h2 className="font-serif text-2xl text-ink-charcoal font-semibold">Plan inicial</h2>
            <span className="font-body text-xs text-ink-muted">
              {subtasks.length} {subtasks.length === 1 ? "gestión" : "gestiones"}
            </span>
          </div>
          <ul className="grid grid-cols-1 gap-3">
            {subtasks.map((s) => (
              <SubtaskListItem
                key={s.id}
                subtask={s}
                onEdit={() => setEditingSubtask(s)}
                onDelete={() => setDeletingSubtask(s)}
              />
            ))}
          </ul>
        </section>
      )}

      {/* ---------- Overlays ---------- */}
      {addOpen && (
        <AddSubtaskModal onCancel={() => setAddOpen(false)} onSubmit={handleAdd} />
      )}

      {editingSubtask && (
        <AddSubtaskModal
          initialValues={editingSubtask}
          onCancel={() => setEditingSubtask(null)}
          onSubmit={handleEditSubtask}
        />
      )}

      {editEventOpen && event && (
        <EditEventModal
          initialEvent={event}
          onCancel={() => setEditEventOpen(false)}
          onSubmit={handleEditEvent}
        />
      )}

      {deleteEventOpen && event && (
        <ConfirmDeleteModal
          title={`¿Eliminar "${event.name}"?`}
          description={
            subtasks.length > 0
              ? `Se eliminarán también sus ${subtasks.length} ${subtasks.length === 1 ? "gestión" : "gestiones"}. Esta acción no se puede deshacer.`
              : "Este evento no tiene gestiones asociadas. Esta acción no se puede deshacer."
          }
          onCancel={() => setDeleteEventOpen(false)}
          onConfirm={handleDeleteEvent}
        />
      )}

      {deletingSubtask && (
        <ConfirmDeleteModal
          title="¿Eliminar esta gestión?"
          description={`"${deletingSubtask.title}" se eliminará del plan del evento. Esta acción no se puede deshacer.`}
          onCancel={() => setDeletingSubtask(null)}
          onConfirm={handleDeleteSubtask}
        />
      )}

      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}

function SubtaskListItem({ subtask, onEdit, onDelete }) {
  return (
    <li className="bg-paper-card border border-sepia-border border-l-4 border-l-terracotta rounded-sharp p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 warm-card-shadow">
      <div className="space-y-1 min-w-0 flex-1">
        <h3 className="font-serif text-lg text-ink-charcoal font-bold leading-snug truncate">
          {subtask.title}
        </h3>
        <p className="font-mono-stamp text-[11px] text-ink-muted">
          {formatShortDate(subtask.targetDate)}
          <span className="text-sepia-dark mx-1.5">•</span>
          {subtask.estimatedHours} hrs estimadas
        </p>
      </div>

      <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
        <span className="font-body text-[11px] font-bold uppercase tracking-wide text-terracotta-dark bg-terracotta-light/60 border border-terracotta/30 px-2 py-0.5 rounded-sharp">
          {subtask.status}
        </span>
        <button
          type="button"
          onClick={onEdit}
          aria-label={`Editar gestión "${subtask.title}"`}
          className="p-1.5 rounded-sharp bg-paper-linen hover:bg-paper-base border border-sepia-border text-ink-muted hover:text-terracotta transition-colors focus:outline-none focus:ring-2 focus:ring-terracotta focus:ring-offset-1"
        >
          <span className="material-symbols-outlined text-[16px]">edit</span>
        </button>
        <button
          type="button"
          onClick={onDelete}
          aria-label={`Eliminar gestión "${subtask.title}"`}
          className="p-1.5 rounded-sharp bg-paper-linen hover:bg-crimson-paper border border-sepia-border hover:border-crimson-urgent/40 text-ink-muted hover:text-crimson-urgent transition-colors focus:outline-none focus:ring-2 focus:ring-crimson-urgent focus:ring-offset-1"
        >
          <span className="material-symbols-outlined text-[16px]">delete</span>
        </button>
      </div>
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