import { useEffect, useRef, useState } from "react";
import {
  classifyByDate,
  formatOverdueLabel,
  formatShortDate,
  formatUpcomingLabel,
} from "../../utils/dateUtils";

/**
 * DeleteSubtaskModal.jsx
 * Modal específico para eliminar una gestión (subtarea). Reemplaza al
 * ConfirmDeleteModal genérico en EventoDetallePage.
 *
 * Nota: el diseño Stitch original mostraba también un badge de "categoría"
 * y un proveedor. Ambos se omiten porque el backend no los expone todavía.
 */
export default function DeleteSubtaskModal({
  subtask,
  eventName,
  onCancel,
  onConfirm,
}) {
  const [status, setStatus] = useState("idle");
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

  // Metadata: estado por fecha (vencida / hoy / próxima)
  const bucket = classifyByDate(subtask.targetDate);
  const dateLabel =
    bucket === "vencida"
      ? formatOverdueLabel(subtask.targetDate)
      : bucket === "hoy"
        ? "Vence hoy"
        : formatUpcomingLabel(subtask.targetDate) ||
          formatShortDate(subtask.targetDate);

  const isOverdue = bucket === "vencida";

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="delete-subtask-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-ink-charcoal/40 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isLoading) onCancel();
      }}
    >
      <div className="relative w-full max-w-[560px] bg-paper-card border border-sepia-border rounded-sharp shadow-2xl p-6 sm:p-8 overflow-hidden">
        {/* Close */}
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          aria-label="Cerrar modal"
          className="absolute top-4 right-4 w-8 h-8 rounded-sharp border border-sepia-border bg-paper-card text-ink-muted flex items-center justify-center hover:bg-paper-linen transition-colors disabled:opacity-60"
        >
          <span className="material-symbols-outlined text-[18px]">close</span>
        </button>

        {/* Header */}
        <div className="flex items-start gap-4 mb-4">
          <div className="w-11 h-11 rounded-sharp bg-crimson-paper border border-crimson-urgent/30 flex items-center justify-center flex-shrink-0 text-crimson-urgent">
            <span className="material-symbols-outlined text-[24px]">
              delete_outline
            </span>
          </div>
          <div className="pt-0.5 pr-6">
            <div className="flex items-center flex-wrap gap-2 mb-1.5">
              <span className="font-mono-stamp text-[11px] text-crimson-urgent font-bold bg-crimson-paper px-2 py-0.5 rounded-sharp border border-crimson-urgent/30 uppercase tracking-wider">
                Acción irreversible
              </span>
            </div>
            <h3
              id="delete-subtask-title"
              className="font-serif text-[20px] sm:text-[22px] font-semibold text-ink-charcoal leading-snug"
            >
              ¿Eliminar la gestión «{subtask.title}»?
            </h3>
          </div>
        </div>

        {/* Warning text */}
        <p className="font-body text-sm text-ink-muted mb-5 leading-relaxed">
          Esta acción eliminará de forma definitiva la subtarea de la hoja de
          ruta
          {eventName ? (
            <>
              {" "}de la{" "}
              <strong className="font-semibold text-ink-charcoal">
                {eventName}
              </strong>
            </>
          ) : null}{" "}
          y se desvinculará de las alertas operativas de la vista de Hoy. Esta
          acción no se puede deshacer.
        </p>

        {/* Preview card */}
<div className="bg-paper-base border border-sepia-border rounded-sharp p-4 mb-6">
  <div className="flex items-start justify-between gap-3 mb-2.5">
    <span className="font-serif text-[15px] font-semibold text-ink-charcoal leading-tight">
      {subtask.title}
    </span>
    {subtask.status === "EJECUTADA" && (
      <span className="font-mono-stamp text-[10px] text-sage-wax font-semibold bg-sage-light px-2 py-0.5 rounded-sharp whitespace-nowrap border border-sage-wax/20">
        Completada
      </span>
    )}
  </div>

  <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1.5 text-xs text-ink-muted pt-2 border-t border-sepia-border/70">
    <span
      className={`inline-flex items-center gap-1.5 font-medium ${
        isOverdue ? "text-crimson-urgent" : "text-ink-muted"
      }`}
    >
      <span className="material-symbols-outlined text-[15px]">
        {isOverdue ? "event_busy" : "calendar_today"}
      </span>
      <span className="font-mono-stamp text-[11px]">{dateLabel}</span>
    </span>

    <span className="text-sepia-dark/50">•</span>

    <span className="inline-flex items-center gap-1.5 font-mono-stamp text-[11px]">
      <span className="material-symbols-outlined text-[15px] text-terracotta">
        timer
      </span>
      <span>{subtask.estimatedHours} hrs estimadas</span>
    </span>

    {subtask.provider && (
      <>
        <span className="text-sepia-dark/50">•</span>
        <span className="inline-flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[15px] text-terracotta">
            storefront
          </span>
          <span>{subtask.provider}</span>
        </span>
      </>
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

        {/* Actions */}
        <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-end gap-3 pt-1">
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="w-full sm:w-auto px-4 py-2 rounded-sharp border border-sepia-border bg-paper-card hover:bg-paper-linen text-ink-charcoal font-body text-xs font-medium transition-colors text-center disabled:opacity-60"
          >
            Conservar gestión
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isLoading}
            className="w-full sm:w-auto px-4 py-2 rounded-sharp bg-crimson-urgent hover:bg-crimson-tag text-[#FAF6F0] font-body text-xs font-semibold transition-colors flex items-center justify-center gap-2 shadow-sm active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <span className="material-symbols-outlined text-[18px]">
              delete_forever
            </span>
            <span>
              {isLoading ? "Eliminando…" : "Eliminar gestión definitivamente"}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}