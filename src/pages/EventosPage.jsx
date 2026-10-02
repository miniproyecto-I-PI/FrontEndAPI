import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useOutletContext } from "react-router-dom";

import { useEvents } from "../hooks/useEvents";
import {
  deleteEvent as apiDeleteEvent,
  updateEvent as apiUpdateEvent,
} from "../services/api";
import { diffInCalendarDays } from "../utils/dateUtils";

import PageContainer from "../components/layout/PageContainer";
import PageHeader, { Breadcrumb } from "../components/layout/PageHeader";
import Toast from "../components/common/Toast";
import StateCard from "../components/common/StateCard";
import UpdateEventSuccessModal from "../components/common/UpdateEventSuccessModal";
import EditEventModal from "../components/common/EditEventModal";
import DeleteEventModal from "../components/eventos/DeleteEventModal";
import EventsTable from "../components/eventos/EventsTable";

/** Chips de categoría (label en plural, como en el diseño). */
const CATEGORY_CHIPS = [
  { key: "all", label: "Todos" },
  { key: "boda", label: "Bodas" },
  { key: "corporativo", label: "Corporativos" },
  { key: "cumpleanos", label: "Cumpleaños" },
  { key: "social", label: "Sociales" },
  { key: "otro", label: "Otros" },
];

/**
 * EventosPage.jsx — route "/eventos".
 * Vista listado (Stitch). Header, Footer y buscador vienen de MainLayout;
 * el filtro de la barra de controles comparte el mismo texto de búsqueda.
 *
 * NOTA (stats):
 * El diseño muestra "Completados: 12", un total histórico que NO se puede
 * derivar del listado visible. Aquí se calcula sobre lo que devuelve
 * getEvents(). Cuando el backend exponga un endpoint de stats, mover
 * `useMemo(stats)` a una llamada aparte.
 */
export default function EventosPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { events, status, reload } = useEvents();

  const [filter, setFilter] = useState("all");
  const { search: query, setSearch: setQuery } = useOutletContext();
  const [toast, setToast] = useState(() => (location.state?.toast ? { message: location.state.toast } : null));
  const closeToast = useCallback(() => setToast(null), []);

  // Aviso que llega desde /crear ("Evento creado"); se limpia del historial.
  useEffect(() => {
    if (location.state?.toast) navigate(location.pathname, { replace: true, state: {} });
  }, [location, navigate]);
  const [updatedEventName, setUpdatedEventName] = useState(null);

  const [editingEvent, setEditingEvent] = useState(null);
  const [deletingEvent, setDeletingEvent] = useState(null);

  // --- Derivados ---
  // --- Derivados ---
const filtered = useMemo(() => {
  const q = query.trim().toLowerCase();

  return events
    .filter((e) => {
      const matchesCategory = filter === "all" || e.type === filter;
      const matchesQuery =
        !q ||
        (e.name ?? "").toLowerCase().includes(q) ||
        (e.contact ?? "").toLowerCase().includes(q);
      return matchesCategory && matchesQuery;
    })
    .sort((a, b) => {
      // Fecha ascendente: más antigua primero, más lejana al final.
      // Los eventos sin fecha (o fecha inválida) van al final.
      const aTime = a.dateTime ? new Date(a.dateTime).getTime() : Infinity;
      const bTime = b.dateTime ? new Date(b.dateTime).getTime() : Infinity;
      return aTime - bTime;
    });
}, [events, filter, query]);

  const stats = useMemo(() => {
  const today = new Date();
  let active = 0;
  let upcoming30d = 0;
  let completed = 0;
  for (const e of events) {
    if (e.dateTime) {
      const diff = diffInCalendarDays(today, new Date(e.dateTime));
      if (diff >= 0 && diff <= 30) upcoming30d++;
      if (diff >= 0) active++;
    }
    // "Completado" = todas sus gestiones hechas (y al menos una).
    if (e.progress && e.progress.total > 0 && e.progress.done === e.progress.total) {
      completed++;
    }
  }
  return { active, upcoming30d, completed };
  }, [events]);

  const categoryCounts = useMemo(() => {
    const counts = { all: events.length };
    for (const e of events) {
      counts[e.type] = (counts[e.type] ?? 0) + 1;
    }
    return counts;
  }, [events]);

  // --- Handlers ---
  async function handleEditSubmit(payload) {
  await apiUpdateEvent(editingEvent.id, payload);
  setEditingEvent(null);
  setUpdatedEventName(payload.name);
  reload();
}

  async function handleDeleteConfirm() {
    await apiDeleteEvent(deletingEvent.id);
    setDeletingEvent(null);
    setToast({ message: "Evento eliminado" });
    reload();
  }

  function handleClearSearch() {
    setQuery("");
    setFilter("all");
  }

  return (
    <>
      <PageContainer>
          {/* ---------- Cabecera ---------- */}
          <section className="mb-6">
            <PageHeader
              breadcrumb={<Breadcrumb backTo="/hoy" items={[{ label: "Convoka", to: "/hoy" }, { label: "Eventos" }]} />}
              title="Todos los"
              accent="eventos"
              description="Expedientes de producción, fechas de celebración y estado operativo de tus clientes."
              aside={<MetricsBar stats={stats} />}
            />

            <ControlsBar
              filter={filter}
              onFilterChange={setFilter}
              query={query}
              onQueryChange={setQuery}
              counts={categoryCounts}
              onCreate={() => navigate("/crear")}
            />
          </section>

          {/* ---------- Cuerpo ---------- */}
          {status === "loading" && <LoadingState />}

          {status === "error" && (
            <StateCard
              tone="error"
              icon="sync_problem"
              stamp="Incidencia de sincronización"
              title="No pudimos cargar tus eventos"
              description="Hubo una incidencia al conectar con el servidor de eventos. Tus datos guardados están a salvo. Comprueba tu conexión o vuelve a intentarlo."
              primaryAction={{ label: "Reintentar carga", icon: "refresh", onClick: reload }}
              compact
            />
          )}

          {status === "success" && events.length === 0 && (
            <StateCard
              icon="calendar_month"
              stamp="Bitácora sin registros"
              title="Tu bitácora de eventos está vacía"
              description="Registra tu primera boda, gala corporativa o celebración para comenzar a planificar su hoja de ruta y gestiones operativas."
              primaryAction={{ label: "Crear primer evento", icon: "add", onClick: () => navigate("/crear") }}
              compact
            />
          )}

          {status === "success" &&
            events.length > 0 &&
            filtered.length === 0 && (
              <StateCard
                icon="search_off"
                stamp="0 resultados encontrados"
                title="No se encontraron eventos"
                description="Ningún evento coincide con la categoría o la búsqueda seleccionadas."
                primaryAction={{ label: "Limpiar filtros", icon: "filter_list_off", onClick: handleClearSearch }}
                compact
              />
            )}

          {status === "success" && filtered.length > 0 && (
            <EventsTable
              events={filtered}
              onEdit={setEditingEvent}
              onDelete={setDeletingEvent}
            />
          )}
      </PageContainer>

      {updatedEventName && (
  <UpdateEventSuccessModal
    eventName={updatedEventName}
    onStay={() => setUpdatedEventName(null)}
    onGoToEvents={() => setUpdatedEventName(null)}
  />
)}

      {/* ---------- Overlays ---------- */}
      <Toast toast={toast} onClose={closeToast} />

      {editingEvent && (
        <EditEventModal
          initialEvent={editingEvent}
          onCancel={() => setEditingEvent(null)}
          onSubmit={handleEditSubmit}
        />
      )}

      {deletingEvent && (
  <DeleteEventModal
    event={deletingEvent}
    onCancel={() => setDeletingEvent(null)}
    onConfirm={handleDeleteConfirm}
  />
)}
    </>
  );
}

// ---------------------------------------------------------------------------
// Subcomponentes de layout
// ---------------------------------------------------------------------------

function MetricsBar({ stats }) {
  return (
    <div className="bg-paper-card border border-sepia-border px-4 py-2.5 rounded-sharp warm-card-shadow flex items-center gap-4 shrink-0">
      <Metric label="En curso" value={stats.active} tone="ink" />
      <div className="h-7 w-px bg-sepia-border" />
      <Metric label="Próx. 30 días" value={stats.upcoming30d} tone="terracotta" />
      <div className="h-7 w-px bg-sepia-border" />
      <Metric label="Completados" value={stats.completed} tone="ink" />
    </div>
  );
}

function Metric({ label, value, tone }) {
  const valueClasses =
    tone === "terracotta" ? "text-terracotta" : "text-ink-charcoal";
  return (
    <div>
      <span className="font-mono-stamp text-[10px] uppercase text-ink-muted font-bold block tracking-wider">
        {label}
      </span>
      <span
        className={`font-heading text-2xl font-bold leading-none ${valueClasses}`}
      >
        {value}
      </span>
    </div>
  );
}

function ControlsBar({ filter, onFilterChange, query, onQueryChange, counts, onCreate }) {
  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
        {CATEGORY_CHIPS.map((chip) => {
          const isActive = filter === chip.key;
          const count = counts[chip.key] ?? 0;
          return (
            <button
              key={chip.key}
              type="button"
              onClick={() => onFilterChange(chip.key)}
              aria-pressed={isActive}
              className={[
                "px-3.5 py-1.5 border font-body text-xs rounded-sharp whitespace-nowrap transition-colors",
                isActive
                  ? "border-terracotta bg-terracotta text-[#FAF6F0] font-semibold shadow-sm"
                  : "border-sepia-border bg-paper-card text-ink-charcoal hover:bg-paper-linen font-medium",
              ].join(" ")}
            >
              {chip.label} ({count})
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-2.5 self-end sm:self-auto">
        <div className="relative w-64 sm:w-72">
          <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-[16px] text-ink-muted">
            search
          </span>
          <input
            type="search"
            aria-label="Filtrar eventos por nombre o cliente"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Filtrar eventos..."
            className="w-full h-8 pl-8 pr-2.5 bg-paper-card border border-sepia-border rounded-sharp font-body text-xs text-ink-charcoal placeholder:text-ink-subtle placeholder:italic focus:outline-none focus:border-terracotta"
          />
        </div>

        {counts.all > 0 && (
          <button
            type="button"
            onClick={onCreate}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-paper-card hover:bg-paper-linen text-terracotta border border-terracotta font-body font-semibold text-xs rounded-sharp shadow-sm transition-colors whitespace-nowrap active:translate-y-0.5"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            <span>Nuevo evento</span>
          </button>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Estado de carga (vacío, sin resultados y error usan StateCard)
// ---------------------------------------------------------------------------

function LoadingState() {
  return (
    <div className="space-y-3">
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className="h-14 bg-paper-linen border border-sepia-border rounded-sharp animate-warm-pulse"
        />
      ))}
    </div>
  );
}
