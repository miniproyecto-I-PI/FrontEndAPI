import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import CreateEventSuccessModal from "../components/common/CreateEventSuccessModal";

import Toast from "../components/common/Toast";
import EventTypeSelector from "../components/eventos/EventTypeSelector";
import { createEvent } from "../services/api";

const emptyForm = {
  title: "",
  type: "boda",
  host: "",
  date: "",
  venue: "",
};

/**
 * CrearPage.jsx — route "/crear" (US-01).
 * Rewrite (Stitch Sprint 1): dos bloques numerados, tipo de celebración como
 * grid de cards, modal de éxito post-create. No persiste guests/budget/city/
 * notes porque el backend todavía no los soporta (ver respuesta).
 */
export default function CrearPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState(emptyForm);
  const [fieldErrors, setFieldErrors] = useState({});
  const [generalError, setGeneralError] = useState(null);
  const [status, setStatus] = useState("idle");
  const [toast, setToast] = useState(null);
  const [createdEventName, setCreatedEventName] = useState(null);

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
    if (!form.date)
      errors.date = "Elige una fecha para programar las alertas.";
    return errors;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setGeneralError(null);
    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setToast({ message: "Faltan campos obligatorios", intent: "error" })
      window.scrollTo({ top: 120, behavior: "smooth" });
      return;
    }
    setStatus("loading");
    try {
      const localDate = new Date(`${form.date}T12:00:00`);
      const created = await createEvent({
        name: form.title.trim(),
        type: form.type,
        contact: form.host,
        dateTime: localDate.toISOString(),
        place: form.venue,
      });
      setCreatedEventName(created?.name || form.title.trim());
      setStatus("idle");

    } catch (err) {
      setStatus("idle");
      setGeneralError(
        err.message || "No pudimos crear el evento. Intenta de nuevo."
      );
      setToast({ message: "No se pudo crear el evento", intent: "error" })
    }
  }

  

  function handleSuccessStay() {
  setCreatedEventName(null);
  setForm(emptyForm);
  setFieldErrors({});
  setGeneralError(null);
}

function handleSuccessGoToEvents() {
  navigate("/eventos", { state: { toast: "Evento creado" } });
}

  const isLoading = status === "loading";

  return (
    <div className="max-w-[1320px] mx-auto px-4 md:px-8 lg:px-12 py-8">
      {/* Breadcrumb */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 mb-8 border-b border-sepia-border">
        <div className="flex items-center gap-2 text-xs font-body text-ink-muted">
          <Link
            to="/eventos"
            aria-label="Volver"
            className="inline-flex items-center justify-center w-7 h-7 rounded-sharp border border-sepia-border bg-paper-card hover:bg-paper-linen text-ink-muted hover:text-ink-charcoal transition-colors mr-1"
          >
            <span className="material-symbols-outlined text-[16px]">
              arrow_back
            </span>
          </Link>
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
          <span className="text-ink-charcoal font-semibold">Nuevo evento</span>
        </div>
      </div>

      {/* Título */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-1">
            <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight text-ink-charcoal leading-tight">
              Crear{" "}
              <span className="italic font-normal text-terracotta">
                nuevo evento
              </span>
            </h1>
          </div>
          <p className="font-body text-xs md:text-sm text-ink-muted max-w-md">
            Ingresa los datos clave para generar de forma inmediata la hoja de
            ruta y las primeras gestiones.
          </p>
        </div>
      </div>

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
              badge="Paso indispensable"
            />
            <div className="space-y-5">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-3">
                  <label
                    htmlFor="event-title"
                    className="block font-serif font-semibold text-sm text-ink-charcoal"
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
                <label className="block font-serif font-semibold text-sm text-ink-charcoal">
                  Tipo de celebración{" "}
                  <span className="text-crimson-urgent">*</span>
                </label>
                <EventTypeSelector
                  value={form.type}
                  onChange={handleTypeChange}
                />
              </div>

              <div className="space-y-1.5 pt-1">
                <label
                  htmlFor="event-host"
                  className="block font-serif font-semibold text-sm text-ink-charcoal"
                >
                  Cliente o anfitrión
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
              badge="Calendario"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label
                  htmlFor="event-date"
                  className="block font-serif font-semibold text-sm text-ink-charcoal"
                >
                  Fecha de celebración{" "}
                  <span className="text-crimson-urgent">*</span>
                </label>
                <input
                  id="event-date"
                  type="date"
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
                  className="block font-serif font-semibold text-sm text-ink-charcoal"
                >
                  Lugar o recinto tentativo
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

        {/* Acciones */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t border-sepia-border">
          <button
            type="button"
            onClick={() => navigate("/eventos")}
            className="text-xs font-serif text-ink-muted hover:text-ink-charcoal underline hover:no-underline order-last sm:order-first transition-colors focus:outline-none"
          >
            Cancelar y volver
          </button>
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            
              
            <button
              type="submit"
              disabled={isLoading}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-terracotta hover:bg-terracotta-dark text-[#FAF6F0] font-serif font-semibold text-sm rounded-sharp border border-terracotta-dark shadow-sm transition-colors active:translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-[18px]">
                check_circle
              </span>
              <span>{isLoading ? "Creando…" : "Crear y abrir expediente"}</span>
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

      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}

// ---------------------------------------------------------------------------

function SectionHeader({ number, title, badge }) {
  return (
    <div className="flex items-center justify-between pb-3 border-b border-sepia-border">
      <div className="flex items-center gap-3">
        <span className="w-6 h-6 rounded-full bg-paper-base border border-sepia-border flex items-center justify-center font-serif text-xs font-bold text-terracotta">
          {number}
        </span>
        <h2 className="font-serif text-xl font-semibold text-ink-charcoal">
          {title}
        </h2>
      </div>
      <span className="font-mono-stamp text-[10px] text-ink-muted uppercase">
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

