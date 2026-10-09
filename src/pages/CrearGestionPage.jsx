import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import CreateSubtaskSuccessModal from "../components/common/CreateSubtaskSuccessModal";
import { useEventSubtasks } from "../hooks/useEventSubtasks";
import { useDailyLimit } from "../hooks/useDailyLimit";
import { getToday } from "../services/api";
import {
  evaluateConflict,
  findSuggestedAvailableDays,
  findNextAvailableDay,
} from "../services/workloadService";
import ConflictOverloadModal from "../components/reschedule/ConflictOverloadModal";
import SuggestedDaysSelector from "../components/reschedule/SuggestedDaysSelector";
import ReduceHoursModal from "../components/reschedule/ReduceHoursModal";
import Toast from "../components/common/Toast";
import StateCard from "../components/common/StateCard";
import PageContainer from "../components/layout/PageContainer";
import PageHeader, { Breadcrumb } from "../components/layout/PageHeader";
import { formatShortDate, toDateInputValue, validateTargetDateAgainstEvent } from "../utils/dateUtils";

const emptyForm = {
  title: "",
  provider: "",
  estimatedHours: "",
  targetDate: "",
  time: "",
};

/**
 * CrearGestionPage.jsx — route "/evento/:id/gestiones/crear".
 * Reemplaza al viejo AddSubtaskModal (modo create). El diseño Stitch (Sprint 1)
 * lo convirtió en página completa con dos bloques numerados.
 */
export default function CrearGestionPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { event, subtasks, addSubtask, status: eventStatus, isRefreshing, reload } = useEventSubtasks(id);
  const { hours: dailyLimitHours } = useDailyLimit();

  const [form, setForm] = useState(emptyForm);
  const [fieldErrors, setFieldErrors] = useState({});
  const [createdSubtaskTitle, setCreatedSubtaskTitle] = useState(null);
  const [generalError, setGeneralError] = useState(null);
  const [status, setStatus] = useState("idle");
  const [toast, setToast] = useState(null);

  const [allUserGestiones, setAllUserGestiones] = useState([]);
  const [conflictStep, setConflictStep] = useState(null); // null | 'CONFLICT_ALERT' | 'SUGGESTED_DAYS' | 'REDUCE_HOURS'
  const [conflictData, setConflictData] = useState(null);

  useEffect(() => {
    getToday().then(setAllUserGestiones).catch(() => {});
  }, []);

  const mergedGestiones = useMemo(() => {
    const map = new Map();
    (allUserGestiones || []).forEach((g) => map.set(String(g.id), g));
    (subtasks || []).forEach((g) => map.set(String(g.id), g));
    return Array.from(map.values());
  }, [allUserGestiones, subtasks]);

  const liveConflict = useMemo(() => {
    const hours = Number(form.estimatedHours);
    if (!form.targetDate || !Number.isFinite(hours) || hours <= 0) return null;
    return evaluateConflict({
      gestiones: mergedGestiones,
      targetDate: form.targetDate,
      taskHours: hours,
      dailyLimitHours,
    });
  }, [form.targetDate, form.estimatedHours, mergedGestiones, dailyLimitHours]);

  const nextAvailableDay = useMemo(() => {
    if (!conflictData) return null;
    return findNextAvailableDay({
      gestiones: mergedGestiones,
      taskHours: Number(form.estimatedHours) || 2,
      fromDate: conflictData.targetDateISO,
      dailyLimitHours,
      eventDate: event?.dateTime,
    });
  }, [conflictData, mergedGestiones, form.estimatedHours, dailyLimitHours, event?.dateTime]);

  const eventDateISO = event?.dateTime ? toDateInputValue(event.dateTime) : null;
  const isAtOrAfterEventEnd = Boolean(
    eventDateISO && form.targetDate && toDateInputValue(form.targetDate) >= eventDateISO
  );

  function handleChange(field) {
    return (e) => {
      const v = e.target.value;
      setForm((p) => ({ ...p, [field]: v }));
      setFieldErrors((p) => {
        if (!p[field]) return p;
        const n = { ...p };
        delete n[field];
        return n;
      });
    };
  }

  function validate() {
    const errors = {};
    if (!form.title.trim())
      errors.title = "Ponle un título para poder identificarla.";
    if (!form.targetDate) errors.targetDate = "Elige una fecha límite.";
    else {
      const afterEvent = validateTargetDateAgainstEvent(form.targetDate, event?.dateTime);
      if (afterEvent) errors.targetDate = afterEvent;
    }
    const hours = Number(form.estimatedHours);
    if (form.estimatedHours === "" || Number.isNaN(hours)) {
      errors.estimatedHours = "Indica las horas de dedicación.";
    } else if (hours <= 0) {
      errors.estimatedHours = "Debe ser mayor a 0.";
    }
    return errors;
  }

  async function performCreation(payload) {
    setStatus("loading");
    setConflictStep(null);
    try {
      const created = await addSubtask({
        title: payload.title.trim(),
        provider: payload.provider.trim(),
        targetDate: payload.targetDate,
        estimatedHours: Number(payload.estimatedHours),
        time: payload.time || null,
      });
      setCreatedSubtaskTitle(created?.title || payload.title.trim());
      setStatus("idle");
    } catch (err) {
      setStatus("idle");
      if (err.code === "target_date_after_event") {
        setFieldErrors((p) => ({ ...p, targetDate: err.details?.target_date?.[0] || err.message }));
        setToast({ message: "La fecha límite no puede ser posterior al evento", intent: "error" });
        return;
      }
      const errorMsg = err.message || "No pudimos crear la gestión. Intenta de nuevo.";
      setGeneralError(errorMsg);
      setToast({ message: errorMsg, intent: "error" });
    }
  }

  async function handleSubmit(e, forceOverride = false) {
    if (e?.preventDefault) e.preventDefault();
    setGeneralError(null);
    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      const onlyDateRule = Object.keys(errors).length === 1 && errors.targetDate && form.targetDate;
      setToast({ message: onlyDateRule ? errors.targetDate : "Faltan campos obligatorios", intent: "error" });
      return;
    }

    const payload = {
      title: form.title,
      provider: form.provider,
      targetDate: form.targetDate,
      estimatedHours: Number(form.estimatedHours),
      time: form.time,
    };

    if (!forceOverride) {
      const conflict = evaluateConflict({
        gestiones: mergedGestiones,
        targetDate: payload.targetDate,
        taskHours: payload.estimatedHours,
        dailyLimitHours,
      });

      if (conflict.hasConflict) {
        setConflictData(conflict);
        setConflictStep("CONFLICT_ALERT");
        return;
      }
    }

    await performCreation(payload);
  }

  function handleConflictMoveConfirm(newDate) {
    setForm((p) => ({ ...p, targetDate: newDate }));
    const taskH = Number(form.estimatedHours);
    const rechecked = evaluateConflict({
      gestiones: mergedGestiones,
      targetDate: newDate,
      taskHours: taskH,
      dailyLimitHours,
    });
    if (rechecked.hasConflict) {
      setConflictData(rechecked);
      setConflictStep("CONFLICT_ALERT");
    } else {
      performCreation({
        ...form,
        targetDate: newDate,
        estimatedHours: taskH,
      });
    }
  }

  function handleConflictReduceConfirm(newHours) {
    setForm((p) => ({ ...p, estimatedHours: String(newHours) }));
    const rechecked = evaluateConflict({
      gestiones: mergedGestiones,
      targetDate: form.targetDate,
      taskHours: newHours,
      dailyLimitHours,
    });
    if (rechecked.hasConflict) {
      setConflictData(rechecked);
      setConflictStep("CONFLICT_ALERT");
    } else {
      performCreation({
        ...form,
        estimatedHours: newHours,
      });
    }
  }

  function handleConflictPostpone() {
    const nextDay = findNextAvailableDay({
      gestiones: mergedGestiones,
      taskHours: Number(form.estimatedHours),
      fromDate: form.targetDate || new Date(),
      dailyLimitHours,
      eventDate: event?.dateTime,
    });
    if (nextDay) {
      setForm((p) => ({ ...p, targetDate: nextDay.dateISO }));
      performCreation({
        ...form,
        targetDate: nextDay.dateISO,
        estimatedHours: Number(form.estimatedHours),
      });
    } else {
      setConflictStep("SUGGESTED_DAYS");
    }
  }

  const isLoading = status === "loading";
  const eventName = event?.name ?? "…";
  const eventDateLabel = event?.dateTime ? formatShortDate(event.dateTime) : null;

  return (
    <PageContainer narrow>
      <PageHeader
        breadcrumb={
          <Breadcrumb
            backTo={`/evento/${id}`}
            items={[
              { label: "Convoka", to: "/hoy" },
              { label: "Eventos", to: "/eventos" },
              { label: eventName, to: `/evento/${id}` },
              { label: "Nueva gestión" },
            ]}
          />
        }
        eyebrow={eventName}
        title="Crear"
        accent="nueva gestión"
        description="Registra una gestión logística en la bitácora con proveedor asignado, fecha límite y estimación de esfuerzo."
      />

      {eventStatus === "notfound" && (
        <StateCard
          icon="search_off"
          stamp="Expediente no disponible"
          title="Evento no encontrado"
          description="No puedes agregar gestiones a este evento: no existe o no pertenece a tu cuenta."
          primaryAction={{ label: "Ir a Mis Eventos", icon: "arrow_back", onClick: () => navigate("/eventos") }}
          compact
        />
      )}
      {eventStatus === "error" && (
        <StateCard
          tone="error"
          icon="sync_problem"
          stamp="Incidencia de sincronización"
          title="No pudimos cargar el evento"
          description="Necesitamos los datos del evento para registrar la gestión. Tus datos guardados están a salvo."
          primaryAction={{ label: isRefreshing ? "Reintentando…" : "Reintentar carga", icon: "refresh", onClick: reload, disabled: isRefreshing }}
          compact
        />
      )}

      {eventStatus !== "notfound" && eventStatus !== "error" && (
      <form onSubmit={handleSubmit} noValidate className="space-y-6">
        {generalError && (
          <div
            role="alert"
            className="rounded-sharp bg-crimson-paper border border-crimson-urgent/30 px-3 py-2 font-body text-xs text-crimson-urgent"
          >
            {generalError}
          </div>
        )}

        <div className="bg-paper-card border border-sepia-border rounded-sharp p-6 md:p-8 warm-card-shadow space-y-8">
          {/* Bloque 1 */}
          <section className="space-y-5">
            <SectionHeader
              number="1"
              title="Definición de la gestión logística"
              badge="Paso Indispensable"
            />

            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-3">
                <label
                  htmlFor="titulo-gestion"
                  className="font-body text-xs md:text-sm font-semibold text-ink-charcoal"
                >
                  Título de la gestión logística{" "}
                  <span className="text-terracotta">*</span>
                </label>
                <span className="font-body text-[11px] text-ink-muted italic hidden sm:inline">
                  Visible en la hoja de ruta y en el resumen de Hoy
                </span>
              </div>
              <input
                id="titulo-gestion"
                type="text"
                value={form.title}
                onChange={handleChange("title")}
                placeholder="Ej. Confirmar degustación y menú final, Prueba de sonido DJ, Reserva de van..."
                aria-invalid={Boolean(fieldErrors.title)}
                className={`input-editorial w-full h-11 px-3.5 text-sm text-ink-charcoal placeholder:text-ink-subtle placeholder:italic ${
                  fieldErrors.title ? "error-field" : ""
                }`}
              />
              {fieldErrors.title && <FieldError msg={fieldErrors.title} />}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="space-y-1.5">
                <label
                  htmlFor="proveedor"
                  className="font-body text-xs md:text-sm font-semibold text-ink-charcoal flex items-center justify-between"
                >
                  <span>Proveedor o encargado</span>
                  <span className="font-body text-[11px] text-ink-muted font-normal">
                    Opcional
                  </span>
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-ink-muted pointer-events-none">
                    storefront
                  </span>
                  <input
                    id="proveedor"
                    type="text"
                    value={form.provider}
                    onChange={handleChange("provider")}
                    placeholder="Ej. Chef Jean-Luc (Atelier Gastronomique)"
                    className="input-editorial w-full h-11 pl-10 pr-3.5 text-sm text-ink-charcoal placeholder:text-ink-subtle placeholder:italic"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="horas-estimadas"
                  className="font-body text-xs md:text-sm font-semibold text-ink-charcoal flex items-center justify-between"
                >
                  <span>Dedicación estimada</span>
                  <span className="font-body text-[11px] text-ink-muted font-normal">
                    Para cálculo de carga
                  </span>
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-ink-muted pointer-events-none">
                    schedule
                  </span>
                  <input
                    id="horas-estimadas"
                    type="number"
                    step="0.5"
                    min="0.5"
                    inputMode="decimal"
                    value={form.estimatedHours}
                    onChange={handleChange("estimatedHours")}
                    placeholder="2.5"
                    aria-invalid={Boolean(fieldErrors.estimatedHours)}
                    className={`input-editorial w-full h-11 pl-10 pr-16 text-sm text-ink-charcoal placeholder:text-ink-subtle placeholder:italic ${
                      fieldErrors.estimatedHours ? "error-field" : ""
                    }`}
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 font-mono-stamp text-xs text-ink-muted">
                    horas
                  </span>
                </div>
                {fieldErrors.estimatedHours && (
                  <FieldError msg={fieldErrors.estimatedHours} />
                )}
              </div>
            </div>
          </section>

          <div className="h-px bg-sepia-border/60" />

          {/* Bloque 2 */}
          <section className="space-y-5">
            <SectionHeader
              number="2"
              title="Calendario"
              badge="Programación"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="fecha-limite"
                    className="font-body text-xs md:text-sm font-semibold text-ink-charcoal"
                  >
                    Fecha límite de resolución{" "}
                    <span className="text-terracotta">*</span>
                  </label>
                  {eventDateLabel && (
                    <span className="font-body text-[11px] text-terracotta font-medium">
                      Evento: {eventDateLabel}
                    </span>
                  )}
                </div>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-ink-muted pointer-events-none">
                    calendar_today
                  </span>
                  <input
                    id="fecha-limite"
                    type="date"
                    value={form.targetDate}
                    onChange={handleChange("targetDate")}
                    aria-invalid={Boolean(fieldErrors.targetDate)}
                    className={`input-editorial w-full h-11 pl-10 pr-3.5 text-sm text-ink-charcoal ${
                      fieldErrors.targetDate ? "error-field" : ""
                    }`}
                  />
                </div>
                {fieldErrors.targetDate ? (
                  <FieldError msg={fieldErrors.targetDate} />
                ) : (
                  <p className="font-body text-[11px] text-ink-muted">
                    Determinará si aparece en <em>Para hoy</em>,{" "}
                    <em>Próximas</em> o como <em>Vencida</em>.
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="hora-limite"
                  className="font-body text-xs md:text-sm font-semibold text-ink-charcoal flex items-center justify-between"
                >
                  <span>Hora límite o reunión</span>
                  <span className="font-body text-[11px] text-ink-muted font-normal">
                    Opcional
                  </span>
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-ink-muted pointer-events-none">
                    schedule
                  </span>
                  <input
                    id="hora-limite"
                    type="time"
                    value={form.time}
                    onChange={handleChange("time")}
                    className="input-editorial w-full h-11 pl-10 pr-3.5 text-sm text-ink-charcoal"
                  />
                </div>
                <p className="font-body text-[11px] text-ink-muted">
                  Permite ordenar la gestión en el bloque horario de la jornada.
                </p>
              </div>

              {liveConflict?.hasConflict && (
                <div className="sm:col-span-2 mt-2 p-3 rounded-sharp bg-crimson-paper/50 border border-crimson-urgent/30 flex items-center gap-2 text-xs font-body text-crimson-urgent font-medium">
                  <span className="material-symbols-outlined text-[16px] shrink-0">warning</span>
                  <span>
                    Superaría tu límite diario: quedarías con {liveConflict.totalHours}h planificadas (límite {liveConflict.limitHours}h).
                  </span>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Nota informativa */}
        <div className="bg-paper-linen/70 border border-sepia-border rounded-sharp p-4 px-5 flex items-start gap-3">
          <span className="material-symbols-outlined text-[18px] text-terracotta shrink-0 mt-0.5">
            info
          </span>
          <p className="font-body text-xs text-ink-muted leading-relaxed">
            Los campos con asterisco (
            <span className="text-terracotta font-semibold">*</span>) son
            obligatorios para sincronizar la agenda del evento con la vista
            diaria{" "}
            <strong className="text-ink-charcoal font-medium">
              «Gestiones para hoy»
            </strong>{" "}
            y calcular la carga horaria del equipo organizador.
          </p>
        </div>

        {/* Acciones */}
        <div className="pt-4 flex flex-col-reverse sm:flex-row items-center justify-between gap-4">
          <Link
            to={`/evento/${id}`}
            className="font-body text-xs md:text-sm text-ink-muted hover:text-ink-charcoal underline underline-offset-4 transition-colors"
          >
            Cancelar y volver al evento
          </Link>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            
              
            <button
              type="submit"
              disabled={isLoading || eventStatus === "loading"}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-6 py-2.5 bg-terracotta hover:bg-terracotta-dark text-[#FAF6F0] font-body text-xs md:text-sm font-semibold tracking-wide rounded-sharp border border-terracotta-dark shadow-sm transition-colors active:translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-[16px]">
                check_circle
              </span>
              <span>
                {isLoading ? "Creando…" : "Crear y programar gestión"}
              </span>
            </button>
          </div>
        </div>
      </form>
      )}

      {createdSubtaskTitle && (
        <CreateSubtaskSuccessModal
          subtaskTitle={createdSubtaskTitle}
          eventId={id}
          onClose={() => setCreatedSubtaskTitle(null)}
        />
      )}

      {conflictStep === "CONFLICT_ALERT" && conflictData && (
        <ConflictOverloadModal
          conflict={conflictData}
          gestion={{ title: form.title.trim() }}
          isEventEnd={isAtOrAfterEventEnd}
          nextAvailableDayLabel={
            nextAvailableDay?.shortLabel || (isAtOrAfterEventEnd ? "Evento finaliza este día" : "Ver sugerencias")
          }
          onChooseMove={() => setConflictStep("SUGGESTED_DAYS")}
          onChooseReduce={() => setConflictStep("REDUCE_HOURS")}
          onChoosePostpone={handleConflictPostpone}
          onKeepAnyway={() => performCreation({
            title: form.title,
            provider: form.provider,
            targetDate: form.targetDate,
            estimatedHours: Number(form.estimatedHours),
            time: form.time,
          })}
          onCancel={() => setConflictStep(null)}
        />
      )}

      {conflictStep === "SUGGESTED_DAYS" && (
        <SuggestedDaysSelector
          suggestedDays={findSuggestedAvailableDays({
            gestiones: mergedGestiones,
            taskHours: Number(form.estimatedHours) || 2,
            fromDate: form.targetDate || new Date(),
            dailyLimitHours,
            eventDate: event?.dateTime,
          })}
          currentDateISO={form.targetDate}
          eventDateTime={event?.dateTime}
          taskHours={Number(form.estimatedHours) || 2}
          dailyLimitHours={dailyLimitHours}
          isSubmitting={isLoading}
          onConfirmDate={handleConflictMoveConfirm}
          onBack={() => setConflictStep("CONFLICT_ALERT")}
        />
      )}

      {conflictStep === "REDUCE_HOURS" && (
        <ReduceHoursModal
          gestion={{ title: form.title.trim(), estimatedHours: Number(form.estimatedHours) || 2 }}
          targetDateISO={form.targetDate}
          currentHoursOnDay={conflictData?.currentHours || 0}
          dailyLimitHours={dailyLimitHours}
          isSubmitting={isLoading}
          onConfirmHours={handleConflictReduceConfirm}
          onBack={() => setConflictStep("CONFLICT_ALERT")}
        />
      )}

      <Toast toast={toast} onClose={() => setToast(null)} />
    </PageContainer>
  );
}

// ---------------------------------------------------------------------------

function SectionHeader({ number, title, badge }) {
  return (
    <div className="flex items-center justify-between pb-3 border-b border-sepia-border/70">
      <div className="flex items-center gap-2.5">
        <span className="w-6 h-6 rounded-full border border-sepia-border bg-paper-base flex items-center justify-center font-heading text-xs font-bold text-ink-charcoal">
          {number}
        </span>
        <h2 className="font-heading text-xl md:text-2xl text-ink-charcoal font-semibold">
          {title}
        </h2>
      </div>
      <span className="font-mono-stamp text-[10px] text-terracotta uppercase tracking-wider font-semibold">
        {badge}
      </span>
    </div>
  );
}

function FieldError({ msg }) {
  return (
    <p className="text-xs font-body text-crimson-urgent flex items-center gap-1 font-medium mt-1">
      <span className="material-symbols-outlined text-[14px]">error</span>
      {msg}
    </p>
  );
}
