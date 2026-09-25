import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTodayGestiones } from "../hooks/useTodayGestiones";
import { EVENT_TYPE_LABELS } from "../data/mockGestiones";
import { formatFullDate } from "../utils/dateUtils";

import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import PriorityRuleBanner from "../components/common/PriorityRuleBanner";
import StatCard from "../components/common/StatCard";
import EmptyState from "../components/common/EmptyState";
import ErrorState from "../components/common/ErrorState";
import LoadingSkeleton from "../components/common/LoadingSkeleton";
import Toast from "../components/common/Toast";
import RescheduleModal from "../components/common/RescheduleModal";
import TaskCard from "../components/tasks/TaskCard";
import SimulationToolbar from "../components/dev/SimulationToolbar";

/**
 * HoyPage.jsx — route "/hoy" (T2 — Arquitectura de Información C5, §3).
 *
 * Sprint 0: prototipo "Hoy" v1.
 * Sprint 1: migración al diseño final del UX Lead.
 *   - Se eliminó el toggle Agrupada/Compacto (decisión UX).
 *   - Section I: "Urgencias & Vencidas" → "Vencidas".
 *   - Saludo: "Organización en marcha, usuario" (placeholder hasta Sprint 2).
 *
 * NOTE on Header placement: unlike the other pages, HoyPage renders its own
 * <Header> (with the search box wired up) instead of relying on
 * MainLayout's — see App.jsx for why /hoy is NOT nested under MainLayout.
 */
export default function HoyPage() {
  const [simMode, setSimMode] = useState("normal"); // 'normal' | 'empty' | 'error'
  const [rescheduleTarget, setRescheduleTarget] = useState(null);

  const location = useLocation();
  const navigate = useNavigate();
  const [toast, setToast] = useState(() => location.state?.toast ? { message: location.state.toast } : null);

  useEffect(() => {
    if (location.state?.toast) {
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  const {
    status,
    errorMessage,
    grouped,
    stats,
    query,
    setQuery,
    eventTypeFilter,
    setEventTypeFilter,
    actions,
    reload,
  } = useTodayGestiones({
    simulateError: simMode === "error",
    simulateEmpty: simMode === "empty",
  });

  const availableEventTypes = useMemo(() => {
    const allActive = [...grouped.vencidas, ...grouped.hoy, ...grouped.proximas];
    return [...new Set(allActive.map((g) => g.eventType))];
  }, [grouped]);

  const totalCount = grouped.vencidas.length + grouped.hoy.length + grouped.proximas.length;
  const isEmpty = status === "success" && totalCount === 0;

  function handleMarkDone(gestion) {
    actions.markAsDone(gestion.id);
    setToast({ message: "Gestión marcada como hecha", onUndo: () => actions.undo(gestion.id) });
  }

  function handleConfirmSingleReschedule(newDateISO) {
    if (!rescheduleTarget) return;
    actions.reschedule(rescheduleTarget.id, newDateISO);
    setRescheduleTarget(null);
    setToast({ message: "Gestión reprogramada" });
  }


  return (
    <div className="min-h-screen flex flex-col bg-paper-base dot-grid-pattern font-body text-ink-charcoal antialiased">
      <Header searchValue={query} onSearchChange={setQuery} />

      <main className="w-full pt-16 flex-1">
        <div className="max-w-[1440px] mx-auto px-4 md:px-8 lg:px-12 py-8">
          {/* ---------- Page header: greeting, title, filters, stats ---------- */}
          <section className="mb-7 relative">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-5 border-b border-sepia-border">
              <div className="space-y-1.5 max-w-3xl">
                <p className="font-body text-xs md:text-sm font-medium text-ink-muted">{formatFullDate()}</p>
                <p className="font-serif italic text-terracotta text-lg md:text-xl font-normal">
                  Organización en marcha, usuario
                </p>
                <h1 className="font-serif text-4xl sm:text-5xl lg:text-[50px] font-semibold tracking-tight text-ink-charcoal leading-[1.08]">
                  Gestiones <span className="italic font-normal text-terracotta">para hoy</span>
                </h1>
              </div>

              <div className="flex flex-col sm:items-end gap-2.5 self-start sm:self-end shrink-0">
                <div className="flex items-center gap-1.5 flex-wrap justify-end">
                  <FilterChip
                    active={eventTypeFilter === "todos"}
                    label={`Todos (${totalCount})`}
                    onClick={() => setEventTypeFilter("todos")}
                  />
                  {availableEventTypes.map((type) => (
                    <FilterChip
                      key={type}
                      active={eventTypeFilter === type}
                      label={EVENT_TYPE_LABELS[type] ?? type}
                      onClick={() => setEventTypeFilter(type)}
                    />
                  ))}
                </div>
              </div>
            </div>

            <PriorityRuleBanner />

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 mt-4">
              <StatCard
                label="Vencidas"
                tag="Urgente"
                value={stats.overdueCount}
                unit="gestiones atrasadas"
                accent="crimson"
                barWidthPercent={Math.min(100, stats.overdueCount * 20)}
              />
              <StatCard
                label="Para Hoy"
                tag="En curso"
                value={stats.todayCount}
                unit="prioritarias del día"
                accent="terracotta"
                barWidthPercent={Math.min(100, stats.todayCount * 15)}
              />
              <StatCard
                label="Próximas"
                tag="7 días"
                value={stats.upcomingCount}
                unit="en agenda"
                accent="neutral"
                barWidthPercent={Math.min(100, stats.upcomingCount * 12)}
              />
              <StatCard
                label="Carga Estimada"
                tag="Horas"
                value={stats.estimatedLoadHours}
                unit="hrs estimadas"
                accent="sage"
                barWidthPercent={Math.min(100, stats.estimatedLoadHours * 4)}
              />
            </div>
          </section>

          {/* ---------- Body: loading / error / empty / active lists ---------- */}
          {status === "loading" && <LoadingSkeleton />}

          {status === "error" && (
            <ErrorState
              message={errorMessage}
              onRetry={reload}
              secondaryLabel="Volver al listado"
              onSecondaryCta={reload}
            />
          )}

          {status === "success" && isEmpty && (
            <EmptyState
              secondaryLabel="Volver al listado"
              onSecondaryCta={reload}
            />
          )}

          {status === "success" && !isEmpty && (
            <div className="space-y-9">
              {grouped.vencidas.length > 0 && (
                <section className="space-y-3.5">
                  <div className="flex items-baseline gap-2.5 pb-2 border-b-2 border-crimson-urgent/30">
                      <span className="font-serif font-bold text-crimson-urgent text-xl">I.</span>
                      <h2 className="font-serif text-2xl md:text-3xl text-ink-charcoal font-semibold tracking-tight">
                        Vencidas
                      </h2>
                      <span className="font-body text-xs text-ink-muted ml-1">Ordenadas por antigüedad</span>
                    </div>
                  <div className="grid grid-cols-1 gap-3">
                    {grouped.vencidas.map((g) => (
                      <TaskCard
                        key={g.id}
                        gestion={g}
                        variant="vencida"
                        onMarkDone={() => handleMarkDone(g)}
                        onReschedule={() => setRescheduleTarget(g)}
                      />
                    ))}
                  </div>
                </section>
              )}

              {grouped.hoy.length > 0 && (
                <section className="space-y-3.5">
                  <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 pb-2 border-b border-sepia-border">
                    <div className="flex items-baseline gap-2.5">
                      <span className="font-serif font-bold text-terracotta text-xl">II.</span>
                      <h2 className="font-serif text-2xl md:text-3xl text-ink-charcoal font-semibold tracking-tight">
                        Agenda de Hoy
                      </h2>
                      <span className="font-body text-xs text-ink-muted ml-1">
                        {grouped.hoy.length} gestiones para la jornada
                      </span>
                    </div>
                    <div className="font-mono-stamp text-xs text-terracotta-dark flex items-center gap-1.5 font-bold">
                      <span className="material-symbols-outlined text-[15px] text-terracotta">hourglass_top</span>
                      <span>{stats.todayLoadHours} hrs dedicación programada</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
                    <div className="lg:col-span-7">
                      <TaskCard
                        gestion={grouped.hoy[0]}
                        variant="hoy-hero"
                        onMarkDone={() => handleMarkDone(grouped.hoy[0])}
                        onReschedule={() => setRescheduleTarget(grouped.hoy[0])}
                      />
                    </div>
                    {grouped.hoy.length > 1 && (
                      <div className="lg:col-span-5 flex flex-col justify-between gap-3.5">
                        {grouped.hoy.slice(1).map((g) => (
                          <TaskCard
                            key={g.id}
                            gestion={g}
                            variant="hoy-secundaria"
                            onMarkDone={() => handleMarkDone(g)}
                            onReschedule={() => setRescheduleTarget(g)}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </section>
              )}

              {grouped.proximas.length > 0 && (
                <section className="space-y-3.5">
                  <div className="flex items-baseline gap-2.5 pb-2 border-b border-sepia-border">
                    <span className="font-serif font-bold text-sepia-dark text-xl">III.</span>
                    <h2 className="font-serif text-2xl md:text-3xl text-ink-charcoal font-semibold tracking-tight">
                      Próximas Jornadas
                    </h2>
                    <span className="font-body text-xs text-ink-muted ml-1">Horizonte a 7 días</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {grouped.proximas.map((g) => (
                      <TaskCard
                        key={g.id}
                        gestion={g}
                        variant="proxima"
                        onMarkDone={() => handleMarkDone(g)}
                        onReschedule={() => setRescheduleTarget(g)}
                      />
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}
        </div>
      </main>

      <Footer />

      {/* ---------- Overlays ---------- */}
      <Toast toast={toast} onClose={() => setToast(null)} />

      {rescheduleTarget && (
        <RescheduleModal
          mode="single"
          currentDateISO={rescheduleTarget.targetDate}
          onCancel={() => setRescheduleTarget(null)}
          onConfirm={handleConfirmSingleReschedule}
        />
      )}

      {/* Dev-only QA tool — never rendered in a production build. */}
      {import.meta.env.DEV && (
        <SimulationToolbar
          mode={simMode}
          onSimulateLoading={reload}
          onToggleEmpty={() => setSimMode((m) => (m === "empty" ? "normal" : "empty"))}
          onToggleError={() => setSimMode((m) => (m === "error" ? "normal" : "error"))}
        />
      )}
    </div>
  );
}

function FilterChip({ active, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "px-2.5 py-1 border font-body text-xs rounded-sharp whitespace-nowrap transition-colors",
        active
          ? "border-terracotta bg-terracotta text-[#FAF6F0] shadow-sm"
          : "border-sepia-border bg-paper-linen text-ink-charcoal hover:border-ink-muted",
      ].join(" ")}
    >
      {label}
    </button>
  );
}
