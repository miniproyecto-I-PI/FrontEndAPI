import { useEffect, useRef, useState } from "react";
import { EVENT_TYPE_SINGULAR } from "../../data/mockEvents";

const MONTHS = [
  "Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic",
];

function formatDayMonthYear(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

/**
 * DeleteEventModal.jsx
 * Modal específico para eliminar un evento (no reemplaza al ConfirmDeleteModal
 * genérico, que sigue usándose para subtareas). El diseño Stitch (Sprint 1)
 * agregó: icono crimson, badge "Acción irreversible", preview card con datos
 * del evento, y botones con labels no-genéricos.
 *
 * @param {Object} event — { name, type, dateTime, place }
 * @param {() => void} onCancel
 * @param {() => Promise<void>} onConfirm
 */
export default function DeleteEventModal({ event, onCancel, onConfirm }) {
  const [status, setStatus] = useState("idle"); // idle | loading
  const [generalError, setGeneralError] = useState(null);
  const cancelRef = useRef(null);

  useEffect(() => {
    cancelRef.current?.focus();
  }, []);

  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape" && status !== "loading") onCancel();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel, status]);

  async function handleConfirm() {
    setGeneralError(null);
    setStatus("loading");
    try {
      await onConfirm();
    } catch (err) {
      setStatus("idle");
      setGeneralError(err.message || "No se pudo eliminar. Intenta de nuevo.");
    }
  }

  const isLoading = status === "loading";

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="delete-event-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-charcoal/40 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isLoading) onCancel();
      }}
    >
      <div className="bg-paper-card border border-sepia-border rounded-sharp p-6 md:p-7 max-w-lg w-full warm-card-shadow relative">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-full bg-crimson-paper text-crimson-urgent flex items-center justify-center shrink-0 border border-crimson-urgent/20">
              <span className="material-symbols-outlined text-[20px]">
                delete
              </span>
            </div>
            <div>
              <span className="font-mono-stamp text-[10px] uppercase text-crimson-tag font-bold tracking-wider block">
                Acción irreversible
              </span>
              <h2
                id="delete-event-title"
                className="font-serif text-xl md:text-2xl font-bold text-ink-charcoal leading-snug mt-0.5"
              >
                ¿Eliminar el evento «{event.name}»?
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            aria-label="Cerrar modal"
            className="w-8 h-8 rounded-sharp border border-sepia-border bg-paper-base text-ink-muted hover:text-ink-charcoal hover:bg-paper-linen flex items-center justify-center transition-colors shrink-0 disabled:opacity-60"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        <p className="font-body text-xs text-ink-muted leading-relaxed mb-4">
          Esta acción eliminará de forma definitiva el expediente, todas sus
          gestiones operativas y los registros asociados. No se puede deshacer.
        </p>

        {/* Preview card */}
        <div className="bg-paper-linen/80 border border-sepia-border rounded-sharp p-3 text-xs text-ink-muted mb-6 space-y-1.5">
          <div className="flex items-center justify-between text-ink-charcoal gap-3">
            <span className="font-serif font-bold text-[13px] truncate">
              {event.name}
            </span>
            {event.type && (
              <span className="font-mono-stamp text-[10px] font-bold text-ink-charcoal bg-paper-card border border-sepia-border px-2 py-0.5 rounded-sharp uppercase shrink-0">
                {EVENT_TYPE_SINGULAR[event.type] ?? event.type}
              </span>
            )}
          </div>
          <div className="flex items-center flex-wrap gap-x-4 gap-y-1 text-[11px] text-ink-muted pt-1 border-t border-sepia-border/60">
            {event.dateTime && (
              <span className="inline-flex items-center gap-1">
                <span className="material-symbols-outlined text-[13px] text-ink-muted">
                  calendar_today
                </span>
                {formatDayMonthYear(event.dateTime)}
              </span>
            )}
            {event.place && (
              <span className="inline-flex items-center gap-1">
                <span className="material-symbols-outlined text-[13px] text-ink-muted">
                  location_on
                </span>
                {event.place}
              </span>
            )}
          </div>
        </div>

        {generalError && (
          <div
            role="alert"
            className="mb-4 rounded-sharp bg-crimson-paper border border-crimson-urgent/30 px-3 py-2 font-body text-xs text-crimson-urgent"
          >
            {generalError}
          </div>
        )}

        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-sepia-border/60">
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-3.5 py-2 bg-paper-base hover:bg-paper-linen border border-sepia-border text-ink-charcoal font-body text-xs font-medium rounded-sharp transition-colors disabled:opacity-60"
          >
            Conservar evento
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-crimson-urgent hover:bg-crimson-tag text-[#FAF6F0] font-body text-xs font-semibold rounded-sharp transition-colors shadow-sm active:translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <span className="material-symbols-outlined text-[16px]">
              delete_forever
            </span>
            <span>
              {isLoading ? "Eliminando…" : "Eliminar evento definitivamente"}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}