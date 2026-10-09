import { useState } from "react";
import { formatFullDate } from "../../utils/dateUtils";

/**
 * ReduceHoursModal.jsx
 * ---------------------------------------------------------------------------
 * US-08: Resolución reduciendo horas estimadas (4 estados de la guía visual).
 * Estado 1: Valor 1,5 h (Sigue excediendo el límite, botón "Confirmar con aviso").
 * Estado 2: Valor 1,0 h (Conflicto resuelto · Carga óptima en verde, botón "Confirmar cambio").
 * Estado 3: Error de valor 0 h (Validación en campo, mínimo 0,5 h).
 * Estado 4: Tolerancia a fallos gestionada con ApiErrorRetryView.
 */
export default function ReduceHoursModal({
  gestion,
  targetDateISO,
  currentHoursOnDay = 0, // horas de las demás gestiones en ese día
  dailyLimitHours = 6,
  onConfirmHours,
  onBack,
  isSubmitting = false,
}) {
  const originalHours = Number(gestion?.estimatedHours ?? gestion?.estimated_hours ?? 2);
  const [hours, setHours] = useState(() => Math.max(0.5, originalHours - 0.5));
  const [fieldError, setFieldError] = useState("");

  const formattedDay = targetDateISO
    ? formatFullDate(new Date(`${targetDateISO}T00:00:00`))
    : "Ese día";

  const totalCalculated = Math.round((currentHoursOnDay + hours) * 10) / 10;
  const isOverLimit = totalCalculated > dailyLimitHours;
  const excess = isOverLimit ? Math.round((totalCalculated - dailyLimitHours) * 10) / 10 : 0;
  const isOptimal = !isOverLimit && hours >= 0.5;
  const isInvalidZero = hours < 0.5;

  function handleDecrement() {
    setHours((prev) => {
      const next = Math.max(0, Math.round((prev - 0.5) * 10) / 10);
      if (next < 0.5) {
        setFieldError("Ingresa al menos 0,5 horas");
      } else {
        setFieldError("");
      }
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
      <div className="relative w-full max-w-[540px] max-h-[92vh] bg-paper-card border border-sepia-border rounded-sharp p-5 sm:p-6 md:p-7 shadow-xl warm-card-shadow flex flex-col my-auto">
        {/* Header con botón de cerrar (fijo) */}
        <div className="shrink-0">
          <div className="flex items-center justify-between text-ink-muted mb-1">
            <span className="font-stamp text-[11px] font-bold tracking-wider uppercase">
              {isOptimal ? (
                <span className="text-sage-wax">Ajuste recomendado</span>
              ) : (
                "Resolución de carga · Gestión"
              )}
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
          <p className="font-body text-xs text-ink-muted mt-0.5">
            <strong className="text-ink-charcoal">{gestion?.title || gestion?.name}</strong> · Estimación actual:{" "}
            {originalHours.toFixed(1).replace(".", ",")}h
          </p>
        </div>

        {/* Cuerpo desplazable */}
        <div className="overflow-y-auto flex-1 pr-1.5 -mr-1 mt-3 space-y-4">
          {/* Callout de contexto */}
        <div
          className={`mt-4 p-3 rounded-sharp text-xs font-body leading-relaxed border ${
            isInvalidZero
              ? "bg-crimson-paper/50 border-crimson-urgent/30 text-ink-charcoal"
              : isOptimal
              ? "bg-sage-light/60 border-sage-wax/30 text-ink-charcoal"
              : "bg-paper-linen/70 border-sepia-border text-ink-muted"
          }`}
        >
          {isInvalidZero ? (
            <div className="flex items-start gap-2">
              <span className="material-symbols-outlined text-crimson-urgent text-[17px] shrink-0 mt-0.5">
                error
              </span>
              <div>
                <strong className="font-semibold block text-crimson-urgent">Cálculo de carga pausado</strong>
                No se puede computar el balance diario con 0 horas. Si la tarea ya no debe realizarse, utiliza la acción
                Descartar o Completar en el menú general de la gestión.
              </div>
            </div>
          ) : isOptimal ? (
            <div className="flex items-start gap-2">
              <span className="material-symbols-outlined text-sage-wax text-[17px] shrink-0 mt-0.5">
                verified
              </span>
              <span>
                Al reducir a <strong>{hours.toFixed(1).replace(".", ",")} h</strong>, la jornada del {formattedDay} quedará
                dentro del límite reglamentario de <strong>{dailyLimitHours.toFixed(1).replace(".", ",")} h</strong>.
              </span>
            </div>
          ) : (
            <div className="flex items-start gap-2">
              <span className="material-symbols-outlined text-ink-muted text-[17px] shrink-0 mt-0.5">
                info
              </span>
              <span>
                El {formattedDay} ya tiene {currentHoursOnDay.toFixed(1).replace(".", ",")}h planificadas en otras gestiones.
                Reduce la duración para no sobrepasar el límite de {dailyLimitHours.toFixed(1).replace(".", ",")}h.
              </span>
            </div>
          )}
        </div>

        {/* Stepper de Horas */}
        <div className="mt-5">
          <div className="flex items-center justify-between text-xs font-body mb-2">
            <span className="font-semibold text-ink-charcoal">Horas estimadas</span>
            <span className="text-ink-muted text-[11px]">
              {isOptimal ? (
                <span className="text-sage-wax font-semibold">✓ Valor óptimo detectado</span>
              ) : (
                "Mínimo: 0,5 h · Pasos de 0,5 h"
              )}
            </span>
          </div>

          <div
            className={`flex items-center border rounded-sharp bg-paper-card overflow-hidden ${
              fieldError ? "border-crimson-urgent ring-1 ring-crimson-urgent" : "border-sepia-border"
            }`}
          >
            <button
              type="button"
              onClick={handleDecrement}
              className="w-12 h-11 flex items-center justify-center text-ink-muted hover:text-ink-charcoal hover:bg-paper-linen text-lg font-bold border-r border-sepia-border transition-colors focus:outline-none"
              aria-label="Restar 0,5 horas"
            >
              −
            </button>
            <div className="flex-1 text-center font-heading text-lg font-bold text-ink-charcoal py-2">
              {hours.toFixed(1).replace(".", ",")} h
            </div>
            <button
              type="button"
              onClick={handleIncrement}
              className="w-12 h-11 flex items-center justify-center text-ink-muted hover:text-ink-charcoal hover:bg-paper-linen text-lg font-bold border-l border-sepia-border transition-colors focus:outline-none"
              aria-label="Sumar 0,5 horas"
            >
              +
            </button>
          </div>

          {fieldError && (
            <p role="alert" className="text-crimson-urgent text-xs font-body mt-1.5 flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">error</span>
              <span>{fieldError}</span>
            </p>
          )}
        </div>

        {/* Tarjeta de impacto en la carga (Estados 1 y 2) */}
        {!isInvalidZero && (
          <div
            className={`mt-4 p-3.5 rounded-sharp border ${
              isOptimal
                ? "bg-sage-light/50 border-sage-wax/30"
                : "bg-paper-linen/60 border-sepia-border"
            }`}
          >
            <div className="flex items-center justify-between text-xs font-body">
              <span
                className={`font-semibold flex items-center gap-1.5 ${
                  isOptimal ? "text-sage-wax" : "text-crimson-urgent"
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">
                  {isOptimal ? "check_circle" : "warning"}
                </span>
                {isOptimal
                  ? "Conflicto resuelto"
                  : `Aún quedarías con ${totalCalculated.toFixed(1).replace(".", ",")} h (límite ${dailyLimitHours.toFixed(1).replace(".", ",")} h)`}
              </span>

              <span
                className={`px-2 py-0.5 rounded-sharp font-stamp text-[10px] font-bold ${
                  isOptimal
                    ? "bg-sage-light text-sage-wax border border-sage-wax/20"
                    : "bg-crimson-paper text-crimson-urgent border border-crimson-urgent/30"
                }`}
              >
                {isOptimal ? "0,0 H EXCESO" : `+${excess.toFixed(1).replace(".", ",")} H EXCESO`}
              </span>
            </div>

            <p className="font-body text-[11px] text-ink-muted mt-1">
              {currentHoursOnDay.toFixed(1).replace(".", ",")} h previas + {hours.toFixed(1).replace(".", ",")} h nueva ={" "}
              {totalCalculated.toFixed(1).replace(".", ",")} h total
            </p>

            {/* Barra de progreso */}
            <div className="relative h-2.5 w-full bg-paper-accent rounded-sharp overflow-hidden mt-2">
              <div
                style={{
                  width: `${Math.min(100, (totalCalculated / Math.max(dailyLimitHours, totalCalculated)) * 100)}%`,
                }}
                className={`h-full transition-all ${
                  isOptimal ? "bg-sage-wax" : "bg-terracotta"
                }`}
              />
            </div>
          </div>
        )}
        </div>

        {/* Acciones (fijo abajo) */}
        <div className="shrink-0 flex items-center justify-between pt-4 mt-3 border-t border-sepia-border">
          <button
            type="button"
            onClick={onBack}
            className="px-4 py-2 rounded-sharp bg-paper-base hover:bg-paper-linen border border-sepia-border text-ink-charcoal font-body text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-terracotta"
          >
            Volver
          </button>
          <button
            type="button"
            disabled={isSubmitting || isInvalidZero}
            onClick={handleConfirm}
            className={`px-5 py-2 rounded-sharp font-body text-xs font-semibold tracking-wide border shadow-sm transition-colors inline-flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-terracotta disabled:opacity-60 disabled:cursor-not-allowed ${
              isOptimal
                ? "bg-sage-wax hover:bg-[#2F422F] text-[#FAF6F0] border-[#2F422F]"
                : "bg-terracotta hover:bg-terracotta-dark text-[#FAF6F0] border-terracotta-dark"
            }`}
          >
            <span>
              {isSubmitting
                ? "Guardando…"
                : isOptimal
                ? "Confirmar cambio"
                : "Confirmar con aviso"}
            </span>
            <span aria-hidden="true">→</span>
          </button>
        </div>
      </div>
    </div>
  );
}
