import { useEffect, useRef } from "react";
import { formatFullDate } from "../../utils/dateUtils";

/**
 * ConflictOverloadModal.jsx
 * ---------------------------------------------------------------------------
 * US-07 — "Detectar conflicto por sobrecarga diaria al reprogramar gestiones"
 * Vista escritorio / móvil (ancho 560px, tono advertencia cálido).
 *
 * Accesibilidad (TS-06 / a11y):
 * - role="alertdialog" anunciado para lectores de pantalla
 * - aria-labelledby y aria-describedby
 * - Foco inicial gestionado en la primera opción de resolución
 * - Escape para cancelar
 */
export default function ConflictOverloadModal({
  conflict,
  gestion,
  allowOverload = false,
  onChooseMove,
  onChooseReduce,
  onChoosePostpone,
  onKeepAnyway,
  onCancel,
  nextAvailableDayLabel = "Viernes 10",
  isEventEnd = false,
}) {
  const dialogRef = useRef(null);
  const firstActionRef = useRef(null);

  const { targetDateISO, currentHours = 0, taskHours = 0, totalHours = 0, limitHours = 6, excessHours = 0 } =
    conflict || {};

  // Formato de fecha para subtítulo
  const formattedDay = targetDateISO
    ? formatFullDate(new Date(`${targetDateISO}T00:00:00`))
    : "Ese día";

  useEffect(() => {
    firstActionRef.current?.focus();
  }, []);

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "Escape") {
        onCancel?.();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onCancel]);

  // Proporciones para la barra segmentada
  // La barra representa el total de horas, mostrando la línea del límite
  const maxBarHours = Math.max(limitHours, totalHours);
  const prevPercent = maxBarHours > 0 ? (currentHours / maxBarHours) * 100 : 0;
  const newPercent = maxBarHours > 0 ? (taskHours / maxBarHours) * 100 : 0;
  const limitLinePercent = maxBarHours > 0 ? (limitHours / maxBarHours) * 100 : 100;

  return (
    <div
      ref={dialogRef}
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="conflict-title"
      aria-describedby="conflict-desc"
      tabIndex={-1}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-ink-charcoal/40 backdrop-blur-sm focus:outline-none overflow-y-auto"
      onClick={(e) => e.target === e.currentTarget && onCancel?.()}
    >
      <div className="relative w-full max-w-[560px] max-h-[92vh] bg-paper-card border border-sepia-border rounded-sharp p-5 sm:p-6 md:p-7 shadow-xl warm-card-shadow flex flex-col my-auto">
        <div className="overflow-y-auto flex-1 pr-1.5 -mr-1 space-y-4">
          {/* Eyebrow de advertencia */}
          <div className="flex items-center gap-1.5 text-crimson-urgent font-stamp text-[11px] font-bold tracking-wider uppercase mb-1">
            <span className="material-symbols-outlined text-[17px]" aria-hidden="true">
              warning
            </span>
            <span>Capacidad diaria excedida</span>
          </div>

          {/* Título de conflicto */}
          <h2
            id="conflict-title"
            className="font-heading text-xl md:text-2xl font-bold text-ink-charcoal tracking-tight"
          >
            Quedarías con {totalHours}h de gestión planificadas (límite {limitHours}h)
          </h2>

        {/* Subtítulo descriptivo */}
        <p id="conflict-desc" className="font-body text-xs md:text-sm text-ink-muted mt-1 leading-relaxed">
          {formattedDay} ya tiene {currentHours}h planificadas y{" "}
          {gestion?.title ? <strong className="text-ink-charcoal">«{gestion.title}»</strong> : "esta gestión"}{" "}
          suma {taskHours}h.
        </p>

        {/* Tarjeta de desglose visual de capacidad */}
        <div className="mt-4 p-3.5 bg-paper-linen/60 border border-sepia-border rounded-sharp">
          <div className="flex items-center justify-between text-xs font-body mb-2">
            <span className="text-ink-charcoal font-medium">
              {formattedDay} · Límite sugerido: <strong className="font-semibold">{limitHours}h</strong>
            </span>
            <span className="px-2 py-0.5 rounded-sharp bg-crimson-paper border border-crimson-urgent/30 text-crimson-urgent font-stamp text-[10px] font-bold">
              Total: {totalHours}h (+{excessHours}h de exceso)
            </span>
          </div>

          {/* Barra de progreso segmentada */}
          <div className="relative h-4 w-full bg-paper-accent rounded-sharp overflow-hidden flex">
            {/* Tramo 1: Horas previas */}
            <div
              style={{ width: `${prevPercent}%` }}
              className="h-full bg-sepia-dark transition-all flex items-center justify-center text-[9px] text-[#FAF6F0] font-stamp"
              title={`${currentHours}h previas`}
            >
              {currentHours >= 1 && `${currentHours}h`}
            </div>
            {/* Tramo 2: Horas nueva gestión */}
            <div
              style={{ width: `${newPercent}%` }}
              className="h-full bg-terracotta transition-all flex items-center justify-center text-[9px] text-[#FAF6F0] font-stamp"
              title={`+${taskHours}h nueva`}
            >
              +{taskHours}h
            </div>

            {/* Marcador del límite sugerido */}
            <div
              style={{ left: `${limitLinePercent}%` }}
              className="absolute top-0 bottom-0 w-0.5 bg-crimson-urgent z-10"
              title={`Límite: ${limitHours}h`}
            />
          </div>

          {/* Leyenda */}
          <div className="flex flex-wrap items-center justify-between gap-2 mt-2 pt-1 font-body text-[11px] text-ink-muted">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-sepia-dark shrink-0" />
              {currentHours}h ya programadas en agenda
            </span>
            <span className="inline-flex items-center gap-1.5 text-crimson-urgent font-medium">
              <span className="w-2 h-2 rounded-full bg-crimson-urgent shrink-0" />
              Supera el límite de {limitHours}h por {excessHours}h
            </span>
          </div>
        </div>

        {/* Sección de alternativas de resolución */}
        <div className="mt-5">
          <p className="font-stamp text-[11px] uppercase tracking-wider text-ink-muted font-bold mb-2.5">
            ¿Cómo prefieres resolver la sobrecarga?
          </p>

          <div className="space-y-2">
            {/* Opción 1: Mover a otro día */}
            <button
              ref={firstActionRef}
              type="button"
              onClick={onChooseMove}
              className="w-full text-left p-3 rounded-sharp border border-sepia-border bg-paper-card hover:bg-paper-linen/80 transition-colors flex items-center justify-between gap-3 group focus:outline-none focus:ring-2 focus:ring-terracotta"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="p-2 rounded-sharp bg-paper-base border border-sepia-border text-ink-muted group-hover:text-terracotta transition-colors">
                  <span className="material-symbols-outlined text-[18px]">calendar_month</span>
                </span>
                <div>
                  <h3 className="font-body text-xs md:text-sm font-bold text-ink-charcoal">
                    Mover a otro día
                  </h3>
                  <p className="font-body text-[11px] text-ink-muted">
                    Elige una fecha con disponibilidad garantizada
                  </p>
                </div>
              </div>
              <span className="font-body text-xs font-semibold text-terracotta flex items-center gap-1 shrink-0">
                Elegir fecha <span aria-hidden="true">→</span>
              </span>
            </button>

            {/* Opción 2: Reducir horas estimadas */}
            <button
              type="button"
              onClick={onChooseReduce}
              className="w-full text-left p-3 rounded-sharp border border-sepia-border bg-paper-card hover:bg-paper-linen/80 transition-colors flex items-center justify-between gap-3 group focus:outline-none focus:ring-2 focus:ring-terracotta"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="p-2 rounded-sharp bg-paper-base border border-sepia-border text-ink-muted group-hover:text-terracotta transition-colors">
                  <span className="material-symbols-outlined text-[18px]">schedule</span>
                </span>
                <div>
                  <h3 className="font-body text-xs md:text-sm font-bold text-ink-charcoal">
                    Reducir horas estimadas
                  </h3>
                  <p className="font-body text-[11px] text-ink-muted">
                    Ajusta cuánto tiempo tomará esta gestión
                  </p>
                </div>
              </div>
              <span className="font-body text-xs font-semibold text-terracotta flex items-center gap-1 shrink-0">
                Ajustar <span aria-hidden="true">→</span>
              </span>
            </button>

            {/* Opción 3: Posponer */}
            <button
              type="button"
              onClick={onChoosePostpone}
              className="w-full text-left p-3 rounded-sharp border border-sepia-border bg-paper-card hover:bg-paper-linen/80 transition-colors flex items-center justify-between gap-3 group focus:outline-none focus:ring-2 focus:ring-terracotta"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="p-2 rounded-sharp bg-paper-base border border-sepia-border text-ink-muted group-hover:text-terracotta transition-colors">
                  <span className="material-symbols-outlined text-[18px]">fast_forward</span>
                </span>
                <div>
                  <h3 className="font-body text-xs md:text-sm font-bold text-ink-charcoal">
                    Posponer
                  </h3>
                  <p className="font-body text-[11px] text-ink-muted">
                    {isEventEnd
                      ? "Fecha límite de evento alcanzada"
                      : "La enviamos al próximo día con espacio"}
                  </p>
                </div>
              </div>
              <span className="font-body text-xs font-semibold text-terracotta flex items-center gap-1 shrink-0">
                {nextAvailableDayLabel} <span aria-hidden="true">→</span>
              </span>
            </button>
          </div>
        </div>
        </div>

        {/* Footer con acciones de cierre (fijo abajo) */}
        <div className="shrink-0 flex flex-wrap items-center justify-between gap-2.5 pt-4 mt-3 border-t border-sepia-border">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-sharp bg-paper-base hover:bg-paper-linen border border-sepia-border text-ink-charcoal font-body text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-terracotta"
          >
            Cancelar
          </button>
          {allowOverload ? (
            <button
              type="button"
              onClick={onKeepAnyway}
              className="px-4 py-2 rounded-sharp bg-paper-card hover:bg-paper-linen border border-sepia-border text-ink-muted hover:text-ink-charcoal font-body text-xs font-medium transition-colors inline-flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-terracotta"
            >
              <span className="material-symbols-outlined text-[15px]">check</span>
              <span>Mantener de todos modos</span>
            </button>
          ) : (
            <span
              className="font-body text-[11px] text-ink-muted bg-paper-linen/80 px-2.5 py-1.5 rounded-sharp border border-sepia-border inline-flex items-center gap-1.5"
              title="Tu configuración prohíbe sobrepasar el límite diario. Elige una de las acciones de arriba para continuar."
            >
              <span className="material-symbols-outlined text-[14px] text-ink-muted" aria-hidden="true">lock</span>
              <span>Sobrecarga no permitida según configuración</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
