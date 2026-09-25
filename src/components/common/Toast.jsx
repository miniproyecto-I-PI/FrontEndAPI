import { useEffect } from "react";

/**
 * Toast.jsx
 * ---------------------------------------------------------------------------
 * Controlled toast: the parent owns the state (`toast` object or `null`) and
 * passes it down, so multiple pages could reuse this component without a
 * global context. Auto-dismisses after `durationMs` unless the user
 * interacts with it first.
 *
 * @param {{ message: string, onUndo?: () => void } | null} toast
 * @param {() => void} onClose
 */
export default function Toast({ toast, onClose, durationMs = 3500 }) {
  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(onClose, durationMs);
    return () => clearTimeout(timer);
  }, [toast, onClose, durationMs]);

  const isVisible = Boolean(toast);
  const isError = toast?.intent === "error";

  // Colores e ícono según intent
  const borderLeft = isError ? "border-l-crimson-urgent" : "border-l-terracotta";
  const iconName = isError ? "error" : "check_circle";
  const iconClass = isError ? "text-crimson-urgent" : "text-terracotta";

  return (
    <div
      aria-live="polite"
      className={`fixed bottom-6 left-6 z-50 transform transition-all duration-300 ${
        isVisible ? "translate-y-0 opacity-100" : "translate-y-20 opacity-0 pointer-events-none"
      }`}
    >
      <div
        className={`bg-paper-card border border-sepia-border rounded-sharp shadow-lg p-3 px-4 flex items-center gap-3.5 border-l-4 ${borderLeft}`}
      >
        <span className={`material-symbols-outlined text-[20px] ${iconClass}`}>
          {iconName}
        </span>
        <p className="font-body text-xs md:text-sm font-medium text-ink-charcoal">
          {toast?.message}
        </p>
        {toast?.onUndo && (
          <>
            <div className="h-4 w-px bg-sepia-border mx-0.5" />
            <button
              type="button"
              onClick={() => {
                toast.onUndo();
                onClose();
              }}
              className="text-terracotta-dark hover:text-terracotta font-body text-xs font-semibold underline hover:no-underline transition-all focus:outline-none"
            >
              Deshacer
            </button>
          </>
        )}
        <button
          aria-label="Cerrar notificación"
          type="button"
          onClick={onClose}
          className="text-ink-muted hover:text-ink-charcoal transition-colors ml-1 p-0.5"
        >
          <span className="material-symbols-outlined text-[16px]">close</span>
        </button>
      </div>
    </div>
  );
}
