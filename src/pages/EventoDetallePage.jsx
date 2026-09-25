import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";

import { useEventSubtasks } from "../hooks/useEventSubtasks";
import { deleteEvent } from "../services/api";
import { classifyByDate } from "../utils/dateUtils";

import Toast from "../components/common/Toast";
import EditSubtaskModal from "../components/common/EditSubtaskModal";
import DeleteEventModal from "../components/eventos/DeleteEventModal";
import EditEventModal from "../components/common/EditEventModal";
import RescheduleModal from "../components/common/RescheduleModal";

import EventDossierHeader from "../components/eventos/EventDossierHeader";
import SubtaskFilters from "../components/eventos/SubtaskFilters";
import SubtaskListItem from "../components/eventos/SubtaskListItem";

const isDone = (s) => s?.status === "EJECUTADA";

/**
 * EventoDetallePage.jsx — route "/evento/:id"
 * Sprint 1 rediseño (Stitch) — dossier + filtros + acciones por gestión.
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
    updateEvent,
    updateSubtask,
    removeSubtask,
    reload,
  } = useEventSubtasks(id);

  const [toast, setToast] = useState(null);
  const [filter, setFilter] = useState("todas");

  const [editEventOpen, setEditEventOpen] = useState(false);
  const [deleteEventOpen, setDeleteEventOpen] = useState(false);
  const [editingSubtask, setEditingSubtask] = useState(null);
  const [deletingSubtask, setDeletingSubtask] = useState(null);
  const [rescheduleTarget, setRescheduleTarget] = useState(null);

  useEffect(() => {
    if (location.state?.toast) {
      setToast({ message: location.state.toast });
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  // --- Cálculos derivados ---
  const stats = useMemo(() => {
    const total = subtasks.length;
    const completed = subtasks.filter(isDone).length;
    const overdue = subtasks.filter(
      (s) => !isDone(s) && classifyByDate(s.targetDate) === "vencida"
    ).length;
    const pending = total - completed - overdue;
    return { total, completed, overdue, pending };
  }, [subtasks]);

  const filtered = useMemo(() => {
    const sorted = [...subtasks].sort((a, b) => {
      const aDone = isDone(a);
      const bDone = isDone(b);
      if (aDone !== bDone) return aDone ? 1 : -1;
      return new Date(a.targetDate) - new Date(b.targetDate);
    });

    if (filter === "vencidas")
      return sorted.filter(
        (s) => !isDone(s) && classifyByDate(s.targetDate) === "vencida"
      );
    if (filter === "pendientes")
      return sorted.filter(
        (s) => !isDone(s) && classifyByDate(s.targetDate) !== "vencida"
      );
    if (filter === "completadas") return sorted.filter(isDone);
    return sorted;
  }, [subtasks, filter]);



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
    navigate("/hoy", { state: { toast: "Evento eliminado" } });
  }

  async function handleDeleteSubtask() {
    await removeSubtask(deletingSubtask.id);
    setDeletingSubtask(null);
    setToast({ message: "Gestión eliminada" });
  }

  async function handleToggleDone(subtask) {
    const nextStatus = isDone(subtask) ? "PENDIENTE" : "EJECUTADA";
    try {
      await updateSubtask(subtask.id, { status: nextStatus });
      setToast({
        message:
          nextStatus === "EJECUTADA"
            ? "Gestión marcada como hecha"
            : "Gestión marcada como pendiente",
      });
    } catch (err) {
      setToast({ message: err.message || "No se pudo actualizar la gestión" });
    }
  }

  async function handleConfirmReschedule(newDateISO) {
    if (!rescheduleTarget) return;
    try {
      await updateSubtask(rescheduleTarget.id, { targetDate: newDateISO });
      setRescheduleTarget(null);
      setToast({ message: "Gestión reprogramada" });
    } catch (err) {
      setToast({ message: err.message || "No se pudo reprogramar" });
    }
  }

  return (
    <div className="w-full min-h-screen bg-paper-base dot-grid-pattern font-body text-ink-charcoal antialiased">
      <div className="max-w-[1280px] mx-auto px-4 md:px-8 lg:px-12 py-8">
        {/* ---------- Breadcrumb bar ---------- */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-sepia-border">
          <div className="flex items-center flex-wrap gap-3">
            <Link
              to="/hoy"
              className="inline-flex items-center gap-1.5 font-body text-xs text-ink-muted hover:text-ink-charcoal px-2.5 py-1.5 rounded-sharp border border-sepia-border bg-paper-card hover:bg-paper-linen transition-colors focus:outline-none focus:ring-2 focus:ring-terracotta focus:ring-offset-1"
            >
              <span className="material-symbols-outlined text-[16px]">arrow_back</span>
              <span className="font-medium">Volver a hoy</span>
            </Link>

            <div className="h-4 w-px bg-sepia-border hidden sm:block" />

            <nav className="flex items-center flex-wrap gap-2 font-body text-xs text-ink-muted">
              <span>Convoka</span>
              <span className="text-sepia-dark">/</span>
              <Link to="/hoy" className="hover:text-ink-charcoal transition-colors">
                Eventos
              </Link>
              <span className="text-sepia-dark">/</span>
              <span className="text-ink-charcoal font-medium truncate max-w-[220px]">
                {event?.name ?? "…"}
              </span>
            </nav>
          </div>

          {status === "success" && event && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setEditEventOpen(true)}
                className="inline-flex items-center gap-1.5 font-body text-xs text-terracotta hover:text-terracotta-dark px-3 py-1.5 rounded-sharp border border-sepia-border bg-paper-card hover:bg-paper-linen transition-colors focus:outline-none focus:ring-2 focus:ring-terracotta focus:ring-offset-1"
              >
                <span className="material-symbols-outlined text-[16px]">edit</span>
                <span>Editar ficha de evento</span>
              </button>
              <button
                type="button"
                onClick={() => setDeleteEventOpen(true)}
                title="Eliminar evento"
                aria-label="Eliminar evento"
                className="p-1.5 rounded-sharp border border-sepia-border bg-paper-card text-ink-muted hover:text-crimson-urgent hover:border-crimson-urgent/40 hover:bg-crimson-paper transition-colors focus:outline-none focus:ring-2 focus:ring-crimson-urgent focus:ring-offset-1"
              >
                <span className="material-symbols-outlined text-[16px]">delete</span>
              </button>
            </div>
          )}
        </div>

        {/* ---------- Dossier ---------- */}
        {status === "loading" && <DossierSkeleton />}
        {status === "error" && <ErrorCard message={errorMessage} onRetry={reload} />}
        {status === "success" && event && (
          <EventDossierHeader event={event} stats={stats} />
        )}

        {/* ---------- Sección Gestiones ---------- */}
        <section className="mt-10 mb-12">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-sepia-border">
            <div className="flex items-center gap-3 flex-wrap">
              <h3 className="font-serif text-2xl md:text-3xl text-ink-charcoal font-semibold tracking-tight">
                Gestiones y subtareas operativas
              </h3>
              {status === "success" && (
                <span className="font-mono-stamp text-[11px] bg-paper-card text-ink-muted px-2.5 py-1 rounded-sharp border border-sepia-border font-medium">
                  {stats.total === 0
                    ? "0 gestiones"
                    : `${stats.pending} pendientes, ${stats.completed} completadas`}
                </span>
              )}
            </div>

            {status === "success" && (
              <button
                type="button"
                onClick={() => navigate(`/evento/${id}/gestiones/crear`)}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-terracotta hover:bg-terracotta-dark text-[#FAF6F0] font-body text-sm font-semibold rounded-sharp shadow-sm transition-colors active:translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-terracotta focus:ring-offset-2 focus:ring-offset-paper-base"
              >
                <span className="material-symbols-outlined text-[18px]">add</span>
                <span>Crear subgestión</span>
              </button>
            )}
          </div>

          {status === "loading" && <ListSkeleton />}

          {status === "success" && stats.total === 0 && (
            <SubtasksEmpty eventName={event?.name} onAdd={() => navigate(`/evento/${id}/gestiones/crear`)} />
          )}

          {status === "success" && stats.total > 0 && (
            <SubtaskFilters value={filter} onChange={setFilter} counts={stats} />
          )}

          {status === "success" && stats.total > 0 && filtered.length === 0 && (
            <div className="mt-2 py-10 text-center">
              <p className="font-body text-sm text-ink-muted">
                No hay gestiones en este filtro.
              </p>
            </div>
          )}

          {status === "success" && filtered.length > 0 && (
            <ul className="space-y-3 mt-2">
              {filtered.map((s) => (
                <SubtaskListItem
                  key={s.id}
                  subtask={s}
                  onToggleDone={() => handleToggleDone(s)}
                  onMarkDone={() => handleToggleDone(s)}
                  onEdit={() => setEditingSubtask(s)}
                  onDelete={() => setDeletingSubtask(s)}
                  onReschedule={() => setRescheduleTarget(s)}
                />
              ))}
            </ul>
          )}
        </section>
      </div>


      {editingSubtask && (
  <EditSubtaskModal
    initialSubtask={editingSubtask}
    eventName={event?.name}
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
  <DeleteEventModal
    event={event}
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

      {rescheduleTarget && (
        <RescheduleModal
          mode="single"
          currentDateISO={rescheduleTarget.targetDate}
          onCancel={() => setRescheduleTarget(null)}
          onConfirm={handleConfirmReschedule}
        />
      )}

      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Estados locales (loading / error / empty)
// ---------------------------------------------------------------------------

function DossierSkeleton() {
  return (
    <div className="mt-6 bg-paper-card border border-sepia-border rounded-sharp p-6 sm:p-8 animate-warm-pulse">
      <div className="h-3 w-16 bg-paper-linen rounded-sharp mb-4" />
      <div className="h-10 w-72 max-w-full bg-paper-linen rounded-sharp mb-3" />
      <div className="h-4 w-40 bg-paper-linen rounded-sharp mb-6" />
      <div className="h-3 w-3/4 bg-paper-linen rounded-sharp" />
    </div>
  );
}

function ListSkeleton() {
  return (
    <div className="space-y-3 mt-4">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="h-20 bg-paper-linen border border-sepia-border border-l-4 border-l-sepia-dark/40 rounded-sharp animate-warm-pulse"
        />
      ))}
    </div>
  );
}

function ErrorCard({ message, onRetry }) {
  return (
    <div className="mt-6 bg-paper-card border border-sepia-border rounded-sharp warm-card-shadow p-8 md:p-12 text-center flex flex-col items-center">
      <div className="w-12 h-12 rounded-full bg-crimson-paper border border-crimson-urgent/30 flex items-center justify-center text-crimson-urgent mb-5">
        <span className="material-symbols-outlined text-[24px]">sync_problem</span>
      </div>
      <h3 className="font-serif font-semibold text-ink-charcoal text-2xl md:text-3xl mb-2">
        {message || "No pudimos cargar las gestiones del evento"}
      </h3>
      <p className="max-w-md mx-auto font-body text-sm text-ink-muted mb-8 leading-relaxed">
        Hubo una incidencia al conectar con el servidor. Tus datos guardados están a salvo.
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="inline-flex items-center gap-2 px-6 py-2.5 bg-terracotta hover:bg-terracotta-dark text-[#FAF6F0] font-body text-sm font-semibold rounded-sharp shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-terracotta focus:ring-offset-2 focus:ring-offset-paper-base"
      >
        <span className="material-symbols-outlined text-[18px]">refresh</span>
        <span>Reintentar carga</span>
      </button>
    </div>
  );
}

function SubtasksEmpty({ eventName, onAdd }) {
  return (
    <div className="mt-6 bg-paper-card border border-sepia-border rounded-sharp warm-card-shadow p-10 sm:p-14 text-center flex flex-col items-center">
      <div className="w-16 h-16 rounded-full bg-terracotta-light border border-terracotta/30 flex items-center justify-center text-terracotta mb-5">
        <span className="material-symbols-outlined text-[32px]">
          assignment_turned_in
        </span>
      </div>
      <h3 className="font-serif font-semibold text-ink-charcoal text-2xl md:text-3xl mb-2">
        No tienes gestiones programadas
      </h3>
      <p className="max-w-md mx-auto font-body text-sm text-ink-muted mb-8 leading-relaxed">
        Comienza organizando la hoja de ruta{" "}
        {eventName ? (
          <>
            para <strong className="text-ink-charcoal">{eventName}</strong>{" "}
          </>
        ) : (
          ""
        )}
        añadiendo proveedores, tiempos de entrega y tareas operativas.
      </p>
      <button
        type="button"
        onClick={onAdd}
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-terracotta hover:bg-terracotta-dark text-[#FAF6F0] font-body text-sm font-semibold rounded-sharp shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-terracotta focus:ring-offset-2 focus:ring-offset-paper-base"
      >
        <span className="material-symbols-outlined text-[18px]">add</span>
        <span>Crear primera gestión</span>
      </button>
    </div>
  );
}