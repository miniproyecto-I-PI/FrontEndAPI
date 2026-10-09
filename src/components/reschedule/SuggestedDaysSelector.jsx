import { useState } from "react";
import { formatFullDate, formatShortDate, toDateInputValue, validateTargetDateAgainstEvent } from "../../utils/dateUtils";
import { useDailyLimit } from "../../hooks/useDailyLimit";

/**
 * SuggestedDaysSelector.jsx
 * ---------------------------------------------------------------------------
 * US-08: Resolución inteligente moviendo a otro día (Estados 1 y 2).
 * Estado 1: Lista de días recomendados con espacio libre.
 * Estado 2: Sin días sugeridos disponibles (selección manual de fecha o evento finalizado).
 */
export default function SuggestedDaysSelector({
  suggestedDays = [],
  currentDateISO,
  eventDateTime,
  taskHours = 2,
  dailyLimitHours = 6,
  onConfirmDate,
  onBack,
  isSubmitting = false,
}) {
  const { allowSubtasksAfterEvent, allowOverdueSubtasks } = useDailyLimit();
  const [selectedDate, setSelectedDate] = useState(() => {
    if (suggestedDays.length > 0) return suggestedDays[0].dateISO;
    return toDateInputValue(currentDateISO) || toDateInputValue(new Date());
  });

  const [isManualExpanded, setIsManualExpanded] = useState(() => suggestedDays.length === 0);
  const [manualDate, setManualDate] = useState(() => toDateInputValue(currentDateISO) || toDateInputValue(new Date()));
  const [validationError, setValidationError] = useState("");

  const hasSuggestions = suggestedDays.length > 0;
  const activeDate = isManualExpanded ? manualDate : selectedDate;

  const eventDateISO = eventDateTime ? toDateInputValue(eventDateTime) : null;
  const currentISO = toDateInputValue(currentDateISO);
  const isAtOrAfterEventEnd = Boolean(eventDateISO && currentISO && currentISO >= eventDateISO);
  const eventDateFormatted = eventDateTime ? formatShortDate(eventDateTime) : "";

  // Validación contra la fecha del evento
  function handleSelectManual(newDate) {
    setManualDate(newDate);
    setValidationError("");
  }

  function handleConfirm() {
    if (!activeDate) {
      setValidationError("Ingresa una fecha válida");
      return;
    }

    const todayISO = toDateInputValue(new Date());
    if (!allowOverdueSubtasks && activeDate < todayISO) {
      setValidationError("La fecha objetivo no puede ser anterior a hoy.");
      return;
    }

    if (!allowSubtasksAfterEvent) {
      const eventError = validateTargetDateAgainstEvent(activeDate, eventDateTime);
      if (eventError) {
        setValidationError(eventError);
        return;
      }
    }

    onConfirmDate(activeDate);
  }

  const formattedSelectedDay = activeDate
    ? formatFullDate(new Date(`${activeDate}T00:00:00`))
    : "";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="choose-day-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-ink-charcoal/40 backdrop-blur-sm focus:outline-none overflow-y-auto"
      onClick={(e) => e.target === e.currentTarget && onBack?.()}
    >
      <div className="relative w-full max-w-[540px] max-h-[92vh] bg-paper-card border border-sepia-border rounded-sharp p-5 sm:p-6 md:p-7 shadow-xl warm-card-shadow flex flex-col my-auto">
        {/* Header con stamp (fijo) */}
        <div className="shrink-0">
          <div className="flex items-center justify-between text-ink-muted font-stamp text-[11px] font-bold uppercase mb-1">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px]">
                {hasSuggestions ? "calendar_today" : isAtOrAfterEventEnd ? "event_busy" : "info"}
              </span>
              <span>
                {hasSuggestions
                  ? "Resolución de carga"
                  : isAtOrAfterEventEnd
                  ? "Fin de evento alcanzado"
                  : "Disponibilidad agotada"}
              </span>
            </div>
            <span>Gestión: {taskHours}h requeridas</span>
          </div>

          <h2 id="choose-day-title" className="font-heading text-xl md:text-2xl font-bold text-ink-charcoal">
            Elige otro día
          </h2>

          {hasSuggestions ? (
            <p className="font-body text-xs md:text-sm text-ink-muted mt-1 leading-relaxed">
              Te sugerimos los días más cercanos con disponibilidad suficiente para absorber las {taskHours}h de esta
              gestión sin superar tu límite diario.
            </p>
          ) : isAtOrAfterEventEnd ? (
            <div className="mt-3.5 p-3.5 bg-crimson-paper/50 border border-crimson-urgent/30 rounded-sharp flex items-start gap-3">
              <span className="material-symbols-outlined text-crimson-urgent text-[20px] shrink-0 mt-0.5">
                event_busy
              </span>
              <div>
                <h3 className="font-body text-xs font-bold text-crimson-urgent">
                  No hay más fechas disponibles: el evento habrá finalizado
                </h3>
                <p className="font-body text-[11px] text-ink-charcoal mt-0.5 leading-relaxed">
                  Esta gestión ya está programada para la fecha límite del evento ({eventDateFormatted}). No es posible posponerla a fechas posteriores porque el evento ya habrá concluido.
                </p>
              </div>
            </div>
          ) : (
            <div className="mt-3.5 p-3.5 bg-paper-linen/70 border border-sepia-border rounded-sharp flex items-start gap-3">
              <span className="material-symbols-outlined text-ink-muted text-[20px] shrink-0 mt-0.5">
                calendar_month
              </span>
              <div>
                <h3 className="font-body text-xs font-bold text-ink-charcoal">
                  {eventDateISO
                    ? "No hay fechas disponibles antes del cierre del evento"
                    : "No encontramos días con espacio en tu agenda"}
                </h3>
                <p className="font-body text-[11px] text-ink-muted mt-0.5 leading-relaxed">
                  {eventDateISO
                    ? `Todos los días previos a la fecha límite del evento (${eventDateFormatted}) han alcanzado tu límite diario de ${dailyLimitHours} horas de dedicación.`
                    : `Tu agenda para los próximos 7 días ya ha alcanzado el límite diario de ${dailyLimitHours} horas de dedicación.`}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Cuerpo desplazable */}
        <div className="overflow-y-auto flex-1 pr-1.5 -mr-1 mt-3 space-y-3">
          {/* Sección de sugerencias (Estado 1) */}
          {hasSuggestions && (
            <div className="space-y-2.5">
              <p className="font-stamp text-[11px] uppercase tracking-wider text-ink-muted font-bold">
                Días recomendados con disponibilidad:
              </p>

            <div className="space-y-2">
              {suggestedDays.map((day) => {
                const isSelected = selectedDate === day.dateISO && !isManualExpanded;
                return (
                  <label
                    key={day.dateISO}
                    className={`block p-3 rounded-sharp border cursor-pointer transition-all ${
                      isSelected
                        ? "border-terracotta bg-terracotta-light/40 shadow-sm ring-1 ring-terracotta"
                        : "border-sepia-border bg-paper-card hover:bg-paper-linen/60"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <input
                          type="radio"
                          name="suggested-day"
                          checked={isSelected}
                          onChange={() => {
                            setSelectedDate(day.dateISO);
                            setIsManualExpanded(false);
                            setValidationError("");
                          }}
                          className="h-4 w-4 text-terracotta accent-terracotta cursor-pointer"
                        />
                        <div className="flex items-center gap-2">
                          <span className="font-body text-xs md:text-sm font-bold text-ink-charcoal">
                            {day.shortLabel}
                          </span>
                          {isSelected && (
                            <span className="px-1.5 py-0.5 rounded-sharp bg-terracotta text-[#FAF6F0] font-stamp text-[9px] font-bold">
                              Seleccionado
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sharp bg-sage-light text-sage-wax font-stamp text-[10px] font-bold border border-sage-wax/20">
                          ● {day.freeHours}h libres
                        </span>
                        <p className="font-body text-[10px] text-ink-muted mt-0.5">
                          Quedarían {day.remainingHoursAfter}h libres
                        </p>
                      </div>
                    </div>
                    <p className="font-body text-[11px] text-ink-muted mt-1.5 pl-6">
                      {day.description}
                    </p>
                  </label>
                );
              })}
            </div>

            {/* Selector manual colapsable */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setIsManualExpanded((prev) => !prev)}
                className="w-full py-2 px-3 rounded-sharp border border-dashed border-sepia-border bg-paper-base/50 hover:bg-paper-linen flex items-center justify-between font-body text-xs text-ink-muted hover:text-ink-charcoal transition-colors"
              >
                <span className="inline-flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px]">event</span>
                  <span>Elegir otra fecha</span>
                </span>
                <span className="material-symbols-outlined text-[16px]">
                  {isManualExpanded ? "expand_less" : "expand_more"}
                </span>
              </button>
            </div>
          </div>
        )}

        {/* Formulario manual (Estado 2 o colapsable expandido) */}
        {(!hasSuggestions || isManualExpanded) && (
          <div className="mt-4 p-3.5 bg-paper-base/60 border border-sepia-border rounded-sharp space-y-3">
            <label className="block">
              <span className="font-stamp text-[11px] uppercase tracking-wider text-ink-muted font-bold block mb-1">
                Selección manual de fecha:
              </span>
              <input
                type="date"
                min={allowOverdueSubtasks ? undefined : toDateInputValue(new Date())}
                value={manualDate}
                onChange={(e) => handleSelectManual(e.target.value)}
                className="w-full border border-sepia-border rounded-sharp px-3 py-2 font-body text-sm text-ink-charcoal bg-paper-card focus:outline-none focus:border-terracotta focus:ring-2 focus:ring-terracotta"
              />
            </label>

            {formattedSelectedDay && (
              <div className="flex items-center justify-between text-xs font-body text-ink-muted">
                <span>Día seleccionado: <strong className="text-ink-charcoal">{formattedSelectedDay}</strong></span>
                <span className="px-2 py-0.5 rounded-sharp bg-sage-light text-sage-wax font-stamp text-[10px] font-bold">
                  Agenda abierta
                </span>
              </div>
            )}

            <p className="font-body text-[11px] text-ink-subtle italic">
              💡 Nota: Al elegir una fecha manual, comprobaremos la carga disponible automáticamente al guardar.
            </p>
          </div>
        )}

        {validationError && (
          <p role="alert" className="mt-3 text-crimson-urgent font-body text-xs">
            {validationError}
          </p>
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
            disabled={isSubmitting || !activeDate}
            onClick={handleConfirm}
            className="px-5 py-2 rounded-sharp bg-terracotta hover:bg-terracotta-dark disabled:opacity-60 text-[#FAF6F0] font-body text-xs font-semibold tracking-wide border border-terracotta-dark shadow-sm transition-colors inline-flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-terracotta disabled:cursor-not-allowed"
          >
            <span>{isSubmitting ? "Guardando…" : "Mover gestión"}</span>
            <span aria-hidden="true">→</span>
          </button>
        </div>
      </div>
    </div>
  );
}
