import { useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

/**
 * RescheduleSuccessModal.jsx
 * ---------------------------------------------------------------------------
 * Pantalla de confirmación de éxito (Estado 4 de la guía visual).
 * Muestra el balance óptimo y comparativa entre la fecha anterior y la nueva.
 */
export default function RescheduleSuccessModal({
  title = "Gestión reprogramada",
  description,
  previousDayLabel,
  previousDayHours = 0,
  newDayLabel,
  newDayTotalHours = 0,
  taskHours = 2,
  dailyLimitHours = 6,
  onClose,
}) {
  const navigate = useNavigate();
  const buttonRef = useRef(null);
  const freeRemaining = Math.max(0, Math.round((dailyLimitHours - newDayTotalHours) * 10) / 10);

  const handleAction = useCallback(() => {
    onClose?.();
    navigate("/hoy");
  }, [navigate, onClose]);

  useEffect(() => {
    // Foco inicial en el botón principal para accesibilidad
    buttonRef.current?.focus();

    function handleKeyDown(e) {
      if (e.key === "Enter" || e.key === "Escape") {
        e.preventDefault();
        handleAction();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleAction]);

  const defaultDescription =
    description ||
    `La gestión se ha movido al ${newDayLabel || "nuevo día"}. Tu agenda ahora cumple con la carga recomendada sin sobrepasar las ${dailyLimitHours} horas diarias.`;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="success-reschedule-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-charcoal/40 backdrop-blur-sm focus:outline-none"
    >
      <div className="relative w-full max-w-[520px] bg-paper-card border border-sepia-border rounded-sharp p-6 md:p-8 shadow-xl warm-card-shadow text-center overflow-hidden">
        {/* Barra superior verde */}
        <div className="absolute top-0 inset-x-0 h-1 bg-sage-wax" />

        {/* Ícono de éxito circular */}
        <div className="w-14 h-14 rounded-full bg-sage-light border border-sage-wax/30 mx-auto flex items-center justify-center text-sage-wax mb-3">
          <span className="material-symbols-outlined text-[32px]">check</span>
        </div>

        <span className="font-stamp text-[11px] font-bold tracking-wider text-sage-wax uppercase block mb-1">
          Actualización exitosa
        </span>

        <h2 id="success-reschedule-title" className="font-heading text-2xl font-bold text-ink-charcoal">
          {title}
        </h2>

        <p className="font-body text-xs md:text-sm text-ink-muted mt-2 max-w-md mx-auto leading-relaxed">
          {defaultDescription}
        </p>

        {/* Comparativa en 2 columnas */}
        <div className="mt-5 p-4 bg-paper-linen/60 border border-sepia-border rounded-sharp grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
          {/* Columna anterior */}
          <div className="pr-0 sm:pr-3 sm:border-r sm:border-sepia-border">
            <p className="font-stamp text-[10px] uppercase font-bold text-ink-muted">
              {previousDayLabel || "Fecha previa"} (Anterior):
            </p>
            <p className="font-body text-sm font-bold text-ink-charcoal mt-0.5">
              {previousDayHours}h programadas
            </p>
            <p className="font-body text-[11px] text-sage-wax font-medium mt-1 inline-flex items-center gap-1">
              <span>✓</span> Dentro del límite ({dailyLimitHours}h)
            </p>
          </div>

          {/* Columna nueva fecha */}
          <div className="pt-2 sm:pt-0 sm:pl-3 border-t sm:border-t-0 border-sepia-border">
            <p className="font-stamp text-[10px] uppercase font-bold text-ink-muted">
              {newDayLabel || "Nueva fecha"} (Nueva fecha):
            </p>
            <p className="font-body text-sm font-bold text-ink-charcoal mt-0.5">
              {newDayTotalHours}h en total <span className="text-terracotta text-xs font-semibold">(+{taskHours}h)</span>
            </p>
            <p className="font-body text-[11px] text-sage-wax font-medium mt-1 inline-flex items-center gap-1">
              <span>✓</span> {freeRemaining}h libres restantes
            </p>
          </div>
        </div>

        <div className="mt-6 pt-2">
          <button
            ref={buttonRef}
            type="button"
            onClick={handleAction}
            className="w-full py-2.5 px-4 rounded-sharp bg-terracotta hover:bg-terracotta-dark text-[#FAF6F0] font-body text-xs md:text-sm font-semibold tracking-wide border border-terracotta-dark shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-terracotta"
          >
            Entendido, ir a la agenda de hoy
          </button>
        </div>
      </div>
    </div>
  );
}
