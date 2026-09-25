import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useEvents } from "../hooks/useEvents";
import {
  deleteEvent as apiDeleteEvent,
  updateEvent as apiUpdateEvent,
} from "../services/api";
import { diffInCalendarDays } from "../utils/dateUtils";

import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import Toast from "../components/common/Toast";
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
  { key: "otro", label: "Otros" },
];

/**
 * EventosPage.jsx — route "/eventos".
 * Vista listado (Stitch, Sprint 1). Standalone, con su propio Header
 * (search cableado) y Footer — mismo patrón que HoyPage.
 *
 * NOTA (stats):
 * El diseño muestra "Completados: 12", un total histórico que NO se puede
 * derivar del listado visible. Aquí se calcula sobre lo que devuelve
 * getEvents(). Cuando el backend exponga un endpoint de stats, mover
 * `useMemo(stats)` a una llamada aparte.
 */
export default function EventosPage() {
  const navigate = useNavigate();
  const { events, status, errorMessage, reload } = useEvents();

  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [toast, setToast] = useState(null);
  const [updatedEventName, setUpdatedEventName] = useState(null);

  const [editingEvent, setEditingEvent] = useState(null);
  const [deletingEvent, setDeletingEvent] = useState(null);

  // --- Derivados ---
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return events.filter((e) => {
      const matchesCategory = filter === "all" || e.type === filter;
      const matchesQuery =
        !q ||
        (e.name ?? "").toLowerCase().includes(q) ||
        (e.contact ?? "").toLowerCase().includes(q);
      return matchesCategory && matchesQuery;
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
    <div className="min-h-screen flex flex-col bg-paper-base dot-grid-pattern font-body text-ink-charcoal antialiased">
      <Header searchValue={query} onSearchChange={setQuery} />

      <main className="w-full pt-16 flex-1">
        <div className="max-w-[1440px] mx-auto px-4 md:px-8 lg:px-12 py-8">
          {/* ---------- Cabecera ---------- */}
          <section className="mb-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-5 border-b border-sepia-border">
              <div className="space-y-1">
                <nav
                  aria-label="Breadcrumb"
                  className="flex items-center gap-1.5 text-xs text-ink-muted font-body mb-1"
                >
                  <span>Convoka</span>
                  <span className="text-sepia-dark">/</span>
                  <span className="text-ink-charcoal font-semibold">Eventos</span>
                </nav>
                <h1 className="font-serif text-4xl sm:text-5xl font-semibold tracking-tight text-ink-charcoal leading-[1.1]">
                  Todos los{" "}
                  <span className="italic font-normal text-terracotta">eventos</span>
                </h1>
                <p className="font-body text-xs md:text-sm text-ink-muted pt-0.5">
                  Expedientes de producción, fechas de celebración y estado
                  operativo de tus clientes.
                </p>
              </div>

              <MetricsBar stats={stats} />
            </div>

            {status !== "error" && (
              <ControlsBar
                filter={filter}
                onFilterChange={setFilter}
                query={query}
                onQueryChange={setQuery}
                counts={categoryCounts}
                onCreate={() => navigate("/crear")}
              />
            )}
          </section>

          {/* ---------- Cuerpo ---------- */}
          {status === "loading" && <LoadingState />}

          {status === "error" && (
            <ErrorState message={errorMessage} onRetry={reload} />
          )}

          {status === "success" && events.length === 0 && (
            <EmptyState onCreate={() => navigate("/crear")} />
          )}

          {status === "success" &&
            events.length > 0 &&
            filtered.length === 0 && (
              <NoResultsState onClear={handleClearSearch} />
            )}

          {status === "success" && filtered.length > 0 && (
            <EventsTable
              events={filtered}
              onEdit={setEditingEvent}
              onDelete={setDeletingEvent}
            />
          )}
        </div>
      </main>

      <Footer />

      {updatedEventName && (
  <UpdateEventSuccessModal
    eventName={updatedEventName}
    onStay={() => setUpdatedEventName(null)}
    onGoToEvents={() => setUpdatedEventName(null)}
  />
)}

      {/* ---------- Overlays ---------- */}
      <Toast toast={toast} onClose={() => setToast(null)} />

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
    </div>
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
        className={`font-serif text-2xl font-bold leading-none ${valueClasses}`}
      >
        {value}
      </span>
    </div>
  );
}

function ControlsBar({ filter, onFilterChange, query, onQueryChange, counts, onCreate }) {
  return (
    <div className="mt-5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
        {CATEGORY_CHIPS.map((chip) => {
          const isActive = filter === chip.key;
          const count = counts[chip.key] ?? 0;
          return (
            <button
              key={chip.key}
              type="button"
              onClick={() => onFilterChange(chip.key)}
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
            type="text"
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
// Estados: loading / error / empty / sin resultados
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

function ErrorState({ message, onRetry }) {
  return (
    <div className="bg-paper-card border border-sepia-border rounded-sharp warm-card-shadow p-8 md:p-12 text-center max-w-2xl mx-auto my-6">
      <div className="w-16 h-16 mx-auto mb-4 rounded-sharp bg-crimson-paper border border-crimson-urgent/30 text-crimson-urgent flex items-center justify-center">
        <span className="material-symbols-outlined text-[32px]">sync_problem</span>
      </div>
      <span className="font-mono-stamp text-[10px] uppercase text-crimson-urgent font-bold tracking-wider mb-2 block">
        Incidencia de sincronización
      </span>
      <h2 className="font-serif text-2xl md:text-3xl font-bold text-ink-charcoal mb-2">
        {message || "No pudimos cargar tus eventos"}
      </h2>
      <p className="font-body text-xs md:text-sm text-ink-muted max-w-md mx-auto mb-6 leading-relaxed">
        Hubo una incidencia al conectar con el servidor de eventos. Tus datos
        guardados están a salvo. Por favor, comprueba tu conexión o vuelve a
        intentarlo.
      </p>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 bg-terracotta text-[#FAF6F0] font-body font-semibold text-xs md:text-sm tracking-wide rounded-sharp border border-terracotta-dark shadow-sm hover:bg-terracotta-dark transition-colors active:translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-terracotta focus:ring-offset-2 focus:ring-offset-paper-base"
        >
          <span className="material-symbols-outlined text-[16px]">refresh</span>
          <span>Reintentar carga</span>
        </button>
        <button
          type="button"
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-paper-base text-ink-charcoal border border-sepia-border font-body font-medium text-xs md:text-sm rounded-sharp hover:bg-paper-linen hover:border-sepia-dark transition-colors"
        >
          <span className="material-symbols-outlined text-[16px] text-ink-muted">
            dns
          </span>
          <span>Comprobar estado del servicio</span>
        </button>
      </div>
    </div>
  );
}

function EmptyState({ onCreate }) {
  return (
    <div className="bg-paper-card border border-sepia-border rounded-sharp warm-card-shadow p-8 md:p-12 text-center max-w-2xl mx-auto my-6">
      <div className="w-16 h-16 mx-auto mb-4 rounded-sharp bg-paper-linen border border-sepia-border text-terracotta flex items-center justify-center">
        <span className="material-symbols-outlined text-[32px]">
          calendar_month
        </span>
      </div>
      <span className="font-mono-stamp text-[10px] uppercase text-ink-muted font-bold tracking-wider mb-2 block">
        Bitácora sin registros
      </span>
      <h2 className="font-serif text-2xl md:text-3xl font-bold text-ink-charcoal mb-2">
        Tu bitácora de eventos está vacía
      </h2>
      <p className="font-body text-xs md:text-sm text-ink-muted max-w-md mx-auto mb-6 leading-relaxed">
        Registra tu primera boda, gala corporativa o celebración para comenzar
        a planificar su hoja de ruta y gestiones operativas.
      </p>
      <button
        type="button"
        onClick={onCreate}
        className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-terracotta text-[#FAF6F0] font-body font-medium text-xs md:text-sm tracking-wide rounded-sharp border border-terracotta-dark shadow-sm hover:bg-terracotta-dark transition-colors active:translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-terracotta focus:ring-offset-2 focus:ring-offset-paper-card"
      >
        <span className="material-symbols-outlined text-[16px]">add</span>
        <span>Crear primer evento</span>
      </button>
    </div>
  );
}

function NoResultsState({ onClear }) {
  return (
    <div className="bg-paper-card border border-sepia-border rounded-sharp p-8 md:p-12 text-center max-w-md mx-auto warm-card-shadow mt-6">
      <div className="w-12 h-12 mx-auto mb-3 rounded-sharp bg-paper-linen border border-sepia-border text-ink-muted flex items-center justify-center">
        <span className="material-symbols-outlined text-[24px]">search_off</span>
      </div>
      <h3 className="font-serif text-xl font-bold text-ink-charcoal mb-1">
        No se encontraron eventos
      </h3>
      <p className="font-body text-xs text-ink-muted mb-4">
        No hay ningún evento registrado que coincida con el criterio de
        búsqueda seleccionado.
      </p>
      <button
        type="button"
        onClick={onClear}
        className="px-3.5 py-1.5 bg-paper-base hover:bg-paper-linen border border-sepia-border text-ink-charcoal font-body text-xs font-semibold rounded-sharp transition-colors inline-flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-terracotta focus:ring-offset-1"
      >
        <span className="material-symbols-outlined text-[15px]">refresh</span>
        <span>Restablecer filtros</span>
      </button>
    </div>
  );
}