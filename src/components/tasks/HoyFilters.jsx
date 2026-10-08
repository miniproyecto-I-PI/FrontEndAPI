import { useId } from "react";
import { STATUS_FILTERS } from "../../hooks/useTodayGestiones";

/**
 * HoyFilters.jsx — filtros de "/hoy" (US-05): selector de evento + chips de
 * estado de gestión, con indicador "Filtro activo" y "Limpiar", y el switch
 * "Mostrar gestiones ejecutadas" (sección "0. Ejecutadas", apagado por
 * defecto). Controles nativos con label, operables por teclado.
 */
export default function HoyFilters({
  eventOptions,
  eventFilter,
  onEventChange,
  statusFilter,
  onStatusChange,
  onClear,
  showExecuted,
  onShowExecutedChange,
  viewMode = "agenda",
  onViewModeChange,
  disabled = false,
}) {
  const selectId = useId();
  const statusLabelId = useId();
  const activeEvent = eventOptions.find((o) => o.value === eventFilter);
  const activeStatus = STATUS_FILTERS.find((o) => o.value === statusFilter && o.value);
  const hasActive = Boolean(eventFilter || statusFilter);

  return (
    <div className="flex flex-col items-stretch sm:items-end gap-2.5">
      <div className="flex flex-wrap items-center justify-end gap-x-4 gap-y-2">
        <div className="flex items-center gap-2">
          <label htmlFor={selectId} className="font-stamp text-[10px] uppercase tracking-wider text-ink-muted font-bold">
            Evento
          </label>
          <div className="relative">
            <select
              id={selectId}
              value={eventFilter}
              onChange={(e) => onEventChange(e.target.value)}
              disabled={disabled}
              className={[
                "appearance-none h-8 pl-3 pr-8 max-w-[220px] truncate rounded-sharp border font-body text-xs cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-terracotta disabled:opacity-60",
                eventFilter
                  ? "border-terracotta bg-terracotta text-[#FAF6F0] font-semibold"
                  : "border-sepia-border bg-paper-linen text-ink-charcoal hover:border-ink-muted",
              ].join(" ")}
            >
              {/* Las opciones heredan el fondo del select; se fijan en blanco
                  para que la lista no se vuelva café al haber un evento activo. */}
              <option value="" className="bg-white text-ink-charcoal font-normal">Todos los eventos</option>
              {eventOptions.map((o) => (
                <option key={o.value} value={o.value} className="bg-white text-ink-charcoal font-normal">
                  {o.label}
                </option>
              ))}
            </select>
            <span
              className={`material-symbols-outlined pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[16px] ${eventFilter ? "text-[#FAF6F0]" : "text-ink-muted"}`}
              aria-hidden="true"
            >
              expand_more
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2" role="group" aria-labelledby={statusLabelId}>
          <span id={statusLabelId} className="font-stamp text-[10px] uppercase tracking-wider text-ink-muted font-bold">
            Estado
          </span>
          <div className="flex items-center gap-1.5">
            {STATUS_FILTERS.map((option) => {
              const active = statusFilter === option.value;
              return (
                <button
                  key={option.label}
                  type="button"
                  onClick={() => onStatusChange(option.value)}
                  aria-pressed={active}
                  disabled={disabled}
                  className={[
                    "inline-flex items-center gap-1 px-2.5 py-1 border font-body text-xs rounded-sharp whitespace-nowrap transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-terracotta disabled:opacity-60",
                    active
                      ? "border-terracotta bg-terracotta text-[#FAF6F0] font-medium shadow-sm"
                      : "border-sepia-border bg-paper-linen text-ink-charcoal hover:border-ink-muted",
                  ].join(" ")}
                >
                  {option.label}
                  {active && option.value && <span className="material-symbols-outlined text-[14px]" aria-hidden="true">check</span>}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-3.5">
        {onViewModeChange && (
          <div
            className="inline-flex rounded-sharp border border-sepia-border bg-paper-linen p-0.5"
            role="group"
            aria-label="Seleccionar vista"
          >
            <button
              type="button"
              onClick={() => onViewModeChange("agenda")}
              aria-pressed={viewMode === "agenda"}
              title="Vista principal"
              className={`p-1 rounded-sharp transition-colors flex items-center justify-center ${
                viewMode === "agenda"
                  ? "bg-paper-card text-terracotta shadow-xs border border-sepia-border/60"
                  : "text-ink-muted hover:text-ink-charcoal"
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">view_agenda</span>
            </button>
            <button
              type="button"
              onClick={() => onViewModeChange("kanban")}
              aria-pressed={viewMode === "kanban"}
              title="Vista por columnas"
              className={`p-1 rounded-sharp transition-colors flex items-center justify-center ${
                viewMode === "kanban"
                  ? "bg-paper-card text-terracotta shadow-xs border border-sepia-border/60"
                  : "text-ink-muted hover:text-ink-charcoal"
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">view_kanban</span>
            </button>
          </div>
        )}
        <ExecutedSwitch checked={showExecuted} onChange={onShowExecutedChange} disabled={disabled} />
      </div>

      {hasActive && (
        <div className="flex flex-wrap items-center justify-end gap-2 px-2.5 py-1.5 bg-paper-card border border-sepia-border rounded-sharp" role="status">
          <span className="font-stamp text-[10px] uppercase tracking-wider text-ink-muted">Filtro activo:</span>
          {activeEvent && <ActiveChip label={activeEvent.label} onRemove={() => onEventChange("")} />}
          {activeStatus && <ActiveChip label={activeStatus.label} onRemove={() => onStatusChange("")} />}
          <button
            type="button"
            onClick={onClear}
            className="font-body text-xs text-terracotta hover:text-terracotta-dark underline-offset-2 hover:underline px-1 rounded-sharp focus:outline-none focus-visible:ring-2 focus-visible:ring-terracotta"
          >
            Limpiar filtros
          </button>
        </div>
      )}
    </div>
  );
}

function ExecutedSwitch({ checked, onChange, disabled }) {
  const labelId = useId();
  return (
    <div className="flex items-center justify-end gap-2">
      <span id={labelId} className="font-body text-xs text-ink-charcoal">
        Mostrar gestiones ejecutadas
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby={labelId}
        onClick={() => onChange(!checked)}
        disabled={disabled}
        className={[
          "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-terracotta focus-visible:ring-offset-1 disabled:opacity-60",
          checked ? "bg-sage-wax" : "bg-ink-muted",
        ].join(" ")}
      >
        <span
          aria-hidden="true"
          className={[
            "inline-block h-3.5 w-3.5 rounded-full bg-paper-card shadow-sm transition-transform",
            checked ? "translate-x-[18px]" : "translate-x-[3px]",
          ].join(" ")}
        />
      </button>
    </div>
  );
}

function ActiveChip({ label, onRemove }) {
  return (
    <span className="inline-flex items-center gap-1 pl-2 pr-1 py-0.5 bg-terracotta-light/70 border border-terracotta/30 rounded-sharp font-body text-xs font-semibold text-terracotta-dark max-w-[200px]">
      <span className="truncate">{label}</span>
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Quitar filtro ${label}`}
        className="inline-flex items-center rounded-sharp hover:text-crimson-urgent focus:outline-none focus-visible:ring-2 focus-visible:ring-terracotta"
      >
        <span className="material-symbols-outlined text-[14px]" aria-hidden="true">close</span>
      </button>
    </span>
  );
}
