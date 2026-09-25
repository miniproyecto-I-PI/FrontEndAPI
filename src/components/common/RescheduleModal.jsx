import { useEffect, useRef, useState } from "react";

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
 *    date/time for that one gestión (a small, honest stand-in for the real
 *    US-06 flow, useful to demo the interaction pattern now).
 *
 * Accesibilidad (TS-06):
 *  - Escape cierra el modal.
 *  - Foco inicial al input en single, al contenedor del diálogo en bulk.
 *  - aria-labelledby apunta al título → el lector anuncia qué modal es.
 *  - focus:ring visible en input y botones.
 */
export default function RescheduleModal({ mode, count, currentDateISO, onCancel, onConfirm }) {
  const [newDate, setNewDate] = useState(() => toDatetimeLocalValue(currentDateISO));

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
    onConfirm(mode === "single" ? new Date(newDate).toISOString() : undefined);
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
              className="font-serif text-2xl font-bold text-ink-charcoal"
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
              className="font-serif text-2xl font-bold text-ink-charcoal"
            >
              Reprogramar gestión
            </h3>
            <label className="block mt-4">
              <span className="font-body text-xs font-medium text-ink-muted">
                Nueva fecha y hora
              </span>
              <input
                ref={dateInputRef}
                type="datetime-local"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                aria-describedby={!canConfirm ? "reschedule-hint" : undefined}
                className="mt-1 w-full border border-sepia-border rounded-sharp px-3 py-2 font-body text-sm text-ink-charcoal focus:outline-none focus:border-terracotta focus:ring-2 focus:ring-terracotta focus:ring-offset-1 focus:ring-offset-paper-card"
              />
              {!canConfirm && (
                <p
                  id="reschedule-hint"
                  className="mt-1 font-body text-xs text-crimson-urgent"
                >
                  Elige una fecha para poder confirmar.
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

/** Formats an ISO date string into the value <input type="datetime-local"> expects. */
function toDatetimeLocalValue(isoString) {
  if (!isoString) return "";
  const d = new Date(isoString);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}