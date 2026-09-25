import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import CreateSubtaskSuccessModal from "../components/common/CreateSubtaskSuccessModal";
import { useEventSubtasks } from "../hooks/useEventSubtasks";
import Toast from "../components/common/Toast";
import { formatShortDate } from "../utils/dateUtils";

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
  const { event, addSubtask, status: eventStatus } = useEventSubtasks(id);

  const [form, setForm] = useState(emptyForm);
  const [fieldErrors, setFieldErrors] = useState({});
  const [createdSubtaskTitle, setCreatedSubtaskTitle] = useState(null);
  const [generalError, setGeneralError] = useState(null);
  const [status, setStatus] = useState("idle");
  const [toast, setToast] = useState(null);

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
    const hours = Number(form.estimatedHours);
    if (form.estimatedHours === "" || Number.isNaN(hours)) {
      errors.estimatedHours = "Indica las horas de dedicación.";
    } else if (hours <= 0) {
      errors.estimatedHours = "Debe ser mayor a 0.";
    }
    return errors;
  }

  async function handleSubmit(e) {
  e.preventDefault();
  setGeneralError(null);
  const errors = validate();
  if (Object.keys(errors).length > 0) {
    setFieldErrors(errors);
    setToast({ message: "Faltan campos obligatorios", intent: "error" })
    return;
  }
  setStatus("loading");
  try {
    const localDate = new Date(`${form.targetDate}T12:00:00`);
    const created = await addSubtask({
      title: form.title.trim(),
      provider: form.provider.trim(),
      targetDate: localDate.toISOString(),
      estimatedHours: Number(form.estimatedHours),
    });
    setCreatedSubtaskTitle(created?.title || form.title.trim());
    setStatus("idle");
  } catch (err) {
    setStatus("idle");
    setGeneralError(
      err.message || "No pudimos crear la gestión. Intenta de nuevo."
    );
  }
}

  

  const isLoading = status === "loading";
  const eventName = event?.name ?? "…";
  const eventDateLabel = event?.dateTime ? formatShortDate(event.dateTime) : null;

  return (
    <div className="max-w-[1080px] mx-auto px-4 md:px-8 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs font-body text-ink-muted mb-6">
        <Link
          to={`/evento/${id}`}
          title="Volver al detalle del evento"
          className="w-7 h-7 flex items-center justify-center rounded-sharp border border-sepia-border bg-paper-card text-ink-muted hover:text-ink-charcoal hover:border-ink-muted transition-colors"
        >
          <span className="material-symbols-outlined text-[16px]">
            arrow_back
          </span>
        </Link>
        <div className="flex items-center gap-1.5 ml-1">
          <Link to="/hoy" className="hover:text-ink-charcoal transition-colors">
            Convoka
          </Link>
          <span className="text-sepia-dark">/</span>
          <Link
            to="/eventos"
            className="hover:text-ink-charcoal transition-colors"
          >
            Eventos
          </Link>
          <span className="text-sepia-dark">/</span>
          <Link
            to={`/evento/${id}`}
            className="hover:text-ink-charcoal font-medium transition-colors truncate max-w-[180px]"
          >
            {eventName}
          </Link>
          <span className="text-sepia-dark">/</span>
          <span className="text-ink-charcoal font-semibold">Nueva gestión</span>
        </div>
      </div>

      {/* Encabezado */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-6 mb-8 border-b border-sepia-border">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-body text-ink-muted">
            <span>{eventName}</span>
          </div>
          <h1 className="font-serif text-4xl sm:text-5xl font-semibold tracking-tight text-ink-charcoal leading-tight">
            Crear{" "}
            <span className="italic font-normal text-terracotta">
              nueva gestión
            </span>
          </h1>
        </div>
        <p className="font-body text-xs md:text-sm text-ink-muted max-w-sm lg:text-right leading-relaxed">
          Registra una subtarea operativa en la bitácora con proveedor asignado,
          fecha límite y estimación de esfuerzo.
        </p>
      </div>

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
              title="Definición de la Gestión"
              badge="Paso Indispensable"
            />

            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-3">
                <label
                  htmlFor="titulo-gestion"
                  className="font-body text-xs md:text-sm font-semibold text-ink-charcoal"
                >
                  Título de la subtarea o gestión{" "}
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

              {createdSubtaskTitle && (
  <CreateSubtaskSuccessModal
    subtaskTitle={createdSubtaskTitle}
    eventId={id}
    onClose={() => setCreatedSubtaskTitle(null)}
  />
)}
      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}

// ---------------------------------------------------------------------------

function SectionHeader({ number, title, badge }) {
  return (
    <div className="flex items-center justify-between pb-3 border-b border-sepia-border/70">
      <div className="flex items-center gap-2.5">
        <span className="w-6 h-6 rounded-full border border-sepia-border bg-paper-base flex items-center justify-center font-serif text-xs font-bold text-ink-charcoal">
          {number}
        </span>
        <h2 className="font-serif text-xl md:text-2xl text-ink-charcoal font-semibold">
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