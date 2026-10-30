import { Link, useNavigate, useOutletContext } from "react-router-dom";
import { EVENT_TYPE_LABEL } from "../data/eventTypes";
import { useProgressOverview } from "../hooks/useProgressOverview";
import { formatShortDate, toDateInputValue } from "../utils/dateUtils";
import PageContainer from "../components/layout/PageContainer";
import PageHeader, { Breadcrumb } from "../components/layout/PageHeader";
import StateCard from "../components/common/StateCard";

const TASK_STATES = [
  { key: "PENDIENTE", label: "Pendientes", icon: "schedule" },
  { key: "POSPUESTA", label: "Pospuestas", icon: "event_repeat" },
  { key: "EJECUTADA", label: "Ejecutadas", icon: "task_alt" },
];

function getTaskCounts(event) {
  const tasks = event.subtasks ?? [];
  const counts = Object.fromEntries(TASK_STATES.map(({ key }) => [key, 0]));
  let overdue = 0;
  const today = toDateInputValue(new Date());
  for (const task of tasks) {
    const state = task.status?.toUpperCase() ?? "PENDIENTE";
    if (counts[state] !== undefined) counts[state] += 1;
    if (state !== "EJECUTADA" && task.targetDate && toDateInputValue(task.targetDate) < today) overdue += 1;
  }
  return { counts, overdue };
}

export default function ProgresoPage() {
  const navigate = useNavigate();
  const { search, setSearch } = useOutletContext();
  const { summary, events, status, errorMessage, reload } = useProgressOverview();
  const query = search.trim().toLocaleLowerCase("es");
  const filteredEvents = query
    ? events.filter((event) => [event.name, event.place, event.contact, EVENT_TYPE_LABEL[event.type] ?? event.type]
      .some((value) => value?.toLocaleLowerCase("es").includes(query)))
    : events;

  return (
    <PageContainer>
      <PageHeader
        breadcrumb={<Breadcrumb backTo="/hoy" items={[{ label: "Convoka"}, { label: "Progreso" }]} />}
        eyebrow="Resumen"
        title="Progreso"
        accent="de eventos"
        description="Avance de las gestiones logísticas de cada evento."
      />

      {status === "loading" && <LoadingState />}

      {status === "error" && (
        <StateCard
          tone="error"
          icon="sync_problem"
          stamp="Incidencia de sincronización"
          title="No pudimos cargar el progreso"
          description={errorMessage || "Hubo una incidencia al conectar con el servidor. Vuelve a intentarlo."}
          primaryAction={{ label: "Reintentar", icon: "refresh", onClick: reload }}
          compact
        />
      )}

      {status === "success" && events.length === 0 && (
        <StateCard
          icon="monitoring"
          stamp="Resumen sin eventos"
          title="Aún no tienes eventos registrados"
          description="Crea tu primer evento para comenzar a seguir el avance de sus gestiones."
          primaryAction={{ label: "Crear evento", icon: "add", onClick: () => navigate("/crear") }}
          secondaryAction={{ label: "Volver a Hoy", icon: "today", onClick: () => navigate("/hoy") }}
          compact
        />
      )}

      {status === "success" && events.length > 0 && (
        <div className="space-y-6">
          <div className="bg-paper-card border border-sepia-border rounded-sharp p-5 warm-card-shadow">
            <div className="flex items-center justify-between gap-3 mb-3">
              <h2 className="font-heading text-lg font-semibold text-ink-charcoal">Avance general de gestiones</h2>
              <span className="font-mono-stamp text-sm font-bold text-terracotta-dark">{summary.globalPercent}%</span>
            </div>
            <ProgressBar value={summary.globalPercent} label="Avance global de todos los eventos" />
            <p className="mt-2 font-body text-xs text-ink-muted">{summary.totalDone} de {summary.totalSubtasks} gestiones ejecutadas</p>
          </div>

          <section aria-labelledby="progress-events-title">
            <div className="flex items-end justify-between gap-3 mb-3">
            <h2 id="progress-events-title" className="font-heading text-2xl md:text-3xl font-bold text-ink-charcoal tracking-tight">Progreso por evento</h2>
            <span className="font-mono-stamp text-xs text-ink-muted">{filteredEvents.length} de {events.length} {events.length === 1 ? "evento" : "eventos"}</span>
          </div>
            {filteredEvents.length === 0 ? (
              <StateCard
                icon="search_off"
                stamp="0 resultados encontrados"
                title="No se encontraron eventos"
                description="Ningún evento coincide con tu búsqueda. Prueba con otro nombre, lugar, contacto o tipo."
                primaryAction={{ label: "Limpiar búsqueda", icon: "filter_list_off", onClick: () => setSearch("") }}
                compact
              />
            ) : (
              <ul className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {filteredEvents.map((event) => <EventProgressCard key={event.id} event={event} />)}
              </ul>
            )}
          </section>
        </div>
      )}
    </PageContainer>
  );
}

function LoadingState() {
  return (
    <div className="space-y-5" role="status" aria-label="Cargando progreso">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[0, 1, 2].map((key) => <div key={key} className="h-24 animate-warm-pulse bg-paper-card border border-sepia-border rounded-sharp" />)}
      </div>
      <ul className="grid grid-cols-1 xl:grid-cols-2 gap-4" aria-hidden="true">
        {[0, 1].map((key) => <li key={key} className="h-56 animate-warm-pulse bg-paper-card border border-sepia-border rounded-sharp" />)}
      </ul>
      <span className="sr-only">Cargando el resumen de progreso desde el servidor.</span>
    </div>
  );
}

function EventProgressCard({ event }) {
  const { done, total, percent } = event.progress;
  const { counts, overdue } = getTaskCounts(event);
  const typeLabel = EVENT_TYPE_LABEL[event.type] ?? event.type ?? "Evento";
  const dateLabel = event.dateTime ? formatShortDate(event.dateTime) : "Fecha por definir";

  return (
    <li className="bg-paper-card border border-sepia-border rounded-sharp p-5 warm-card-shadow flex flex-col">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mb-1">
            <span className="font-mono-stamp text-[10px] uppercase tracking-wider font-bold text-terracotta-dark">{typeLabel}</span>
            <span className="text-ink-muted" aria-hidden="true">·</span>
            <span className="font-mono-stamp text-xs text-ink-muted">{dateLabel}</span>
          </div>
          <h3 className="font-heading text-xl font-bold text-ink-charcoal leading-tight">{event.name}</h3>
          {(event.place || event.contact) && <p className="mt-1 font-body text-sm text-ink-muted">{[event.place, event.contact].filter(Boolean).join(" · ")}</p>}
        </div>
        <span className={`shrink-0 px-2.5 py-1 rounded-full border font-mono-stamp text-[10px] font-bold uppercase tracking-wide ${overdue ? "bg-red-50 border-red-200 text-red-800" : "bg-paper-linen border-sepia-border text-ink-muted"}`}>
          {overdue ? `${overdue} vencida${overdue === 1 ? "" : "s"}` : done === total && total > 0 ? "Completado" : "Al día"}
        </span>
      </div>

      <div className="mt-5">
        <div className="flex justify-between items-center gap-2 mb-2">
          <span className="font-body text-sm text-ink-muted">Avance de gestiones</span>
          <span className="font-mono-stamp text-xs text-ink-muted">{done} de {total} · <strong className="text-terracotta-dark">{percent}%</strong></span>
        </div>
        <ProgressBar value={percent} label={`Progreso de ${event.name}`} />
      </div>

      <ul className="mt-4 flex flex-wrap gap-2" aria-label={`Estado de gestiones de ${event.name}`}>
        {TASK_STATES.map(({ key, label, icon }) => <TaskChip key={key} label={label} count={counts[key]} icon={icon} />)}
        <TaskChip label="Vencidas" count={overdue} icon="warning" overdue={overdue > 0} />
      </ul>

      <div className="mt-auto pt-5">
        <Link to={`/evento/${event.id}`} className="inline-flex items-center gap-2 font-body text-sm font-semibold text-terracotta-dark hover:text-terracotta focus:outline-none focus-visible:ring-2 focus-visible:ring-terracotta rounded-sharp">
          Gestionar evento <span className="material-symbols-outlined text-base" aria-hidden="true">arrow_forward</span>
        </Link>
      </div>
    </li>
  );
}

function TaskChip({ label, count, icon, overdue = false }) {
  return (
    <li className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 border rounded-sharp font-body text-xs ${overdue ? "bg-red-50 border-red-200 text-red-800" : "bg-paper-linen border-sepia-border text-ink-muted"}`}>
      <span className="material-symbols-outlined text-sm" aria-hidden="true">{icon}</span>
      <span>{count} {label}</span>
    </li>
  );
}

function ProgressBar({ value, label }) {
  const safeValue = Math.min(100, Math.max(0, Number(value) || 0));
  return (
    <div className="h-2 overflow-hidden rounded-full bg-paper-linen" role="progressbar" aria-valuenow={safeValue} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
      <div className="h-full bg-terracotta rounded-full transition-[width] duration-500" style={{ width: `${safeValue}%` }} />
    </div>
  );
}
