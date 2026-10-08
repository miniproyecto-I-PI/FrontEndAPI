import { useState } from "react";

/**
 * ApiErrorRetryView.jsx
 * ---------------------------------------------------------------------------
 * Pantalla de error de API con conservación del valor y reintento directo
 * (Estados 3 y 7 de la guía visual). Garantiza tolerancia a fallos de red.
 */
export default function ApiErrorRetryView({
  title = "No se pudo aplicar el cambio",
  description = "Ocurrió un problema de conexión al intentar actualizar los datos de esta gestión en el servidor.",
  retainedType = "date", // 'date' | 'hours'
  retainedValue,
  retainedLabel,
  onRetry,
  onBack,
}) {
  const [isRetrying, setIsRetrying] = useState(false);

  async function handleRetry() {
    setIsRetrying(true);
    try {
      await onRetry();
    } finally {
      setIsRetrying(false);
    }
  }

  const badgeText = retainedType === "date" ? "✓ Fecha retenida" : "✓ Valor retenido";

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="api-error-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-charcoal/40 backdrop-blur-sm focus:outline-none"
    >
      <div className="relative w-full max-w-[500px] bg-paper-card border border-sepia-border rounded-sharp p-6 md:p-7 shadow-xl warm-card-shadow overflow-hidden">
        {/* Barra superior de acento rojo */}
        <div className="absolute top-0 inset-x-0 h-1 bg-crimson-urgent" />

        {/* Encabezado con ícono de advertencia */}
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-full bg-crimson-paper border border-crimson-urgent/30 flex items-center justify-center text-crimson-urgent shrink-0">
            <span className="material-symbols-outlined text-[22px]">error_outline</span>
          </div>
          <div>
            <span className="font-stamp text-[11px] font-bold tracking-wider text-crimson-urgent uppercase block">
              Fallo de comunicación
            </span>
            <h2 id="api-error-title" className="font-heading text-xl md:text-2xl font-bold text-ink-charcoal">
              {title}
            </h2>
          </div>
        </div>

        <p className="font-body text-xs md:text-sm text-ink-muted mt-2 leading-relaxed">
          {description}
        </p>

        {/* Bloque de selección retenida */}
        <div className="mt-4 p-4 bg-paper-linen/60 border border-sepia-border rounded-sharp">
          <div className="flex items-center justify-between text-xs font-body mb-1.5">
            <span className="font-stamp text-[10px] font-bold text-ink-muted uppercase">
              Tu selección guardada:
            </span>
            <span className="px-2 py-0.5 rounded-sharp bg-sage-light text-sage-wax font-stamp text-[10px] font-bold">
              {badgeText}
            </span>
          </div>

          <div className="flex items-center justify-between gap-2 mt-2">
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-terracotta text-[20px]">
                {retainedType === "date" ? "calendar_month" : "schedule"}
              </span>
              <div>
                <p className="font-body text-sm font-bold text-ink-charcoal">
                  {retainedLabel || retainedValue}
                </p>
                {retainedType === "hours" && (
                  <p className="font-body text-[11px] text-ink-muted">
                    Nueva estimación: {retainedValue} h
                  </p>
                )}
              </div>
            </div>

            <span className="font-stamp text-[10px] text-ink-muted uppercase">
              Listo para reintentar
            </span>
          </div>
        </div>

        <p className="font-body text-[11px] text-ink-subtle mt-3 leading-relaxed">
          No tienes que volver a seleccionar ni reconfigurar la gestión. Al pulsar reintentar enviaremos la solicitud
          de nuevo.
        </p>

        {/* Botones de acción */}
        <div className="flex items-center justify-end gap-2.5 pt-5 mt-4 border-t border-sepia-border">
          <button
            type="button"
            onClick={onBack}
            className="px-4 py-2 rounded-sharp bg-paper-base hover:bg-paper-linen border border-sepia-border text-ink-charcoal font-body text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-terracotta"
          >
            Volver
          </button>
          <button
            type="button"
            disabled={isRetrying}
            onClick={handleRetry}
            className="px-5 py-2 rounded-sharp bg-terracotta hover:bg-terracotta-dark disabled:opacity-60 text-[#FAF6F0] font-body text-xs font-semibold tracking-wide border border-terracotta-dark shadow-sm transition-colors inline-flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-terracotta"
          >
            <span className={`material-symbols-outlined text-[16px] ${isRetrying ? "animate-spin" : ""}`}>
              sync
            </span>
            <span>{isRetrying ? "Reintentando…" : "Reintentar"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
