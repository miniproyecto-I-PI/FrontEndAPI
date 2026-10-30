import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import CreateEventSuccessModal from "../components/common/CreateEventSuccessModal";

import Toast from "../components/common/Toast";
import PageContainer from "../components/layout/PageContainer";
import PageHeader, { Breadcrumb } from "../components/layout/PageHeader";
import EventTypeSelector from "../components/eventos/EventTypeSelector";
import InitialSubtasks from "../components/eventos/InitialSubtasks";
import { createEvent } from "../services/api";
import { toDateInputValue, validateTargetDateAgainstEvent } from "../utils/dateUtils";
import { useDailyLimit } from "../hooks/useDailyLimit";
import UnsavedDraftConfirmModal from "../components/common/UnsavedDraftConfirmModal";

const emptyForm = {
  title: "",
  type: "boda",
  host: "",
  date: "",
  venue: "",
};

/**
 * CrearPage.jsx — route "/crear" (US-01).
 * Diseño Stitch: datos del evento, cuándo y dónde, y gestiones iniciales
 * opcionales (se crean junto al evento en POST /events → `subtasks`).
 * "Asistentes estimados" y "Guardar borrador" no se implementan: el backend
 * no los soporta.
 */
export default function CrearPage() {
  const navigate = useNavigate();
  const { allowSubtasksAfterEvent } = useDailyLimit();

  const [form, setForm] = useState(emptyForm);
  const [fieldErrors, setFieldErrors] = useState({});
  const [generalError, setGeneralError] = useState(null);
  const [status, setStatus] = useState("idle");
  const [toast, setToast] = useState(null);
  const [showInitialSubtasks, setShowInitialSubtasks] = useState(false);
  const [createdEventName, setCreatedEventName] = useState(null);
  const [initialSubtasks, setInitialSubtasks] = useState([]);
  const closeToast = useCallback(() => setToast(null), []);
  const [pendingDraft, setPendingDraft] = useState(null); // { draft, hasContent }
  const [showDraftWarning, setShowDraftWarning] = useState(false);

  const handleDraftChange = useCallback((info) => setPendingDraft(info), []);

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

  function handleTypeChange(type) {
    setForm((p) => ({ ...p, type }));
  }

  function validate() {
    const errors = {};
    if (!form.title.trim())
      errors.title = "Ingresa un nombre para poder identificar la bitácora.";
    const todayISO = toDateInputValue(new Date());
    if (!form.date) {
      errors.date = "Elige una fecha para programar las alertas.";
    } else if (form.date < todayISO) {
      errors.date = "La fecha del evento no puede ser anterior a hoy.";
    } else if (!allowSubtasksAfterEvent && initialSubtasks.some((s) => validateTargetDateAgainstEvent(s.targetDate, form.date))) {
      errors.date = "Hay gestiones iniciales con fecha posterior al evento. Cambia la fecha o quítalas.";
    }
    return errors;
  }

    async function handleSubmit(e) {
    if (e?.preventDefault) e.preventDefault();
    setGeneralError(null);
    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      const onlyDateRule = Object.keys(errors).length === 1 && errors.date && form.date;
      setToast({ message: onlyDateRule ? errors.date : "Faltan campos obligatorios", intent: "error" });
      window.scrollTo({ top: 120, behavior: "smooth" });
      return;
    }

    // #2: si el borrador de gestión tiene datos y nunca se añadió, advertir.
    if (pendingDraft?.hasContent) {
      setShowDraftWarning(true);
      return;
    }

    await performCreate();
  }

  async function performCreate() {
    setShowDraftWarning(false);
    setStatus("loading");
    try {
      const localDate = new Date(`${form.date}T12:00:00`);
      const created = await createEvent({
        name: form.title.trim(),
        type: form.type,
        contact: form.host,
        dateTime: localDate.toISOString(),
        place: form.venue,
        subtasks: initialSubtasks,
      });
      setCreatedEventName(created?.name || form.title.trim());
      setStatus("idle");
    } catch (err) {
      setStatus("idle");
      if (err.code === "event_date_in_past") {
        setFieldErrors((p) => ({ ...p, date: err.details?.event_datetime?.[0] || err.message }));
      }
      const errorMsg = err.message || "No pudimos crear el evento. Intenta de nuevo.";
      setGeneralError(errorMsg);
      setToast({ message: errorMsg, intent: "error" });
    }
  }

  function handleConfirmCreateWithoutDraft() {
    performCreate();
  }

  

  function handleSuccessStay() {
  setCreatedEventName(null);
  setForm(emptyForm);
  setInitialSubtasks([]);
  setFieldErrors({});
  setGeneralError(null);
}

function handleSuccessGoToEvents() {
  navigate("/eventos", { state: { toast: "Evento creado" } });
}

  const isLoading = status === "loading";

  return (
    <PageContainer>
      <PageHeader
        breadcrumb={
          <Breadcrumb
            backTo="/eventos"
            items={[{ label: "Convoka"}, { label: "Eventos", to: "/eventos" }, { label: "Nuevo evento" }]}
          />
        }
        title="Crear"
        accent="nuevo evento"
        description="Ingresa los datos clave para generar de forma inmediata la hoja de ruta y las primeras gestiones."
      />

      {/* Formulario */}
      <form
        onSubmit={handleSubmit}
        noValidate
        className="max-w-3xl mx-auto space-y-7"
      >
        {generalError && (
          <div
            role="alert"
            className="rounded-sharp bg-crimson-paper border border-crimson-urgent/30 px-3 py-2 font-body text-xs text-crimson-urgent"
          >
            {generalError}
          </div>
        )}

        <section className="bg-paper-card border border-sepia-border rounded-sharp p-6 md:p-7 warm-card-shadow space-y-8">
          {/* Bloque 1 */}
          <div className="space-y-6">
            <SectionHeader
              number="1"
              title="Datos del Evento"
            />
            <div className="space-y-5">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-3">
                  <label
                    htmlFor="event-title"
                    className="block font-heading font-semibold text-sm text-ink-charcoal"
                  >
                    Nombre o título del evento{" "}
                    <span className="text-crimson-urgent">*</span>
                  </label>
                  <span className="font-body text-[11px] text-ink-muted hidden sm:inline">
                    Visible para clientes y proveedores
                  </span>
                </div>
                <input
                  id="event-title"
                  type="text"
                  value={form.title}
                  onChange={handleChange("title")}
                  placeholder="Ej. Boda Sofía & Mateo, Gala Anual Innovatech..."
                  aria-invalid={Boolean(fieldErrors.title)}
                  className={`input-editorial w-full px-3.5 py-2.5 text-sm text-ink-charcoal placeholder:text-ink-subtle placeholder:italic ${
                    fieldErrors.title ? "error-field" : ""
                  }`}
                />
                {fieldErrors.title && <FieldError msg={fieldErrors.title} />}
              </div>

              <div className="space-y-2 pt-1">
                <span id="event-type-label" className="block font-heading font-semibold text-sm text-ink-charcoal">
                  Tipo de celebración <span className="text-crimson-urgent">*</span>
                </span>
                <div role="group" aria-labelledby="event-type-label">
                  <EventTypeSelector
                    value={form.type}
                    onChange={handleTypeChange}
                  />
                </div>
              </div>

              <div className="space-y-1.5 pt-1">
                <label
                  htmlFor="event-host"
                  className="flex items-center justify-between font-heading font-semibold text-sm text-ink-charcoal"
                >
                  <span>Cliente o anfitrión</span>
                  <span className="font-body text-[11px] text-ink-muted font-normal">Opcional</span>
                </label>
                <input
                  id="event-host"
                  type="text"
                  value={form.host}
                  onChange={handleChange("host")}
                  placeholder="Ej. Familia Arismendi"
                  className="input-editorial w-full px-3.5 py-2 text-sm text-ink-charcoal placeholder:text-ink-subtle placeholder:italic"
                />
              </div>
            </div>
          </div>

          {/* Bloque 2 */}
          <div className="pt-6 border-t border-sepia-border space-y-6">
            <SectionHeader
              number="2"
              title="Cuándo y Dónde"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label
                  htmlFor="event-date"
                  className="block font-heading font-semibold text-sm text-ink-charcoal"
                >
                  Fecha de celebración{" "}
                  <span className="text-crimson-urgent">*</span>
                </label>
                <input
                  id="event-date"
                  type="date"
                  min={toDateInputValue(new Date())}
                  value={form.date}
                  onChange={handleChange("date")}
                  aria-invalid={Boolean(fieldErrors.date)}
                  className={`input-editorial w-full px-3.5 py-2 text-sm text-ink-charcoal ${
                    fieldErrors.date ? "error-field" : ""
                  }`}
                />
                {fieldErrors.date && <FieldError msg={fieldErrors.date} />}
              </div>
              <div className="space-y-1.5">
                <label
                  htmlFor="event-venue"
                  className="flex items-center justify-between font-heading font-semibold text-sm text-ink-charcoal"
                >
                  <span>Lugar o recinto tentativo</span>
                  <span className="font-body text-[11px] text-ink-muted font-normal">Opcional</span>
                </label>
                <input
                  id="event-venue"
                  type="text"
                  value={form.venue}
                  onChange={handleChange("venue")}
                  placeholder="Ej. Finca El Olivo, Madrid"
                  className="input-editorial w-full px-3.5 py-2 text-sm text-ink-charcoal placeholder:text-ink-subtle placeholder:italic"
                />
              </div>
            </div>
          </div>
        </section>

                {!showInitialSubtasks && initialSubtasks.length === 0 ? (
          <div className="bg-paper-card border border-sepia-border rounded-sharp p-10 warm-card-shadow flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-paper-base border border-sepia-border flex items-center justify-center text-terracotta mb-2">
              <span className="material-symbols-outlined text-[32px]">playlist_add</span>
            </div>
            <h3 className="font-heading text-2xl font-bold text-ink-charcoal tracking-tight">
              Aún no tienes gestiones
            </h3>
            <p className="font-body text-sm text-ink-muted max-w-md mx-auto leading-relaxed">
              Comienza a planificar tu evento agregando las primeras tareas logísticas para su preparación (opcional).
            </p>
            <button
              type="button"
              onClick={() => setShowInitialSubtasks(true)}
              className="mt-4 inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-terracotta hover:bg-terracotta-dark text-[#FAF6F0] font-heading font-semibold text-sm rounded-sharp border border-terracotta-dark shadow-sm transition-colors active:translate-y-0.5"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              Crear gestiones iniciales
            </button>
          </div>
        ) : (
          <InitialSubtasks
            items={initialSubtasks}
            eventDate={form.date}
            onAdd={(item) => setInitialSubtasks((list) => [...list, item])}
            onRemove={(index) => setInitialSubtasks((list) => list.filter((_, i) => i !== index))}
            onDraftChange={handleDraftChange}
            disabled={isLoading}
          />
        )}

        {/* Acciones */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t border-sepia-border">
          <button
            type="button"
            onClick={() => navigate("/eventos")}
            className="text-xs font-heading text-ink-muted hover:text-ink-charcoal underline hover:no-underline order-last sm:order-first transition-colors focus:outline-none"
          >
            Cancelar y volver
          </button>
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            
              
            <button
              type="submit"
              disabled={isLoading}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-terracotta hover:bg-terracotta-dark text-[#FAF6F0] font-heading font-semibold text-sm rounded-sharp border border-terracotta-dark shadow-sm transition-colors active:translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-[18px]">
                check_circle
              </span>
              <span>{isLoading ? "Creando…" : "Crear el evento"}</span>
            </button>
          </div>
        </div>
      </form>

      {createdEventName && (
  <CreateEventSuccessModal
    eventName={createdEventName}
    onStay={handleSuccessStay}
    onGoToEvents={handleSuccessGoToEvents}
  />
  
)}

{showDraftWarning && (
  <UnsavedDraftConfirmModal
    onCancel={() => setShowDraftWarning(false)}
    onConfirm={handleConfirmCreateWithoutDraft}
  />
)}

      <Toast toast={toast} onClose={closeToast} />
    </PageContainer>
  );
}

// ---------------------------------------------------------------------------

function SectionHeader({ number, title }) {
  return (
    <div className="flex items-center justify-between pb-3 border-b border-sepia-border">
      <div className="flex items-center gap-3">
        <span className="w-6 h-6 rounded-full bg-paper-base border border-sepia-border flex items-center justify-center font-heading text-xs font-bold text-terracotta">
          {number}
        </span>
        <h2 className="font-heading text-xl font-semibold text-ink-charcoal">
          {title}
        </h2>
      </div>
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

