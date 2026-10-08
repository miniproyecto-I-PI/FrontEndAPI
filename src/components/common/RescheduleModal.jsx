import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { toDateInputValue, validateTargetDateAgainstEvent, formatShortDate } from "../../utils/dateUtils";
import { useDailyLimit } from "../../hooks/useDailyLimit";
import { rescheduleGestion, updateSubtask } from "../../services/api";
import {
  evaluateConflict,
  findSuggestedAvailableDays,
  findNextAvailableDay,
  computeDayWorkload,
} from "../../services/workloadService";

import Toast from "./Toast";
import ConflictOverloadModal from "../reschedule/ConflictOverloadModal";
import SuggestedDaysSelector from "../reschedule/SuggestedDaysSelector";
import ReduceHoursModal from "../reschedule/ReduceHoursModal";
import ApiErrorRetryView from "../reschedule/ApiErrorRetryView";
import RescheduleSuccessModal from "../reschedule/RescheduleSuccessModal";

function wrapPortal(element) {
  return typeof document !== "undefined" ? createPortal(element, document.body) : element;
}

/**
 * RescheduleModal.jsx
 * ---------------------------------------------------------------------------
 * Coordinador integral del flujo de reprogramación y sobrecarga:
 * - US-06: Reprogramar subtarea logística con datepicker accesible y validaciones.
 * - US-07: Detección y advertencia de conflicto de sobrecarga diaria (role="alertdialog").
 * - US-08: Resolución mediante:
 *     1) Mover a otro día recomendado o manual.
 *     2) Reducir horas con recálculo dinámico.
 *     3) Posponer al próximo día disponible.
 *     4) Mantener de todos modos.
 * - Tolerancia a fallos: Pantalla de reintento reteniendo datos seleccionados.
 * - Confirmación de éxito con resumen comparativo.
 */
export default function RescheduleModal({
  mode = "single",
  count,
  gestion,
  currentDateISO,
  eventDateTime,
  allGestiones = [],
  onCancel,
  onConfirm,
}) {
  const { hours: dailyLimitHours, allowOverload } = useDailyLimit();

  // Estados del flujo:
  // 'PICK_DATE' | 'CONFLICT_ALERT' | 'SUGGESTED_DAYS' | 'REDUCE_HOURS' | 'API_ERROR' | 'SUCCESS'
  const [step, setStep] = useState("PICK_DATE");

  // Datos temporales
  const [targetDate, setTargetDate] = useState(() => toDateInputValue(currentDateISO) || toDateInputValue(new Date()));
  const [dateError, setDateError] = useState(null);
  const [localToast, setLocalToast] = useState(null);
  const [conflictData, setConflictData] = useState(null);
  const [lastAttempt, setLastAttempt] = useState(null); // { type: 'reschedule'|'reduce', value, label }
  const [apiErrorData, setApiErrorData] = useState(null);
  const [successData, setSuccessData] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const dateInputRef = useRef(null);
  const dialogRef = useRef(null);

  const taskHours = Number(gestion?.estimatedHours ?? gestion?.estimated_hours ?? 2);
  const gestionId = gestion?.id;
  const originalDateISO = toDateInputValue(currentDateISO || gestion?.targetDate);

  // Foco inicial
  useEffect(() => {
    if (step === "PICK_DATE") {
      if (mode === "single") {
        dateInputRef.current?.focus();
      } else {
        dialogRef.current?.focus();
      }
    }
  }, [step, mode]);

  // Tecla Escape para salir
  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onCancel?.();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  // Ejecución real de reprogramación de fecha
  async function executeDateReschedule(dateToSet, isOverride = false) {
    setIsSubmitting(true);
    setLastAttempt({
      type: "date",
      value: dateToSet,
      label: formatShortDate(dateToSet),
    });

    try {
      if (gestionId) {
        await rescheduleGestion(gestionId, dateToSet);
      }

      // Preparar resumen para modal de éxito
      const prevHours = computeDayWorkload(allGestiones, originalDateISO, gestionId);
      const newDayHours = computeDayWorkload(allGestiones, dateToSet, gestionId);
      const totalInNewDay = Math.round((newDayHours + taskHours) * 10) / 10;

      setSuccessData({
        title: isOverride ? "Fecha actualizada (Con sobrecarga)" : "Conflicto resuelto",
        description: `La gestión se ha movido al ${formatShortDate(dateToSet)}.`,
        previousDayLabel: formatShortDate(originalDateISO),
        previousDayHours: prevHours,
        newDayLabel: formatShortDate(dateToSet),
        newDayTotalHours: totalInNewDay,
        taskHours,
      });

      setStep("SUCCESS");
    } catch {
      setApiErrorData({
        title: "No se pudo aplicar el cambio",
        description: "Ocurrió un problema de conexión al intentar actualizar la fecha de esta gestión en el servidor.",
      });
      setStep("API_ERROR");
    } finally {
      setIsSubmitting(false);
    }
  }

  // Ejecución de ajuste de horas
  async function executeHoursReduction(newHours) {
    setIsSubmitting(true);
    setLastAttempt({
      type: "hours",
      value: newHours,
      label: `${newHours} h`,
    });

    try {
      if (gestionId) {
        await updateSubtask(gestionId, { estimatedHours: newHours });
      }

      const activeDateISO = targetDate || originalDateISO;
      const otherHours = computeDayWorkload(allGestiones, activeDateISO, gestionId);
      const newTotal = Math.round((otherHours + newHours) * 10) / 10;

      setSuccessData({
        title: "Horas actualizadas",
        description: `La estimación de la gestión ha cambiado a ${newHours}h.`,
        previousDayLabel: formatShortDate(activeDateISO),
        previousDayHours: Math.round((otherHours + taskHours) * 10) / 10,
        newDayLabel: formatShortDate(activeDateISO),
        newDayTotalHours: newTotal,
        taskHours: newHours,
      });

      setStep("SUCCESS");
    } catch {
      setApiErrorData({
        title: "No se pudo aplicar el cambio",
        description: "Ocurrió un problema de conexión al intentar actualizar la estimación en el servidor.",
      });
      setStep("API_ERROR");
    } finally {
      setIsSubmitting(false);
    }
  }

  // Validador y router inicial
  function handleInitialConfirm() {
    if (!targetDate) {
      const msg = "Ingresa una fecha válida";
      setDateError(msg);
      setLocalToast({ message: msg, intent: "error" });
      return;
    }

    if (mode === "single") {
      const afterEvent = validateTargetDateAgainstEvent(targetDate, eventDateTime);
      if (afterEvent) {
        setDateError(afterEvent);
        setLocalToast({ message: afterEvent, intent: "error" });
        return;
      }

      // Evaluar conflicto US-07
      const conflict = evaluateConflict({
        gestiones: allGestiones,
        targetDate,
        taskHours,
        dailyLimitHours,
        excludeGestionId: gestionId,
      });

      if (conflict.hasConflict) {
        setConflictData(conflict);
        setStep("CONFLICT_ALERT");
        return;
      }

      // Sin conflicto: guardar directamente
      executeDateReschedule(targetDate);
    } else {
      // Modo bulk
      onConfirm?.();
    }
  }

  // Opción "Posponer" desde conflicto
  function handlePostpone() {
    const nextDay = findNextAvailableDay({
      gestiones: allGestiones,
      taskHours,
      fromDate: targetDate || new Date(),
      dailyLimitHours,
      eventDate: eventDateTime,
      excludeGestionId: gestionId,
    });

    if (nextDay) {
      executeDateReschedule(nextDay.dateISO);
    } else {
      // Si no encuentra en el escaneo rápido, abrir selector de sugerencias/manual
      setStep("SUGGESTED_DAYS");
    }
  }

  // ---------------------------------------------------------------------------
  // RENDER SEGÚN ESTADO DE LA MÁQUINA DE ESTADOS
  // ---------------------------------------------------------------------------

  // 1. Pantalla de conflicto (Estado 5)
  if (step === "CONFLICT_ALERT" && conflictData) {
    const nextDay = findNextAvailableDay({
      gestiones: allGestiones,
      taskHours,
      fromDate: conflictData.targetDateISO,
      dailyLimitHours,
      eventDate: eventDateTime,
      excludeGestionId: gestionId,
    });

    const eventDateISO = eventDateTime ? toDateInputValue(eventDateTime) : null;
    const isAtOrAfterEventEnd = Boolean(
      eventDateISO && conflictData.targetDateISO && conflictData.targetDateISO >= eventDateISO
    );

    return wrapPortal(
      <ConflictOverloadModal
        conflict={conflictData}
        gestion={gestion}
        allowOverload={allowOverload}
        isEventEnd={isAtOrAfterEventEnd}
        nextAvailableDayLabel={
          nextDay?.shortLabel || (isAtOrAfterEventEnd ? "Evento finaliza este día" : "Ver sugerencias")
        }
        onChooseMove={() => setStep("SUGGESTED_DAYS")}
        onChooseReduce={() => setStep("REDUCE_HOURS")}
        onChoosePostpone={handlePostpone}
        onKeepAnyway={() => executeDateReschedule(conflictData.targetDateISO, true)}
        onCancel={() => setStep("PICK_DATE")}
      />
    );
  }

  // 2. Mover a otro día / Días sugeridos (Estados 1 y 2)
  if (step === "SUGGESTED_DAYS") {
    const suggestions = findSuggestedAvailableDays({
      gestiones: allGestiones,
      taskHours,
      fromDate: targetDate || new Date(),
      dailyLimitHours,
      eventDate: eventDateTime,
      excludeGestionId: gestionId,
    });

    return wrapPortal(
      <SuggestedDaysSelector
        suggestedDays={suggestions}
        currentDateISO={targetDate}
        eventDateTime={eventDateTime}
        taskHours={taskHours}
        dailyLimitHours={dailyLimitHours}
        isSubmitting={isSubmitting}
        onConfirmDate={(newDate) => executeDateReschedule(newDate)}
        onBack={() => setStep(conflictData ? "CONFLICT_ALERT" : "PICK_DATE")}
      />
    );
  }

  // 3. Reducir horas estimadas (Estado 6 y 7 de horas)
  if (step === "REDUCE_HOURS") {
    const activeDate = conflictData?.targetDateISO || targetDate;
    const currentOnDay = computeDayWorkload(allGestiones, activeDate, gestionId);

    return wrapPortal(
      <ReduceHoursModal
        gestion={gestion}
        targetDateISO={activeDate}
        currentHoursOnDay={currentOnDay}
        dailyLimitHours={dailyLimitHours}
        isSubmitting={isSubmitting}
        onConfirmHours={(newHours) => executeHoursReduction(newHours)}
        onBack={() => setStep("CONFLICT_ALERT")}
      />
    );
  }

  // 4. Error de API con reintento (Estado 3 y 7 de reintento)
  if (step === "API_ERROR") {
    return wrapPortal(
      <ApiErrorRetryView
        title={apiErrorData?.title}
        description={apiErrorData?.description}
        retainedType={lastAttempt?.type}
        retainedValue={lastAttempt?.value}
        retainedLabel={lastAttempt?.label}
        onBack={() => setStep("PICK_DATE")}
        onRetry={async () => {
          if (lastAttempt?.type === "hours") {
            await executeHoursReduction(lastAttempt.value);
          } else {
            await executeDateReschedule(lastAttempt.value);
          }
        }}
      />
    );
  }

  // 5. Éxito de confirmación (Estado 4)
  if (step === "SUCCESS" && successData) {
    return wrapPortal(
      <RescheduleSuccessModal
        title={successData.title}
        description={successData.description}
        previousDayLabel={successData.previousDayLabel}
        previousDayHours={successData.previousDayHours}
        newDayLabel={successData.newDayLabel}
        newDayTotalHours={successData.newDayTotalHours}
        taskHours={successData.taskHours}
        dailyLimitHours={dailyLimitHours}
        onClose={() => {
          onConfirm?.(lastAttempt?.value);
        }}
      />
    );
  }

  // ---------------------------------------------------------------------------
  // 6. Selector de fecha inicial (PICK_DATE) y Modo Bulk
  // ---------------------------------------------------------------------------
  const canConfirm = mode !== "single" || Boolean(targetDate);

  return wrapPortal(
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="reschedule-title"
      tabIndex={-1}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-charcoal/40 backdrop-blur-sm focus:outline-none"
      onClick={(e) => e.target === e.currentTarget && onCancel?.()}
    >
      <div className="relative w-full max-w-md bg-paper-card border border-sepia-border rounded-sharp p-6 shadow-xl warm-card-shadow">
        {mode === "bulk" ? (
          <>
            <h3 id="reschedule-title" className="font-heading text-2xl font-bold text-ink-charcoal">
              ¿Reprogramar las {count} gestiones vencidas?
            </h3>
            <p className="font-body text-sm text-ink-muted mt-2 leading-relaxed">
              Se moverán a la bandeja de pendientes para asignarles una nueva fecha desde el detalle de cada evento.
            </p>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between text-ink-muted font-stamp text-[11px] font-bold uppercase mb-1">
              <span>Reprogramar gestión</span>
              <span>Duración: {taskHours}h</span>
            </div>
            <h3 id="reschedule-title" className="font-heading text-xl md:text-2xl font-bold text-ink-charcoal leading-snug">
              {gestion?.title || "Gestión logística"}
            </h3>

            <label className="block mt-4">
              <span className="font-body text-xs font-medium text-ink-muted">
                Nueva fecha límite
              </span>
              <input
                ref={dateInputRef}
                type="date"
                value={targetDate}
                onChange={(e) => {
                  setTargetDate(e.target.value);
                  setDateError(null);
                  if (localToast) setLocalToast(null);
                }}
                aria-invalid={Boolean(dateError)}
                aria-describedby={!canConfirm || dateError ? "reschedule-hint" : undefined}
                className={`mt-1 w-full border rounded-sharp px-3 py-2 font-body text-sm text-ink-charcoal focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-paper-card ${
                  dateError
                    ? "border-crimson-urgent ring-1 ring-crimson-urgent focus:border-crimson-urgent focus:ring-crimson-urgent text-crimson-urgent"
                    : "border-sepia-border focus:border-terracotta focus:ring-terracotta"
                }`}
              />
              {(!canConfirm || dateError) && (
                <p id="reschedule-hint" role="alert" className="mt-1.5 font-body text-xs text-crimson-urgent flex items-center gap-1 font-medium">
                  <span className="material-symbols-outlined text-[14px]">error</span>
                  <span>{dateError || "Elige una fecha para poder confirmar."}</span>
                </p>
              )}
            </label>

            <p className="font-body text-[11px] text-ink-subtle mt-3 italic">
              💡 Verificaremos tu capacidad diaria disponible antes de confirmar.
            </p>
          </>
        )}

        <div className="flex items-center justify-end gap-2.5 pt-6 mt-2 border-t border-sepia-border/60">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-sharp bg-paper-base hover:bg-paper-linen border border-sepia-border text-ink-charcoal font-body text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-terracotta focus:ring-offset-1"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleInitialConfirm}
            disabled={!canConfirm || isSubmitting}
            className="px-5 py-2 rounded-sharp bg-terracotta hover:bg-terracotta-dark text-[#FAF6F0] font-body text-xs font-semibold tracking-wide border border-terracotta-dark shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-terracotta focus:ring-offset-1 disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center gap-1.5"
          >
            <span>{isSubmitting ? "Verificando…" : "Confirmar"}</span>
          </button>
        </div>
      </div>

      {localToast && (
        <Toast toast={localToast} onClose={() => setLocalToast(null)} />
      )}
    </div>
  );
}
