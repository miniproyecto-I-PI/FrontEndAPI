import { useId, useState } from "react";
import { formatShortDate, toDateInputValue, validateTargetDateAgainstEvent } from "../../utils/dateUtils";
import { useDailyLimit } from "../../hooks/useDailyLimit";

const emptyDraft = { title: "", provider: "", targetDate: "", time: "", estimatedHours: "" };

/**
 * InitialSubtasks.jsx — bloque "3. Gestiones iniciales (opcional)" de /crear
 * (diseño Stitch). Las gestiones se envían junto al evento en POST /events
 * (`subtasks`), así que quedan creadas en el mismo paso.
 *
 * @param {{title, provider, targetDate, time, estimatedHours}[]} items
 *   targetDate = "AAAA-MM-DD"; provider y time ("HH:MM") son opcionales ("" si vacíos).
 * @param {(item) => void} onAdd
 * @param {(index: number) => void} onRemove
 * @param {string} eventDate  "AAAA-MM-DD" del evento ("" si aún no se elige):
 *   ninguna gestión puede quedar después de ese día.
 */
export default function InitialSubtasks({ items, onAdd, onRemove, eventDate = "", disabled = false }) {
  const { allowSubtasksAfterEvent, allowOverdueSubtasks } = useDailyLimit();
  const [open, setOpen] = useState(true);
  const [draft, setDraft] = useState(emptyDraft);
  const [errors, setErrors] = useState({});
  const baseId = useId();
  const panelId = `${baseId}-panel`;

  function update(field) {
    return (e) => {
      const value = e.target.value;
      setDraft((d) => ({ ...d, [field]: value }));
      setErrors((prev) => {
        if (!prev[field]) return prev;
        const next = { ...prev };
        delete next[field];
        return next;
      });
    };
  }

  function handleAdd() {
    const next = {};
    if (!draft.title.trim()) next.title = "Escribe el título de la gestión.";
    if (!draft.targetDate) {
      next.targetDate = "Elige la fecha límite.";
    } else {
      const todayISO = toDateInputValue(new Date());
      if (!allowOverdueSubtasks && draft.targetDate < todayISO) {
        next.targetDate = "La fecha objetivo no puede ser anterior a hoy.";
      } else if (!allowSubtasksAfterEvent) {
        const afterEvent = validateTargetDateAgainstEvent(draft.targetDate, eventDate);
        if (afterEvent) next.targetDate = afterEvent;
      }
    }
    const hours = Number(draft.estimatedHours);
    if (draft.estimatedHours === "" || Number.isNaN(hours)) next.estimatedHours = "Indica las horas.";
    else if (hours <= 0) next.estimatedHours = "Debe ser mayor a 0.";
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    onAdd({ title: draft.title.trim(), provider: draft.provider.trim(), targetDate: draft.targetDate, time: draft.time, estimatedHours: hours });
    setDraft(emptyDraft);
  }

  // Enter en cualquier campo añade la gestión (sin enviar el formulario del evento).
  function handleKeyDown(e) {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAdd();
    }
  }

  const inputClass = (field) =>
    `input-editorial w-full px-3 py-2 text-sm text-ink-charcoal placeholder:text-ink-subtle placeholder:italic ${errors[field] ? "error-field" : ""}`;

  return (
    <section className="bg-paper-card border border-sepia-border rounded-sharp p-6 md:p-7 warm-card-shadow">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={panelId}
        className="w-full flex items-center justify-between pb-3 border-b border-sepia-border text-left rounded-sharp focus:outline-none focus-visible:ring-2 focus-visible:ring-terracotta"
      >
        <span className="flex items-center gap-3 flex-wrap">
          <span className="w-6 h-6 rounded-full bg-paper-base border border-sepia-border flex items-center justify-center font-heading text-xs font-bold text-terracotta">
            3
          </span>
          <span className="font-heading text-xl font-semibold text-ink-charcoal">
            Gestiones iniciales <span className="font-body text-sm font-normal text-ink-muted">(opcional)</span>
          </span>
          <span className="font-mono-stamp text-[10px] text-ink-muted uppercase">Hoja de ruta</span>
        </span>
        <span className="material-symbols-outlined text-[20px] text-ink-muted" aria-hidden="true">
          {open ? "expand_less" : "expand_more"}
        </span>
      </button>

      {open && (
        <div id={panelId} className="pt-4 space-y-5">
          <p className="font-body text-sm text-ink-muted">
            Programa las primeras gestiones operativas para que aparezcan en tu bitácora desde el primer día.
          </p>

          <div className="bg-paper-linen/60 border border-sepia-border rounded-sharp p-4 space-y-3" onKeyDown={handleKeyDown}>
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              <div className="sm:col-span-7 space-y-1">
                <label htmlFor={`${baseId}-title`} className="block font-body font-semibold text-xs text-ink-charcoal">Título de la gestión</label>
                <input
                  id={`${baseId}-title`}
                  type="text"
                  value={draft.title}
                  onChange={update("title")}
                  disabled={disabled}
                  placeholder="Ej. Confirmar disponibilidad del salón"
                  aria-invalid={Boolean(errors.title)}
                  className={inputClass("title")}
                />
                {errors.title && <p className="text-[11px] text-crimson-urgent font-medium">{errors.title}</p>}
              </div>
              <div className="sm:col-span-5 space-y-1">
                <label htmlFor={`${baseId}-provider`} className="flex items-center justify-between font-body font-semibold text-xs text-ink-charcoal">
                  <span>Proveedor o encargado</span>
                  <span className="text-[11px] text-ink-muted font-normal">Opcional</span>
                </label>
                <input
                  id={`${baseId}-provider`}
                  type="text"
                  value={draft.provider}
                  onChange={update("provider")}
                  disabled={disabled}
                  placeholder="Ej. Chef Jean-Luc"
                  className={inputClass("provider")}
                />
              </div>
              <div className="sm:col-span-4 space-y-1">
                <label htmlFor={`${baseId}-date`} className="block font-body font-semibold text-xs text-ink-charcoal">Fecha límite</label>
                <input
                  id={`${baseId}-date`}
                  type="date"
                  min={allowOverdueSubtasks ? undefined : toDateInputValue(new Date())}
                  value={draft.targetDate}
                  onChange={update("targetDate")}
                  disabled={disabled}
                  aria-invalid={Boolean(errors.targetDate)}
                  className={inputClass("targetDate")}
                />
                {errors.targetDate && <p className="text-[11px] text-crimson-urgent font-medium">{errors.targetDate}</p>}
              </div>
              <div className="sm:col-span-4 space-y-1">
                <label htmlFor={`${baseId}-time`} className="flex items-center justify-between font-body font-semibold text-xs text-ink-charcoal">
                  <span>Hora límite o reunión</span>
                  <span className="text-[11px] text-ink-muted font-normal">Opcional</span>
                </label>
                <input
                  id={`${baseId}-time`}
                  type="time"
                  value={draft.time}
                  onChange={update("time")}
                  disabled={disabled}
                  className={inputClass("time")}
                />
              </div>
              <div className="sm:col-span-4 space-y-1">
                <label htmlFor={`${baseId}-hours`} className="block font-body font-semibold text-xs text-ink-charcoal">Horas est.</label>
                <input
                  id={`${baseId}-hours`}
                  type="number"
                  min="0.5"
                  step="0.5"
                  value={draft.estimatedHours}
                  onChange={update("estimatedHours")}
                  disabled={disabled}
                  placeholder="Ej. 2.0 h"
                  aria-invalid={Boolean(errors.estimatedHours)}
                  className={inputClass("estimatedHours")}
                />
                {errors.estimatedHours && <p className="text-[11px] text-crimson-urgent font-medium">{errors.estimatedHours}</p>}
              </div>
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleAdd}
                disabled={disabled}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-paper-card hover:bg-paper-base border border-sepia-border text-ink-charcoal font-body text-xs font-semibold rounded-sharp transition-colors disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-terracotta"
              >
                <span className="material-symbols-outlined text-[16px]" aria-hidden="true">add</span>
                Añadir gestión
              </button>
            </div>
          </div>

          {items.length > 0 && (
            <div>
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-sepia-border">
                <span className="font-mono-stamp text-[10px] uppercase tracking-wider text-ink-muted font-bold">
                  Gestiones programadas ({items.length})
                </span>
                <span className="font-body text-[11px] text-ink-muted">Se crearán junto con el evento</span>
              </div>
              <ul className="space-y-2">
                {items.map((item, index) => {
                  // Si luego se cambia la fecha del evento, la gestión puede quedar fuera de rango.
                  const dateError = validateTargetDateAgainstEvent(item.targetDate, eventDate);
                  return (
                  <li key={`${item.title}-${index}`} className="flex items-center gap-3 px-3 py-2.5 bg-paper-linen/50 border border-sepia-border rounded-sharp">
                    <span className="material-symbols-outlined text-[18px] text-terracotta" aria-hidden="true">assignment</span>
                    <span className="flex-1 min-w-0 truncate font-body text-sm text-ink-charcoal">
                      {item.title}
                      {item.provider && <span className="text-ink-muted"> · {item.provider}</span>}
                    </span>
                    <span
                      title={dateError ?? undefined}
                      className={`inline-flex items-center gap-1 font-mono-stamp text-[11px] px-2 py-0.5 rounded-sharp border ${
                        dateError
                          ? "text-crimson-urgent bg-crimson-paper border-crimson-urgent/30"
                          : "text-ink-muted bg-paper-card border-sepia-border"
                      }`}
                    >
                      <span className="material-symbols-outlined text-[13px]" aria-hidden="true">calendar_today</span>
                      {formatShortDate(item.targetDate)}
                      {item.time && ` · ${item.time}`}
                    </span>
                    <span className="font-mono-stamp text-[11px] text-ink-muted bg-paper-card border border-sepia-border px-2 py-0.5 rounded-sharp">
                      {item.estimatedHours} h
                    </span>
                    <button
                      type="button"
                      onClick={() => onRemove(index)}
                      disabled={disabled}
                      aria-label={`Quitar la gestión ${item.title}`}
                      className="p-1 rounded-sharp text-ink-muted hover:text-crimson-urgent hover:bg-crimson-paper transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-terracotta"
                    >
                      <span className="material-symbols-outlined text-[18px]" aria-hidden="true">close</span>
                    </button>
                  </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
