import { useNavigate } from "react-router-dom";

/**
 * CreateSubtaskSuccessModal.jsx
 * Modal de éxito post-create de una gestión (US-02).
 * Muestra el título de la subtarea creada y ofrece dos salidas:
 *   - "Volver a Hoy"       → /hoy
 *   - "Ver hoja de ruta"   → /evento/:id
 *
 * @param {string} subtaskTitle
 * @param {string} eventId
 * @param {() => void} onClose
 */
export default function CreateSubtaskSuccessModal({
  subtaskTitle,
  eventId,
  onClose,
}) {
  const navigate = useNavigate();

  function handleGoToday() {
    onClose?.();
    navigate("/hoy", { state: { toast: "Gestión creada" } });
  }

  function handleGoToEvent() {
    onClose?.();
    navigate(`/evento/${eventId}`, { state: { toast: "Gestión creada" } });
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-subtask-success-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-charcoal/45 backdrop-blur-[2px]"
      onClick={(e) => e.target === e.currentTarget && handleGoToEvent()}
    >
      <div className="bg-paper-card border border-sepia-border rounded-sharp w-full max-w-[500px] shadow-2xl relative overflow-hidden flex flex-col">
        {/* Top terracotta accent */}
        <div className="w-full h-1 bg-terracotta" />

        <button
          type="button"
          onClick={handleGoToEvent}
          aria-label="Cerrar ventana"
          className="absolute top-3.5 right-3.5 text-ink-muted hover:text-ink-charcoal p-1 transition-colors rounded-sharp"
        >
          <span className="material-symbols-outlined text-[18px]">close</span>
        </button>

        <div className="p-7 md:p-8 flex flex-col items-center text-center">
          {/* Icon */}
          <div className="w-14 h-14 rounded-full bg-terracotta-light/60 border border-sepia-border flex items-center justify-center mb-4 text-terracotta shadow-sm">
            <span className="material-symbols-outlined text-[28px]">
              verified
            </span>
          </div>

          <h2
            id="create-subtask-success-title"
            className="font-serif text-2xl md:text-[28px] font-bold text-ink-charcoal leading-tight mb-3"
          >
            ¡Gestión creada con éxito!
          </h2>

          <p className="text-sm text-ink-muted leading-relaxed max-w-sm mb-6 font-body">
            La subtarea{" "}
            <strong className="font-semibold text-ink-charcoal">
              «{subtaskTitle}»
            </strong>{" "}
            ha sido programada en la hoja de ruta del evento y sincronizada con
            la vista de hoy.
          </p>

          <div className="w-full flex flex-col-reverse sm:flex-row items-center gap-3">
            <button
              type="button"
              onClick={handleGoToday}
              className="w-full sm:w-1/2 px-4 py-2.5 bg-paper-base hover:bg-paper-linen border border-sepia-border text-ink-charcoal font-body text-xs font-semibold rounded-sharp text-center transition-colors"
            >
              ← Volver a Hoy
            </button>
            <button
              type="button"
              onClick={handleGoToEvent}
              className="w-full sm:w-1/2 px-4 py-2.5 bg-terracotta hover:bg-terracotta-dark text-[#FAF6F0] font-body text-xs font-semibold rounded-sharp text-center shadow-sm flex items-center justify-center gap-1.5 transition-colors"
            >
              <span>Ver hoja de ruta</span>
              <span className="material-symbols-outlined text-[14px]">
                arrow_forward
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}