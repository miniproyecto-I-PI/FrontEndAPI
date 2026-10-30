import { useEffect, useRef } from "react";

/**
 * UnsavedDraftConfirmModal.jsx
 * Se muestra al pulsar "Crear el evento" cuando el organizador dejó datos
 * escritos en el borrador de gestión inicial pero no pulsó "Añadir gestión".
 * Advierte que esos datos se perderán si continúa.
 */
export default function UnsavedDraftConfirmModal({ onCancel, onConfirm }) {
  const cancelRef = useRef(null);

  useEffect(() => {
    cancelRef.current?.focus();
  }, []);

  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onCancel();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="unsaved-draft-title"
      aria-describedby="unsaved-draft-desc"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-charcoal/40 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div className="relative w-full max-w-md bg-paper-card border border-sepia-border rounded-sharp warm-card-shadow overflow-hidden">
        <div className="h-1 w-full bg-gold" />
        <div className="p-6 md:p-7 space-y-4">
          <div className="flex items-center gap-2 text-gold-dark font-stamp text-[11px] font-bold tracking-wider uppercase">
            <span className="material-symbols-outlined text-[17px]" aria-hidden="true">warning</span>
            <span>Datos sin guardar</span>
          </div>
          <h2 id="unsaved-draft-title" className="font-heading text-xl md:text-2xl font-bold text-ink-charcoal">
            No añadiste la gestión
          </h2>
          <p id="unsaved-draft-desc" className="font-body text-sm text-ink-muted leading-relaxed">
            Escribiste datos en la gestión inicial pero no pulsaste <strong className="text-ink-charcoal">«Añadir gestión»</strong>. Si continúas, esos datos se perderán. ¿Estás seguro de crear el evento sin la gestión?
          </p>
          <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3 pt-2 border-t border-sepia-border">
            <button
              ref={cancelRef}
              type="button"
              onClick={onCancel}
              className="px-4 py-2 rounded-sharp bg-paper-base hover:bg-paper-linen border border-sepia-border text-ink-charcoal font-body text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-terracotta"
            >
              Volver y añadirla
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className="px-4 py-2 rounded-sharp bg-terracotta hover:bg-terracotta-dark text-[#FAF6F0] font-body text-xs font-semibold inline-flex items-center gap-1.5 border border-terracotta-dark shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-terracotta"
            >
              <span className="material-symbols-outlined text-[15px]" aria-hidden="true">check</span>
              <span>Sí, crear sin la gestión</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}