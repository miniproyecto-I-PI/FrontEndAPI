import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

import { useEventSubtasks } from "../hooks/useEventSubtasks";
import { deleteEvent, getToday } from "../services/api";
import { classifyByDate } from "../utils/dateUtils";

import UpdateEventSuccessModal from "../components/common/UpdateEventSuccessModal";
import UpdateSubtaskSuccessModal from "../components/common/UpdateSubtaskSuccessModal";
import Toast from "../components/common/Toast";
import StateCard from "../components/common/StateCard";
import EditSubtaskModal from "../components/common/EditSubtaskModal";
import DeleteEventModal from "../components/eventos/DeleteEventModal";
import EditEventModal from "../components/common/EditEventModal";
import RescheduleModal from "../components/common/RescheduleModal";
import DeleteSubtaskModal from "../components/eventos/DeleteSubtaskModal";
import EventDossierHeader from "../components/eventos/EventDossierHeader";
import SubtaskFilters from "../components/eventos/SubtaskFilters";
import SubtaskListItem from "../components/eventos/SubtaskListItem";
import PageContainer from "../components/layout/PageContainer";
import { Breadcrumb } from "../components/layout/PageHeader";

const isDone = (s) => s?.status === "EJECUTADA";

/**
 * EventoDetallePage.jsx — route "/evento/:id"
 * Diseño Stitch — ficha del evento + filtros + acciones por gestión.
 *
 * Estados: cargando, éxito, sin gestiones, filtro sin resultados, evento no
 * encontrado (404: no existe o es de otro organizador — aislamiento US-11),
 * error al cargar el evento y error al cargar solo sus gestiones (la ficha
 * se mantiene con "Progreso no disponible").
 */
export default function EventoDetallePage() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const {
    event,
    subtasks,
    status,
    isRefreshing,
    updateEvent,
    updateSubtask,
    removeSubtask,
    reload,
  } = useEventSubtasks(id);

  const [toast, setToast] = useState(() => location.state?.toast ? { message: location.state.toast } : null);
  const [filter, setFilter] = useState("todas");

  const [editEventOpen, setEditEventOpen] = useState(false);
  const [deleteEventOpen, setDeleteEventOpen] = useState(false);
  const [editingSubtask, setEditingSubtask] = useState(null);
  const [deletingSubtask, setDeletingSubtask] = useState(null);
  const [updatedEventName, setUpdatedEventName] = useState(null);
  const [updatedSubtaskTitle, setUpdatedSubtaskTitle] = useState(null);
  const [rescheduleTarget, setRescheduleTarget] = useState(null);
  const [allUserGestiones, setAllUserGestiones] = useState([]);

  useEffect(() => {
    getToday().then(setAllUserGestiones).catch(() => {});
  }, []);

  const mergedGestiones = useMemo(() => {
    const map = new Map();
    (allUserGestiones || []).forEach((g) => map.set(String(g.id), g));
    (subtasks || []).forEach((g) => map.set(String(g.id), g));
    return Array.from(map.values());
  }, [allUserGestiones, subtasks]);

  useEffect(() => {
    if (location.state?.toast) {
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
      return (
      new Date(a.targetDate) - new Date(b.targetDate) ||
      a.estimatedHours - b.estimatedHours
    );
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
  const title = editingSubtask.title;
  setEditingSubtask(null);
  setUpdatedSubtaskTitle(title);
}

async function handleEditEvent(payload) {
  await updateEvent(payload);
  const name = payload.name;
  setEditEventOpen(false);
  setUpdatedEventName(name);
}

  async function handleDeleteEvent() {
    await deleteEvent(id);
    navigate("/eventos", { state: { toast: "Evento eliminado" } });
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
      setToast({ message: err.message || "No se pudo actualizar la gestión", intent: "error" })
    }
  }

  async function handleConfirmReschedule() {
    setRescheduleTarget(null);
    await Promise.all([
      reload(),
      getToday().then(setAllUserGestiones).catch(() => {}),
    ]);
    setToast({ message: "Gestión reprogramada" });
  }

  return (
    <>
      <PageContainer>
        {/* ---------- Breadcrumb bar ---------- */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-sepia-border">
          <Breadcrumb
            backTo="/eventos"
            items={[
              { label: "Convoka", to: "/hoy" },
              { label: "Eventos", to: "/eventos" },
              { label: event?.name ?? "…" },
            ]}
          />

          {event && (
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

        {/* ---------- Evento inexistente / ajeno o sin conexión ---------- */}
        {status === "notfound" && (
          <StateCard
            icon="search_off"
            stamp="Expediente no disponible"
            title="Evento no encontrado"
            description="Este evento no existe o no pertenece a tu cuenta. Revisa tu listado de eventos para continuar."
            primaryAction={{ label: "Ir a Mis Eventos", icon: "arrow_back", onClick: () => navigate("/eventos") }}
          />
        )}
        {status === "error" && (
          <StateCard
            tone="error"
            icon="sync_problem"
            stamp="Incidencia de sincronización"
            title="No pudimos cargar este evento"
            description="Hubo una incidencia al conectar con el servidor. Tus datos guardados están a salvo."
            primaryAction={{ label: isRefreshing ? "Reintentando…" : "Reintentar carga", icon: "refresh", onClick: reload, disabled: isRefreshing }}
            secondaryAction={{ label: "Ir a Mis Eventos", icon: "arrow_back", onClick: () => navigate("/eventos") }}
          />
        )}

        {/* ---------- Dossier ---------- */}
        {status === "loading" && <DossierSkeleton />}
        {event && (status === "success" || status === "subtasksError") && (
          <EventDossierHeader event={event} stats={stats} progressUnavailable={status === "subtasksError"} />
        )}

        {/* ---------- Sección Gestiones ---------- */}
        {(status === "loading" || status === "success" || status === "subtasksError") && (
          <section className="mt-10 mb-12" aria-labelledby="gestiones-evento">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-sepia-border">
              <div className="flex items-center gap-3 flex-wrap">
                <h2 id="gestiones-evento" className="font-heading text-2xl md:text-3xl text-ink-charcoal font-semibold tracking-tight">
                  Gestiones logísticas
                </h2>
                {status === "success" && (
                  <span className="font-mono-stamp text-[11px] bg-paper-card text-ink-muted px-2.5 py-1 rounded-sharp border border-sepia-border font-medium">
                    {stats.total === 0 ? "0 gestiones" : `${stats.pending + stats.overdue} pendientes, ${stats.completed} completadas`}
                  </span>
                )}
                {status === "subtasksError" && (
                  <span className="font-mono-stamp text-[11px] uppercase tracking-wider bg-crimson-paper text-crimson-tag px-2.5 py-1 rounded-sharp border border-crimson-urgent/30">
                    Error de sincronización
                  </span>
                )}
              </div>

              {event && (
                <button
                  type="button"
                  onClick={() => navigate(`/evento/${id}/gestiones/crear`)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-terracotta hover:bg-terracotta-dark text-[#FAF6F0] font-body text-sm font-semibold rounded-sharp shadow-sm transition-colors active:translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-terracotta focus-visible:ring-offset-2 focus-visible:ring-offset-paper-base"
                >
                  <span className="material-symbols-outlined text-[18px]" aria-hidden="true">add</span>
                  <span>Nueva gestión</span>
                </button>
              )}
            </div>

            {status === "loading" && <ListSkeleton />}

            {status === "subtasksError" && (
              <StateCard
                tone="error"
                icon="sync_problem"
                title="No pudimos cargar las gestiones del evento"
                description={`Hubo una incidencia al conectar con el servidor de operaciones de ${event?.name ?? "este evento"}. Tus datos guardados están a salvo.`}
                primaryAction={{ label: isRefreshing ? "Reintentando…" : "Reintentar carga", icon: "refresh", onClick: reload, disabled: isRefreshing }}
                compact
              />
            )}

            {status === "success" && stats.total === 0 && (
              <StateCard
                icon="assignment_add"
                stamp="Hoja de ruta vacía"
                title="Aún no hay gestiones para este evento"
                description={`Comienza la hoja de ruta de ${event?.name ?? "este evento"} añadiendo proveedores, fechas límite y gestiones logísticas.`}
                primaryAction={{ label: "Crear primera gestión", icon: "add", onClick: () => navigate(`/evento/${id}/gestiones/crear`) }}
                compact
              />
            )}

            {status === "success" && stats.total > 0 && (
              <SubtaskFilters value={filter} onChange={setFilter} counts={stats} />
            )}

            {status === "success" && stats.total > 0 && filtered.length === 0 && (
              <StateCard
                icon="filter_alt_off"
                title="No hay gestiones en este filtro"
                description="Cambia de filtro para ver el resto de la hoja de ruta."
                primaryAction={{ label: "Ver todas", icon: "list", onClick: () => setFilter("todas") }}
                compact
              />
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
        )}
      </PageContainer>


      {editingSubtask && (
  <EditSubtaskModal
    initialSubtask={editingSubtask}
    eventName={event?.name}
    eventDateTime={event?.dateTime}
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
  <DeleteSubtaskModal
    subtask={deletingSubtask}
    eventName={event?.name}
    onCancel={() => setDeletingSubtask(null)}
    onConfirm={handleDeleteSubtask}
  />
)}

      {rescheduleTarget && (
        <RescheduleModal
          mode="single"
          gestion={rescheduleTarget}
          currentDateISO={rescheduleTarget.targetDate}
          eventDateTime={event?.dateTime}
          allGestiones={mergedGestiones}
          onCancel={() => setRescheduleTarget(null)}
          onConfirm={handleConfirmReschedule}
        />
      )}

      {updatedEventName && (
  <UpdateEventSuccessModal
    eventName={updatedEventName}
    onStay={() => setUpdatedEventName(null)}
    onGoToEvents={() => setUpdatedEventName(null)}
  />
)}

{updatedSubtaskTitle && (
  <UpdateSubtaskSuccessModal
    subtaskTitle={updatedSubtaskTitle}
    eventId={id}
    onClose={() => setUpdatedSubtaskTitle(null)}
  />
)}

      <Toast toast={toast} onClose={() => setToast(null)} />
    </>
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


