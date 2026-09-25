/**
 * CreateEventSuccessModal.jsx
 * Modal de éxito post-create (US-01). Muestra el nombre del evento creado
 * y ofrece dos salidas: quedarse en /crear o ir a /eventos.
 *
 * @param {string} eventName
 * @param {() => void} onStay
 * @param {() => void} onGoToEvents
 */
export default function CreateEventSuccessModal({
  eventName,
  onStay,
  onGoToEvents,
}) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-event-success-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-charcoal/50 backdrop-blur-md"
      onClick={(e) => e.target === e.currentTarget && onStay()}
    >
      <div className="relative w-full max-w-lg bg-paper-card border border-sepia-border rounded-sharp p-6 md:p-8 shadow-xl warm-card-shadow text-center space-y-5">
        <button
          type="button"
          onClick={onStay}
          aria-label="Cerrar modal"
          className="absolute top-4 right-4 w-8 h-8 rounded-sharp border border-sepia-border bg-paper-base hover:bg-paper-linen text-ink-muted hover:text-ink-charcoal flex items-center justify-center transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">close</span>
        </button>

        <div className="flex flex-col items-center justify-center pt-2">
          <div className="w-16 h-16 rounded-full bg-terracotta-light/50 border border-terracotta/30 text-terracotta flex items-center justify-center mb-3 shadow-inner">
            <span className="material-symbols-outlined text-[34px]">
              verified
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <h3
            id="create-event-success-title"
            className="font-serif text-2xl md:text-3xl font-bold text-ink-charcoal tracking-tight"
          >
            ¡Evento creado con éxito!
          </h3>
          <p className="font-body text-xs md:text-sm text-ink-muted leading-relaxed max-w-md mx-auto">
            El expediente para{" "}
            <span className="font-semibold text-ink-charcoal">
              {eventName || "tu evento"}
            </span>{" "}
            ha sido registrado en tu bitácora. Ya puedes comenzar a programar
            gestiones y asignar tiempos clave.
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={onStay}
            className="w-full sm:w-auto px-4 py-2.5 bg-paper-base hover:bg-paper-linen text-ink-charcoal font-body text-xs font-medium rounded-sharp border border-sepia-border transition-colors order-last sm:order-first"
          >
            Permanecer en esta vista
          </button>
          <button
            type="button"
            onClick={onGoToEvents}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-terracotta hover:bg-terracotta-dark text-[#FAF6F0] font-serif font-semibold text-xs md:text-sm rounded-sharp border border-terracotta-dark shadow-sm transition-colors active:translate-y-0.5"
          >
            <span>Ir a Mis Eventos</span>
            <span className="material-symbols-outlined text-[16px]">
              arrow_forward
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}