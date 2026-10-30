import { useState } from "react";

/**
 * ReduceHoursModal.jsx
 * ---------------------------------------------------------------------------
 * US-08: Resolución reduciendo horas estimadas.
 * Toma en cuenta si el usuario permite sobrecarga (allowOverload) para
 * habilitar o bloquear el botón de confirmación.
 */
export default function ReduceHoursModal({
  gestion,
  targetDateISO,
  currentHoursOnDay = 0,
  dailyLimitHours = 6,
  onConfirmHours,
  onBack,
  isSubmitting = false,
  allowOverload = false, // <-- NUEVA PROP
}) {
  const originalHours = Number(gestion?.estimatedHours ?? gestion?.estimated_hours ?? 2);
  const availableHours = Math.floor((dailyLimitHours - currentHoursOnDay + 1e-9) * 10) / 10;
  const canResolveByReducing = availableHours >= 0.5;
  const recommendedHours = canResolveByReducing
    ? Math.max(0.5, Math.floor((Math.min(originalHours, availableHours) + 1e-9) * 10) / 10)
    : Math.max(0.5, Math.round((originalHours - 0.5) * 10) / 10);
  const [hours, setHours] = useState(() => recommendedHours);
  const [fieldError, setFieldError] = useState("");

  const totalCalculated = Math.round((currentHoursOnDay + hours) * 10) / 10;
  const isOverLimit = totalCalculated > dailyLimitHours;
  const excess = isOverLimit ? Math.round((totalCalculated - dailyLimitHours) * 10) / 10 : 0;
  const isOptimal = !isOverLimit && hours >= 0.5;
  const isInvalidZero = hours < 0.5;

  // El botón se habilita si:
  // 1. Se puede resolver reduciendo (hay margen).
  // 2. Se llegó al valor óptimo (resuelto) O el usuario permite sobrecarga.
  const canSubmit = canResolveByReducing && (isOptimal || allowOverload);

  function handleDecrement() {
    setHours((prev) => {
      const next = Math.max(0, Math.round((prev - 0.5) * 10) / 10);
      setFieldError(next < 0.5 ? "Ingresa al menos 0,5 horas" : "");
      return next;
    });
  }

  function handleIncrement() {
    setHours((prev) => {
      const next = Math.round((prev + 0.5) * 10) / 10;
      setFieldError("");
      return next;
    });
  }

  function handleConfirm() {
    if (hours < 0.5) {
      setFieldError("Ingresa al menos 0,5 horas");
      return;
    }
    onConfirmHours(hours);
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="reduce-hours-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-ink-charcoal/40 backdrop-blur-sm focus:outline-none overflow-y-auto"
    >
      <div className="relative w-full max-w-[540px] max-h-[92vh] bg-paper-card border border-sepia-border rounded-sharp p-6 md:p-8 shadow-xl warm-card-shadow flex flex-col my-auto">
        
        {/* Header */}
        <div className="shrink-0 mb-6">
          <div className="flex items-center justify-between text-ink-muted mb-2">
            <span className="font-stamp text-[11px] font-bold tracking-wider uppercase text-ink-muted">
              Resolución de carga · Gestión
            </span>
            <button
              type="button"
              onClick={onBack}
              className="text-ink-muted hover:text-ink-charcoal p-1 rounded-sharp transition-colors"
              aria-label="Cerrar modal"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>

          <h2 id="reduce-hours-title" className="font-heading text-xl md:text-2xl font-bold text-ink-charcoal">
            Reduce las horas de esta gestión
          </h2>
        </div>

        {/* Cuerpo desplazable */}
        <div className="overflow-y-auto flex-1 pr-1.5 -mr-1 space-y-6 scrollbar-editorial">
          
          {/* Warning si no se puede resolver */}
          {!canResolveByReducing && (
            <div className="p-4 rounded-sharp bg-crimson-paper/50 border border-crimson-urgent/30 text-xs font-body leading-relaxed flex items-start gap-2.5">
              <span className="material-symbols-outlined text-crimson-urgent text-[18px] shrink-0 mt-0.5">event_busy</span>
              <span>
                Esta jornada ya tiene {currentHoursOnDay.toFixed(1).replace(".", ",")}h y solo quedan {Math.max(0, availableHours).toFixed(1).replace(".", ",")}h disponibles. Como el mínimo es 0,5h, reducirla no resolvería el conflicto. Elige otra fecha.
              </span>
            </div>
          )}

          {/* Stepper */}
          <div>
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="min-w-0">
                <span className="block font-body font-semibold text-sm text-ink-charcoal">
                  Nueva duración de la tarea:
                </span>
              </div>
              <div
                role="status"
                aria-live="polite"
                aria-atomic="true"
                className={`shrink-0 px-3 py-2 rounded-sharp border font-stamp text-[11px] font-bold text-center transition-all duration-300 ${
                  isOptimal
                    ? "bg-sage-light border-sage-wax/40 text-sage-wax"
                    : "bg-crimson-paper border-crimson-urgent/30 text-crimson-urgent"
                }`}
              >
                <div className="text-[9px] opacity-80 uppercase tracking-wider leading-tight">
                  Carga del día
                </div>
                <div className="leading-tight mt-0.5">
                  {totalCalculated.toFixed(1).replace(".", ",")} /{" "}
                  {dailyLimitHours.toFixed(1).replace(".", ",")} h
                </div>
                <div className="text-[9px] leading-tight mt-0.5 font-semibold">
                  {isOptimal
                    ? "Dentro del límite"
                    : isInvalidZero
                      ? "Duración inválida"
                      : `+${excess.toFixed(1).replace(".", ",")} h exceso`}
                </div>
              </div>
            </div>

            <div
              className={`flex items-center border rounded-sharp bg-paper-card overflow-hidden transition-colors duration-300 ${
                fieldError
                  ? "border-crimson-urgent ring-1 ring-crimson-urgent"
                  : isOptimal
                    ? "border-sage-wax/40"
                    : "border-sepia-border"
              }`}
            >
              <button
                type="button"
                onClick={handleDecrement}
                className="w-14 h-12 flex items-center justify-center text-ink-muted hover:text-ink-charcoal hover:bg-paper-linen text-xl font-bold border-r border-sepia-border transition-colors focus:outline-none"
                aria-label="Restar 0,5 horas"
              >
                −
              </button>
              <div className="flex-1 text-center font-heading text-xl font-bold text-ink-charcoal py-3">
                {hours.toFixed(1).replace(".", ",")} h
              </div>
              <button
                type="button"
                onClick={handleIncrement}
                className="w-14 h-12 flex items-center justify-center text-ink-muted hover:text-ink-charcoal hover:bg-paper-linen text-xl font-bold border-l border-sepia-border transition-colors focus:outline-none"
                aria-label="Sumar 0,5 horas"
              >
                +
              </button>
            </div>

            {fieldError && (
              <p role="alert" className="text-crimson-urgent text-xs font-body mt-2 flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">error</span>
                <span>{fieldError}</span>
              </p>
            )}
          </div>

          {/* Resumen limpio de impacto */}
          {!isInvalidZero && (
            <div
              className={`p-4 rounded-sharp border transition-colors duration-300 ${
                isOptimal
                  ? "bg-sage-light/30 border-sage-wax/20"
                  : "bg-paper-linen/50 border-sepia-border"
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="font-body text-xs text-ink-muted">
                  {currentHoursOnDay.toFixed(1).replace(".", ",")} h previas + {hours.toFixed(1).replace(".", ",")} h nueva
                </span>
                <span className={`font-heading text-base font-bold ${isOptimal ? "text-sage-wax" : "text-ink-charcoal"}`}>
                  {totalCalculated.toFixed(1).replace(".", ",")} h total
                </span>
              </div>
              <div className="relative h-3 w-full bg-paper-accent rounded-sharp overflow-hidden">
                <div
                  style={{
                    width: `${Math.min(100, (totalCalculated / Math.max(dailyLimitHours, totalCalculated)) * 100)}%`,
                  }}
                  className={`h-full transition-all duration-300 ${isOptimal ? "bg-sage-wax" : "bg-terracotta"}`}
                />
              </div>
            </div>
          )}
        </div>

        {/* Acciones */}
        <div className="shrink-0 flex items-center justify-between pt-5 mt-4 border-t border-sepia-border">
          <button
            type="button"
            onClick={onBack}
            className="px-5 py-2.5 rounded-sharp bg-paper-base hover:bg-paper-linen border border-sepia-border text-ink-charcoal font-body text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-terracotta"
          >
            Volver
          </button>
          <button
            type="button"
            disabled={isSubmitting || !canSubmit}
            onClick={handleConfirm}
            className={`px-6 py-2.5 rounded-sharp font-body text-xs font-semibold tracking-wide border shadow-sm transition-colors inline-flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-terracotta disabled:opacity-60 disabled:cursor-not-allowed ${
              isOptimal
                ? "bg-sage-wax hover:bg-[#2F422F] text-[#FAF6F0] border-[#2F422F]"
                : !allowOverload
                  ? "bg-paper-linen text-ink-muted border-sepia-border"
                  : "bg-terracotta hover:bg-terracotta-dark text-[#FAF6F0] border-terracotta-dark"
            }`}
          >
            <span>
              {isSubmitting
                ? "Guardando…"
                : !canResolveByReducing
                  ? "Elige otra fecha"
                  : !isOptimal
                    ? allowOverload ? "Confirmar con aviso" : "Conflicto sin resolver"
                    : "Confirmar cambio"}
            </span>
            {canSubmit && <span aria-hidden="true">→</span>}
          </button>
        </div>
      </div>
    </div>
  );
}