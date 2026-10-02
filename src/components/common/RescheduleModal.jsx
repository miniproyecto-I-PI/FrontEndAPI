import { useEffect, useRef, useState } from "react";
import { toDateInputValue, validateTargetDateAgainstEvent } from "../../utils/dateUtils";

/**
 * RescheduleModal.jsx
 * ---------------------------------------------------------------------------
 * Two flavours of the same dialog, controlled by the `mode` prop:
 *
 *  - mode="bulk": "Reprogramar todas" on the Vencidas section. Mirrors the
 *    original prototype's copy exactly — it does not ask for a specific new
 *    date, it just confirms moving every overdue gestión out of the way.
 *    For the Sprint 0 prototype this pushes them to "tomorrow, same time"
 *    (see pages/HoyPage.jsx). The full reprogramming flow with per-item date
 *    picking and overload-conflict detection (US-06/US-07/US-08) is
 *    Sprint 3 scope and will live in /evento/:id.
 *
 *  - mode="single": "Reprogramar" on one card. Lets the user pick a new
 *    target date for that one gestión. `target_date` is a plain local date
 *    (no time), so the picker is <input type="date"> and `onConfirm` gets
 *    "YYYY-MM-DD" — converting through toISOString() shifted the day for
 *    evening times in UTC-5. The optional hour is edited in EditSubtaskModal.
 *    With `eventDateTime`, a date after the event day shows an error on
 *    confirm (same rule as the backend's `target_date_after_event`).
 *
 * Accesibilidad (TS-06):
 *  - Escape cierra el modal.
 *  - Foco inicial al input en single, al contenedor del diálogo en bulk.
 *  - aria-labelledby apunta al título → el lector anuncia qué modal es.
 *  - focus:ring visible en input y botones.
 */
export default function RescheduleModal({ mode, count, currentDateISO, eventDateTime, onCancel, onConfirm }) {
  const [newDate, setNewDate] = useState(() => toDateInputValue(currentDateISO));
  const [dateError, setDateError] = useState(null);

  const dateInputRef = useRef(null);
  const dialogRef = useRef(null);

  // Foco inicial según modo
  useEffect(() => {
    if (mode === "single") {
      dateInputRef.current?.focus();
    } else {
      dialogRef.current?.focus();
    }
  }, [mode]);

  // Escape cierra
  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onCancel();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  // En single, sin fecha no se puede confirmar (evita el crash de new Date("")).
  const canConfirm = mode !== "single" || Boolean(newDate);

  function handleConfirm() {
    if (!canConfirm) return;
    if (mode === "single") {
      const afterEvent = validateTargetDateAgainstEvent(newDate, eventDateTime);
      if (afterEvent) {
        setDateError(afterEvent);
        return;
      }
    }
    onConfirm(mode === "single" ? newDate : undefined);
  }

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="reschedule-title"
      tabIndex={-1}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-charcoal/40 backdrop-blur-sm focus:outline-none"
      onClick={(e) => e.target === e.currentTarget && onCancel()}
    >
      <div className="relative w-full max-w-md bg-paper-card border border-sepia-border rounded-sharp p-6 shadow-xl warm-card-shadow">
        {mode === "bulk" ? (
          <>
            <h3
              id="reschedule-title"
              className="font-heading text-2xl font-bold text-ink-charcoal"
            >
              ¿Reprogramar las {count} gestiones vencidas?
            </h3>
            <p className="font-body text-sm text-ink-muted mt-2 leading-relaxed">
              Se moverán a la bandeja de pendientes para asignarles una nueva fecha desde el
              detalle de cada evento.
            </p>
          </>
        ) : (
          <>
            <h3
              id="reschedule-title"
              className="font-heading text-2xl font-bold text-ink-charcoal"
            >
              Reprogramar gestión
            </h3>
            <label className="block mt-4">
              <span className="font-body text-xs font-medium text-ink-muted">
                Nueva fecha límite
              </span>
              <input
                ref={dateInputRef}
                type="date"
                value={newDate}
                onChange={(e) => {
                  setNewDate(e.target.value);
                  setDateError(null);
                }}
                aria-invalid={Boolean(dateError)}
                aria-describedby={!canConfirm || dateError ? "reschedule-hint" : undefined}
                className="mt-1 w-full border border-sepia-border rounded-sharp px-3 py-2 font-body text-sm text-ink-charcoal focus:outline-none focus:border-terracotta focus:ring-2 focus:ring-terracotta focus:ring-offset-1 focus:ring-offset-paper-card"
              />
              {(!canConfirm || dateError) && (
                <p
                  id="reschedule-hint"
                  className="mt-1 font-body text-xs text-crimson-urgent"
                >
                  {dateError || "Elige una fecha para poder confirmar."}
                </p>
              )}
            </label>
          </>
        )}

        <div className="flex items-center justify-end gap-2.5 pt-6 mt-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-sharp bg-paper-base hover:bg-paper-linen border border-sepia-border text-ink-charcoal font-body text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-terracotta focus:ring-offset-1"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!canConfirm}
            className="px-5 py-2 rounded-sharp bg-terracotta hover:bg-terracotta-dark text-[#FAF6F0] font-body text-xs font-semibold tracking-wide border border-terracotta-dark shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-terracotta focus:ring-offset-1 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}
