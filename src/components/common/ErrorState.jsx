/**
 * ErrorState.jsx
 * ---------------------------------------------------------------------------
 * Shown when a fetch fails. `onRetry` re-runs the fetch.
 *
 * @param {() => void} onRetry
 * @param {string} [message]
 * @param {string} [secondaryLabel]     - label del botón secundario (opcional)
 * @param {() => void} [onSecondaryCta] - callback del botón secundario
 *
 * NOTA Sprint 1: "Volver al listado" no tiene destino real todavía. Cuando
 * exista un listado de eventos, se actualizará a una ruta concreta.
 */
export default function ErrorState({
  onRetry,
  message = "No pudimos cargar tus gestiones",
  secondaryLabel,
  onSecondaryCta,
}) {
  return (
    <div className="max-w-[1440px] mx-auto px-4 md:px-8 lg:px-12">
      <div className="mt-8 bg-paper-card border border-sepia-border rounded-sharp p-8 md:p-12 text-center max-w-xl mx-auto warm-card-shadow">
        <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-crimson-paper text-crimson-urgent flex items-center justify-center">
          <span className="material-symbols-outlined text-[24px]">error_outline</span>
        </div>
        <h3 className="font-serif text-2xl md:text-3xl text-ink-charcoal font-semibold mb-2">{message}</h3>
        <p className="font-body text-sm text-ink-muted max-w-md mx-auto mb-6">
          Revisa tu conexión a internet e inténtalo de nuevo.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={onRetry}
            type="button"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-6 py-2.5 bg-terracotta text-[#FAF6F0] font-body font-semibold text-sm rounded-sharp shadow-sm hover:bg-terracotta-dark transition-colors focus:outline-none focus:ring-2 focus:ring-terracotta focus:ring-offset-2 focus:ring-offset-paper-card"
          >
            <span className="material-symbols-outlined text-[18px]">refresh</span>
            <span>Reintentar</span>
          </button>
          {onSecondaryCta && secondaryLabel && (
            <button
              type="button"
              onClick={onSecondaryCta}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-paper-base hover:bg-paper-linen border border-sepia-border text-ink-charcoal font-body text-sm font-medium rounded-sharp transition-colors focus:outline-none focus:ring-2 focus:ring-terracotta focus:ring-offset-2 focus:ring-offset-paper-card"
            >
              <span>{secondaryLabel}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}