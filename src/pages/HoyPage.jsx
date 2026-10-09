import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useOutletContext } from "react-router-dom";
import { useTodayGestiones } from "../hooks/useTodayGestiones";
import { formatFullDate } from "../utils/dateUtils";
import { PRIORITY_RULE_BY_GROUP, UPCOMING_WINDOW_DAYS } from "../utils/sortGestiones";

import PageContainer from "../components/layout/PageContainer";
import PageHeader from "../components/layout/PageHeader";
import PriorityRuleTooltip from "../components/common/PriorityRuleTooltip";
import StatCard from "../components/common/StatCard";
import StateCard from "../components/common/StateCard";
import LoadingSkeleton, { StatsSkeleton } from "../components/common/LoadingSkeleton";
import Toast from "../components/common/Toast";
import RescheduleModal from "../components/common/RescheduleModal";
import EditSubtaskModal from "../components/common/EditSubtaskModal";
import GestionesGalleryModal from "../components/common/GestionesGalleryModal";
import TaskCard from "../components/tasks/TaskCard";
import TaskCardGalleryOverlay from "../components/tasks/TaskCardGalleryOverlay";
import HoyFilters from "../components/tasks/HoyFilters";
import HoyKanbanView from "../components/tasks/HoyKanbanView";
import SimulationToolbar from "../components/dev/SimulationToolbar";

/**
 * HoyPage.jsx — ruta "/hoy" (T2: US-04 vista Hoy + US-05 filtros).
 *
 * Diseño Stitch (Sprint 2). Estados: cargando (esqueleto + "Sincronizando…"),
 * vacío con acción "Crear evento", sin resultados por filtro con "Limpiar
 * filtros", error de carga / error al filtrar con "Reintentar", y éxito con
 * los tres grupos (Vencidas, Agenda de Hoy, Próximas), cada uno con su regla
 * de orden en el tooltip "¿Cómo se ordena?" junto al título. La sección
 * "0. Ejecutadas" solo aparece con el switch "Mostrar gestiones ejecutadas"
 * o con el chip de estado "Ejecutadas".
 *
 * Header, Footer y buscador vienen de MainLayout (useOutletContext).
 */
export default function HoyPage() {
  const { search, setSearch } = useOutletContext();
  const location = useLocation();
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState("agenda"); // 'agenda' | 'kanban'
  const [simMode, setSimMode] = useState("normal"); // 'normal' | 'empty' | 'error' (solo desarrollo)
  const [rescheduleTarget, setRescheduleTarget] = useState(null);
  const [editTarget, setEditTarget] = useState(null); // gestión en edición (título de la tarjeta o botón Editar)
  const [toast, setToast] = useState(() => (location.state?.toast ? { message: location.state.toast } : null));
  const closeToast = useCallback(() => setToast(null), []);

  const [galleryModal, setGalleryModal] = useState({
    isOpen: false,
    group: null, // 'hoy' | 'vencidas' | 'proximas'
    initialIndex: 0,
  });

  function openGallery(group, initialIndex = 0) {
    setGalleryModal({
      isOpen: true,
      group,
      initialIndex,
    });
  }

  function closeGallery() {
    setGalleryModal((p) => ({ ...p, isOpen: false }));
  }

  useEffect(() => {
    if (location.state?.toast) navigate(location.pathname, { replace: true, state: {} });
  }, [location, navigate]);

  const { status, isRefreshing, errorKind, grouped, stats, filters, eventOptions, actions, reload, allGestiones } = useTodayGestiones({
    query: search,
    simulateError: simMode === "error",
    simulateEmpty: simMode === "empty",
  });

  const totalVisible = grouped.ejecutadas.length + grouped.vencidas.length + grouped.hoy.length + grouped.proximas.length;
  const isFiltering = filters.hasServerFilters || search.trim() !== "";

  function clearAllFilters() {
    filters.clearFilters();
    setSearch("");
  }

  async function handleMarkDone(gestion) {
    const ok = await actions.markAsDone(gestion.id);
    if (!ok) {
      setToast({ message: "No se pudo marcar la gestión. Intenta de nuevo.", intent: "error" });
      return;
    }
    setToast({
      message: "Gestión marcada como hecha",
      onUndo: async () => {
        const undone = await actions.undoMarkAsDone(gestion.id);
        if (!undone) setToast({ message: "No se pudo deshacer el cambio.", intent: "error" });
      },
    });
  }

  async function handleConfirmReschedule() {
    setRescheduleTarget(null);
    await reload();
    setToast({ message: "Gestión reprogramada" });
  }

  async function handleEditSubmit(payload) {
    await actions.editGestion(editTarget.id, payload);
    setEditTarget(null);
    setToast({ message: "Gestión actualizada" });
  }

  // /today no trae la fecha del evento; se toma de la lista de eventos.
  const eventDateOf = (gestion) => eventOptions.find((o) => o.value === gestion.eventId)?.dateTime;

  const galleryGestiones = useMemo(() => {
    if (galleryModal.group === "hoy") return grouped.hoy;
    if (galleryModal.group === "vencidas") return grouped.vencidas;
    if (galleryModal.group === "proximas") return grouped.proximas;
    return [];
  }, [galleryModal.group, grouped]);

  const galleryMeta = useMemo(() => {
    if (galleryModal.group === "hoy") {
      return { title: "Agenda de Hoy", numeral: "II.", tone: "terracotta" };
    }
    if (galleryModal.group === "vencidas") {
      return { title: "Gestiones Vencidas", numeral: "I.", tone: "crimson" };
    }
    if (galleryModal.group === "proximas") {
      return { title: "Próximas Jornadas", numeral: "III.", tone: "sepia" };
    }
    return { title: "Gestiones", numeral: "", tone: "terracotta" };
  }, [galleryModal.group]);

  const totalForBars = Math.max(1, totalVisible);
  const showStats = status !== "error";

  return (
    <>
      <PageContainer>
        <PageHeader
          eyebrow={formatFullDate()}
          title="Gestiones"
          accent="para hoy"
          aside={
            <HoyFilters
              eventOptions={eventOptions}
              eventFilter={filters.eventFilter}
              onEventChange={filters.setEventFilter}
              statusFilter={filters.statusFilter}
              onStatusChange={filters.setStatusFilter}
              onClear={filters.clearFilters}
              showExecuted={filters.showExecuted}
              onShowExecutedChange={filters.setShowExecuted}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              disabled={status === "loading"}
            />
          }
        />

        {/* ---------- Resumen de actividad ---------- */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
          <span className="font-stamp text-[11px] uppercase tracking-wider text-ink-muted font-bold">Resumen de actividad</span>
          {isRefreshing && (
            <span role="status" className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-paper-card border border-sepia-border rounded-sharp font-body text-xs text-terracotta-dark">
              <span className="material-symbols-outlined text-[15px] animate-spin" aria-hidden="true">sync</span>
              Sincronizando bitácora y gestiones del día…
            </span>
          )}
        </div>

        {showStats && (
          <div className="mb-9">
            {status === "loading" ? (
              <StatsSkeleton />
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
                <StatCard label="Vencidas" tag={stats.overdueCount ? "Urgente" : "Al día"} value={stats.overdueCount} unit="gestiones atrasadas" accent="crimson" barWidthPercent={(stats.overdueCount / totalForBars) * 100} />
                <StatCard label="Para hoy" tag="En curso" value={stats.todayCount} unit="prioritarias del día" accent="terracotta" barWidthPercent={(stats.todayCount / totalForBars) * 100} />
                <StatCard label="Próximas" tag={`${UPCOMING_WINDOW_DAYS} días`} value={stats.upcomingCount} unit="en agenda" accent="neutral" barWidthPercent={(stats.upcomingCount / totalForBars) * 100} />
                <StatCard label="Carga estimada" tag="Horas" value={stats.estimatedLoadHours} unit="hrs estimadas" accent="sage" barWidthPercent={stats.estimatedLoadHours ? (stats.todayLoadHours / stats.estimatedLoadHours) * 100 : 0} />
              </div>
            )}
          </div>
        )}

        {/* ---------- Cuerpo ---------- */}
        {status === "loading" && <LoadingSkeleton />}

        {status === "error" && (
          <StateCard
            tone="error"
            icon={errorKind === "filter" ? "filter_alt_off" : "cloud_off"}
            stamp="Incidencia de sincronización"
            title={errorKind === "filter" ? "Ha ocurrido un fallo al aplicar el filtro" : "No pudimos cargar tus gestiones"}
            description="Hubo una dificultad de conexión con el servidor. Tus datos guardados están a salvo. Revisa tu conexión o inténtalo de nuevo."
            primaryAction={{ label: isRefreshing ? "Reintentando…" : "Reintentar", icon: "refresh", onClick: reload, disabled: isRefreshing }}
            secondaryAction={errorKind === "filter" ? { label: "Limpiar filtros", icon: "filter_list_off", onClick: clearAllFilters } : undefined}
          />
        )}

        {status === "success" && totalVisible === 0 && isFiltering && (
          <StateCard
            icon="filter_alt_off"
            stamp="0 resultados encontrados"
            title="No hay gestiones para este filtro"
            description="No se encontraron gestiones con este evento, estado o búsqueda. Limpia los filtros para volver a ver toda tu agenda."
            primaryAction={{ label: "Limpiar filtros", icon: "filter_list_off", onClick: clearAllFilters }}
          />
        )}

        {status === "success" && totalVisible === 0 && !isFiltering && (
          <StateCard
            icon="event_available"
            title="Hoy no tienes gestiones pendientes. ¿Creamos un evento?"
            description="No hay tareas atrasadas ni actividades programadas para la jornada. Puedes comenzar planificando un nuevo evento o explorar tus eventos activos."
            primaryAction={{ label: "Crear evento", icon: "add", onClick: () => navigate("/crear") }}
            secondaryAction={{ label: "Explorar eventos activos", icon: "calendar_month", onClick: () => navigate("/eventos") }}
            footnote={
              <>
                <span className="material-symbols-outlined text-[16px] text-sage-wax" aria-hidden="true">check_circle</span>
                Tu agenda está completamente al día
              </>
            }
          />
        )}

        {status === "success" && totalVisible > 0 && (
          viewMode === "kanban" ? (
            <div className={`transition-opacity ${isRefreshing ? "opacity-60" : ""}`} aria-busy={isRefreshing}>
              <HoyKanbanView
                grouped={grouped}
                onMarkDone={handleMarkDone}
                onReschedule={(g) => setRescheduleTarget(g)}
                onEdit={(g) => setEditTarget(g)}
                showExecuted={filters.showExecuted}
              />
            </div>
          ) : (
            <div className={`space-y-9 transition-opacity ${isRefreshing ? "opacity-60" : ""}`} aria-busy={isRefreshing}>
              {grouped.ejecutadas.length > 0 && (
                <section className="space-y-3.5" aria-labelledby="hoy-ejecutadas">
                  <SectionHeading id="hoy-ejecutadas" numeral="0." title="Ejecutadas" rule={PRIORITY_RULE_BY_GROUP.ejecutadas} tone="sage" />
                  <div className="grid grid-cols-1 gap-3">
                    {grouped.ejecutadas.map((g) => (
                      <TaskCard key={g.id} gestion={g} variant="ejecutada" onEdit={() => setEditTarget(g)} />
                    ))}
                  </div>
                </section>
              )}

              {grouped.vencidas.length > 0 && (
                <section className="space-y-3.5" aria-labelledby="hoy-vencidas">
                  <SectionHeading
                    id="hoy-vencidas"
                    numeral="I."
                    title="Vencidas"
                    rule={PRIORITY_RULE_BY_GROUP.vencidas}
                    tone="crimson"
                    aside={
                      <span className="inline-flex items-center gap-1 font-body text-xs font-semibold text-crimson-tag">
                        <span className="material-symbols-outlined text-[16px]" aria-hidden="true">warning</span>
                        Requieren atención inmediata
                      </span>
                    }
                  />
                  {grouped.vencidas.length === 1 ? (
                    <TaskCard
                      gestion={grouped.vencidas[0]}
                      variant="vencida"
                      single={true}
                      onMarkDone={() => handleMarkDone(grouped.vencidas[0])}
                      onReschedule={() => setRescheduleTarget(grouped.vencidas[0])}
                      onEdit={() => setEditTarget(grouped.vencidas[0])}
                    />
                  ) : (
                    <div className="grid grid-cols-1 gap-3">
                      {grouped.vencidas.slice(0, 2).map((g) => (
                        <TaskCard
                          key={g.id}
                          gestion={g}
                          variant="vencida"
                          onMarkDone={() => handleMarkDone(g)}
                          onReschedule={() => setRescheduleTarget(g)}
                          onEdit={() => setEditTarget(g)}
                        />
                      ))}
                      {grouped.vencidas.length === 3 && (
                        <TaskCard
                          key={grouped.vencidas[2].id}
                          gestion={grouped.vencidas[2]}
                          variant="vencida"
                          onMarkDone={() => handleMarkDone(grouped.vencidas[2])}
                          onReschedule={() => setRescheduleTarget(grouped.vencidas[2])}
                          onEdit={() => setEditTarget(grouped.vencidas[2])}
                        />
                      )}
                      {grouped.vencidas.length > 3 && (
                        <TaskCardGalleryOverlay
                          gestion={grouped.vencidas[2]}
                          variant="vencida"
                          remainingCount={grouped.vencidas.length - 2}
                          totalCount={grouped.vencidas.length}
                          onClickMore={() => openGallery("vencidas", 2)}
                          onMarkDone={() => handleMarkDone(grouped.vencidas[2])}
                          onReschedule={() => setRescheduleTarget(grouped.vencidas[2])}
                          onEdit={() => setEditTarget(grouped.vencidas[2])}
                        />
                      )}
                    </div>
                  )}
                </section>
              )}

              {grouped.hoy.length > 0 && (
                <section className="space-y-3.5" aria-labelledby="hoy-hoy">
                  <SectionHeading
                    id="hoy-hoy"
                    numeral="II."
                    title="Agenda de Hoy"
                    rule={PRIORITY_RULE_BY_GROUP.hoy}
                    tone="terracotta"
                    aside={
                      <span className="font-stamp text-xs text-terracotta-dark flex items-center gap-1.5 font-bold">
                        <span className="material-symbols-outlined text-[15px] text-terracotta" aria-hidden="true">hourglass_top</span>
                        {stats.todayLoadHours} hrs dedicación programada
                      </span>
                    }
                  />
                  {/* Grid alineada a Resumen de Actividad (3 de 4 cols a la izquierda, 1 de 4 a la derecha con gap-3.5) */}
                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-3.5 items-stretch">
                    {/* Columna izquierda: tarjeta principal + segunda tarjeta debajo */}
                    <div className={grouped.hoy.length > 2 ? "lg:col-span-3 flex flex-col gap-3.5" : "lg:col-span-4 flex flex-col gap-3.5"}>
                      <TaskCard
                        gestion={grouped.hoy[0]}
                        variant="hoy-hero"
                        onMarkDone={() => handleMarkDone(grouped.hoy[0])}
                        onReschedule={() => setRescheduleTarget(grouped.hoy[0])}
                        onEdit={() => setEditTarget(grouped.hoy[0])}
                      />
                      {grouped.hoy.length > 1 && (
                        <TaskCard
                          gestion={grouped.hoy[1]}
                          variant="hoy-secundaria"
                          onMarkDone={() => handleMarkDone(grouped.hoy[1])}
                          onReschedule={() => setRescheduleTarget(grouped.hoy[1])}
                          onEdit={() => setEditTarget(grouped.hoy[1])}
                        />
                      )}
                    </div>

                    {/* Columna derecha: tarjetas restantes */}
                    {grouped.hoy.length > 2 && (
                      <div className="lg:col-span-1 flex flex-col gap-3.5 h-full">
                        <div className="flex-1">
                          <TaskCard
                            gestion={grouped.hoy[2]}
                            variant="hoy-secundaria"
                            onMarkDone={() => handleMarkDone(grouped.hoy[2])}
                            onReschedule={() => setRescheduleTarget(grouped.hoy[2])}
                            onEdit={() => setEditTarget(grouped.hoy[2])}
                          />
                        </div>

                        {grouped.hoy.length === 4 && (
                          <div className="flex-1">
                            <TaskCard
                              key={grouped.hoy[3].id}
                              gestion={grouped.hoy[3]}
                              variant="hoy-secundaria"
                              onMarkDone={() => handleMarkDone(grouped.hoy[3])}
                              onReschedule={() => setRescheduleTarget(grouped.hoy[3])}
                              onEdit={() => setEditTarget(grouped.hoy[3])}
                            />
                          </div>
                        )}

                        {grouped.hoy.length > 4 && (
                          <div className="flex-1 min-h-[140px]">
                            <TaskCardGalleryOverlay
                              gestion={grouped.hoy[3]}
                              variant="hoy-secundaria"
                              remainingCount={grouped.hoy.length - 3}
                              totalCount={grouped.hoy.length}
                              onClickMore={() => openGallery("hoy", 3)}
                              onMarkDone={() => handleMarkDone(grouped.hoy[3])}
                              onReschedule={() => setRescheduleTarget(grouped.hoy[3])}
                              onEdit={() => setEditTarget(grouped.hoy[3])}
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </section>
              )}

              {grouped.proximas.length > 0 && (
                <section className="space-y-3.5" aria-labelledby="hoy-proximas">
                  <SectionHeading id="hoy-proximas" numeral="III." title="Próximas Jornadas" rule={PRIORITY_RULE_BY_GROUP.proximas} />
                  {grouped.proximas.length === 1 ? (
                    <TaskCard
                      gestion={grouped.proximas[0]}
                      variant="proxima"
                      single={true}
                      onMarkDone={() => handleMarkDone(grouped.proximas[0])}
                      onReschedule={() => setRescheduleTarget(grouped.proximas[0])}
                      onEdit={() => setEditTarget(grouped.proximas[0])}
                    />
                  ) : (
                    <div
                      className={`grid grid-cols-1 ${
                        grouped.proximas.length === 2 ? "md:grid-cols-2" : "md:grid-cols-3"
                      } gap-4 items-stretch`}
                    >
                      {grouped.proximas.slice(0, 2).map((g) => (
                        <TaskCard
                          key={g.id}
                          gestion={g}
                          variant="proxima"
                          onMarkDone={() => handleMarkDone(g)}
                          onReschedule={() => setRescheduleTarget(g)}
                          onEdit={() => setEditTarget(g)}
                        />
                      ))}
                      {grouped.proximas.length === 3 && (
                        <TaskCard
                          key={grouped.proximas[2].id}
                          gestion={grouped.proximas[2]}
                          variant="proxima"
                          onMarkDone={() => handleMarkDone(grouped.proximas[2])}
                          onReschedule={() => setRescheduleTarget(grouped.proximas[2])}
                          onEdit={() => setEditTarget(grouped.proximas[2])}
                        />
                      )}
                      {grouped.proximas.length > 3 && (
                        <TaskCardGalleryOverlay
                          gestion={grouped.proximas[2]}
                          variant="proxima"
                          remainingCount={grouped.proximas.length - 2}
                          totalCount={grouped.proximas.length}
                          onClickMore={() => openGallery("proximas", 2)}
                          onMarkDone={() => handleMarkDone(grouped.proximas[2])}
                          onReschedule={() => setRescheduleTarget(grouped.proximas[2])}
                          onEdit={() => setEditTarget(grouped.proximas[2])}
                        />
                      )}
                    </div>
                  )}
                </section>
              )}
            </div>
          )
        )}
      </PageContainer>

      <Toast toast={toast} onClose={closeToast} />

      {editTarget && (
        <EditSubtaskModal
          initialSubtask={editTarget}
          eventName={editTarget.eventName}
          eventDateTime={eventDateOf(editTarget)}
          onCancel={() => setEditTarget(null)}
          onSubmit={handleEditSubmit}
        />
      )}

      {rescheduleTarget && (
        <RescheduleModal
          mode="single"
          gestion={rescheduleTarget}
          currentDateISO={rescheduleTarget.targetDate}
          eventDateTime={eventDateOf(rescheduleTarget)}
          allGestiones={allGestiones || []}
          onCancel={() => setRescheduleTarget(null)}
          onConfirm={handleConfirmReschedule}
        />
      )}

      {galleryModal.isOpen && (
        <GestionesGalleryModal
          key={`${galleryModal.group}-${galleryModal.initialIndex}`}
          isOpen={galleryModal.isOpen}
          title={galleryMeta.title}
          numeral={galleryMeta.numeral}
          tone={galleryMeta.tone}
          gestiones={galleryGestiones}
          initialIndex={galleryModal.initialIndex}
          onClose={closeGallery}
          onMarkDone={handleMarkDone}
          onReschedule={(g) => {
            setRescheduleTarget(g);
          }}
          onEdit={(g) => {
            setEditTarget(g);
          }}
        />
      )}

      {/* Herramienta de QA solo en desarrollo — nunca en `npm run build`. */}
      {import.meta.env.DEV && (
        <SimulationToolbar
          mode={simMode}
          onSimulateLoading={reload}
          onToggleEmpty={() => setSimMode((m) => (m === "empty" ? "normal" : "empty"))}
          onToggleError={() => setSimMode((m) => (m === "error" ? "normal" : "error"))}
        />
      )}
    </>
  );
}

function SectionHeading({ id, numeral, title, rule, tone, aside }) {
  const numeralColor = { crimson: "text-crimson-urgent", terracotta: "text-terracotta", sage: "text-sage-wax" }[tone] ?? "text-sepia-dark";
  const border = tone === "crimson" ? "border-b-2 border-crimson-urgent/30" : "border-b border-sepia-border";
  return (
    <div className={`flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 pb-2 ${border}`}>
      <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
        <span className={`font-heading font-bold text-xl ${numeralColor}`} aria-hidden="true">{numeral}</span>
        <h2 id={id} className="font-heading text-2xl md:text-3xl text-ink-charcoal font-semibold tracking-tight">{title}</h2>
        {rule && <span className="ml-1"><PriorityRuleTooltip rule={rule} /></span>}
      </div>
      {aside}
    </div>
  );
}
