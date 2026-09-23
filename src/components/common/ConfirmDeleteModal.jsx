import { useEffect, useRef, useState } from "react";

/**
 * ConfirmDeleteModal.jsx — modal de confirmación para US-03.
 * Genérico: el padre define título, mensaje y qué eliminar.
 * Escape cierra, foco inicial al botón Cancelar (evita confirmar por accidente).
 * Si `onConfirm` lanza, muestra el error dentro del modal sin cerrarlo.
 */
export default function ConfirmDeleteModal({
  title,
  description,
  confirmLabel = "Eliminar",
  onCancel,
  onConfirm,
}) {
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
      // El padre cierra el modal y dispara toast.
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
      aria-labelledby="confirm-delete-title"
      aria-describedby="confirm-delete-desc"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-charcoal/40 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isLoading) onCancel();
      }}
    >
      <div className="relative w-full max-w-md bg-paper-card border border-sepia-border rounded-sharp p-6 shadow-xl warm-card-shadow border-l-[6px] border-l-crimson-urgent">
        <h2 id="confirm-delete-title" className="font-serif text-2xl font-bold text-ink-charcoal">
          {title}
        </h2>
        <p id="confirm-delete-desc" className="font-body text-sm text-ink-muted mt-2 leading-relaxed">
          {description}
        </p>

        {generalError && (
          <div role="alert" className="mt-4 rounded-sharp bg-crimson-paper border border-crimson-urgent/30 px-3 py-2 font-body text-xs text-crimson-urgent">
            {generalError}
          </div>
        )}

        <div className="flex items-center justify-end gap-2.5 pt-6 mt-2">
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 rounded-sharp bg-paper-base hover:bg-paper-linen border border-sepia-border text-ink-charcoal font-body text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-terracotta focus:ring-offset-1 disabled:opacity-60"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isLoading}
            className="px-5 py-2 rounded-sharp bg-crimson-urgent hover:bg-crimson-urgent/90 text-[#FAF6F0] font-body text-xs font-semibold tracking-wide shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-crimson-urgent focus:ring-offset-1 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isLoading ? "Eliminando…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}