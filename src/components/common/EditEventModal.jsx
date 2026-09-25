import { useEffect, useRef, useState } from "react";
import { toDateInputValue } from "../../utils/dateUtils";
import EventTypeSelector from "../eventos/EventTypeSelector";
import { EVENT_TYPES } from "../../data/eventTypes";

const KNOWN_TYPES = EVENT_TYPES.map((t) => t.key);

/**
 * EditEventModal.jsx — US-03.
 * Rewrite (Stitch Sprint 1): mismo lenguaje visual que CrearPage
 * (bloques numerados, selector de tipo en grid, top-accent terracotta).
 * Sin guests/budget/city/notes porque el backend todavía no los soporta.
 */
export default function EditEventModal({ initialEvent, onCancel, onSubmit }) {
  const [form, setForm] = useState(() => ({
    name: initialEvent.name ?? "",
    type: KNOWN_TYPES.includes(initialEvent.type) ? initialEvent.type : "otro",
    contact: initialEvent.contact ?? "",
    date: toDateInputValue(initialEvent.dateTime),
    place: initialEvent.place ?? "",
  }));
  const [fieldErrors, setFieldErrors] = useState({});
  const [generalError, setGeneralError] = useState(null);
  const [status, setStatus] = useState("idle");

  const firstInputRef = useRef(null);

  useEffect(() => {
    firstInputRef.current?.focus();
  }, []);

  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape" && status !== "loading") onCancel();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel, status]);

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
    if (!form.name.trim()) errors.name = "El nombre del evento es obligatorio.";
    if (!form.date) errors.date = "La fecha del evento es obligatoria.";
    return errors;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setGeneralError(null);
    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setStatus("loading");
    try {
      const localDate = new Date(`${form.date}T12:00:00`);
      await onSubmit({
        name: form.name.trim(),
        type: form.type,
        contact: form.contact,
        dateTime: localDate.toISOString(),
        place: form.place,
      });
    } catch (err) {
      setStatus("idle");
      setGeneralError(
        err.message || "No se pudo actualizar el evento. Intenta de nuevo."
      );
    }
  }

  const isLoading = status === "loading";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-event-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-charcoal/50 backdrop-blur-sm overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isLoading) onCancel();
      }}
    >
      <div className="relative w-full max-w-2xl bg-paper-card border border-sepia-border rounded-sharp warm-card-shadow overflow-hidden flex flex-col max-h-[90vh] my-auto">
        {/* Top terracotta accent */}
        <div className="h-1 w-full bg-terracotta flex-shrink-0" />

        {/* Header */}
        <div className="px-6 md:px-8 pt-6 pb-4 border-b border-sepia-border flex items-start justify-between gap-4 flex-shrink-0">
          <div>
            <h2
              id="edit-event-title"
              className="font-serif text-2xl font-bold text-ink-charcoal tracking-tight"
            >
              Editar ficha de evento
            </h2>
            <p className="font-body text-xs md:text-sm text-ink-muted mt-1">
              Modifica los datos principales del evento.
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            aria-label="Cerrar modal"
            className="p-1 rounded-sharp text-ink-muted hover:text-ink-charcoal hover:bg-paper-linen transition-colors flex-shrink-0 mt-0.5 disabled:opacity-60"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          noValidate
          className="p-6 md:p-8 overflow-y-auto flex-1 space-y-6"
        >
          <section className="bg-paper-card border border-sepia-border rounded-sharp p-5 md:p-6 space-y-6">
            {/* Bloque 1 */}
            <div className="space-y-4">
              <ModalSectionHeader
                number="1"
                title="Datos del Evento"
                badge="Paso indispensable"
              />

              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-3">
                  <label
                    htmlFor="edit-event-name"
                    className="block font-serif font-semibold text-xs md:text-sm text-ink-charcoal"
                  >
                    Nombre o título del evento{" "}
                    <span className="text-crimson-urgent">*</span>
                  </label>
                  <span className="font-body text-[11px] text-ink-muted hidden sm:inline">
                    Visible para clientes y proveedores
                  </span>
                </div>
                <input
                  id="edit-event-name"
                  ref={firstInputRef}
                  type="text"
                  value={form.name}
                  onChange={handleChange("name")}
                  aria-invalid={Boolean(fieldErrors.name)}
                  className={`input-editorial w-full px-3.5 py-2 text-sm text-ink-charcoal font-medium ${
                    fieldErrors.name ? "error-field" : ""
                  }`}
                />
                {fieldErrors.name && <FieldError msg={fieldErrors.name} />}
              </div>

              <div className="space-y-1.5 pt-1">
                <label className="block font-serif font-semibold text-xs md:text-sm text-ink-charcoal">
                  Tipo de celebración{" "}
                  <span className="text-crimson-urgent">*</span>
                </label>
                <EventTypeSelector
                  value={form.type}
                  onChange={(t) => setForm((p) => ({ ...p, type: t }))}
                />
              </div>

              <div className="space-y-1.5 pt-1">
                <label
                  htmlFor="edit-event-host"
                  className="block font-serif font-semibold text-xs md:text-sm text-ink-charcoal"
                >
                  Cliente o anfitrión
                </label>
                <input
                  id="edit-event-host"
                  type="text"
                  value={form.contact}
                  onChange={handleChange("contact")}
                  placeholder="Ej. Familia Arismendi"
                  className="input-editorial w-full px-3.5 py-2 text-sm text-ink-charcoal placeholder:text-ink-subtle placeholder:italic"
                />
              </div>
            </div>

            {/* Bloque 2 */}
            <div className="pt-5 border-t border-sepia-border space-y-4">
              <ModalSectionHeader
                number="2"
                title="Cuándo y Dónde"
                badge="Calendario"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label
                    htmlFor="edit-event-date"
                    className="block font-serif font-semibold text-xs md:text-sm text-ink-charcoal"
                  >
                    Fecha de celebración{" "}
                    <span className="text-crimson-urgent">*</span>
                  </label>
                  <input
                    id="edit-event-date"
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
                    htmlFor="edit-event-venue"
                    className="block font-serif font-semibold text-xs md:text-sm text-ink-charcoal"
                  >
                    Lugar o recinto tentativo
                  </label>
                  <input
                    id="edit-event-venue"
                    type="text"
                    value={form.place}
                    onChange={handleChange("place")}
                    placeholder="Ej. Finca El Olivo, Madrid"
                    className="input-editorial w-full px-3.5 py-2 text-sm text-ink-charcoal placeholder:text-ink-subtle placeholder:italic"
                  />
                </div>
              </div>
            </div>
          </section>

          {generalError && (
            <div
              role="alert"
              className="rounded-sharp bg-crimson-paper border border-crimson-urgent/30 px-3 py-2 font-body text-xs text-crimson-urgent"
            >
              {generalError}
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-3 border-t border-sepia-border">
            <button
              type="button"
              onClick={onCancel}
              disabled={isLoading}
              className="text-xs font-serif text-ink-muted hover:text-ink-charcoal underline hover:no-underline transition-colors order-last sm:order-first disabled:opacity-60"
            >
              Descartar cambios
            </button>
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
              
              <button
                type="submit"
                disabled={isLoading}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-terracotta hover:bg-terracotta-dark text-[#FAF6F0] font-body text-xs md:text-sm font-semibold rounded-sharp border border-terracotta-dark shadow-sm transition-all active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <span className="material-symbols-outlined text-[17px]">
                  check_circle
                </span>
                <span>{isLoading ? "Guardando…" : "Guardar cambios"}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------

function ModalSectionHeader({ number, title, badge }) {
  return (
    <div className="flex items-center justify-between pb-2 border-b border-sepia-border">
      <div className="flex items-center gap-2">
        <span className="w-5 h-5 rounded-full bg-paper-base border border-sepia-border flex items-center justify-center font-serif text-[11px] font-bold text-terracotta">
          {number}
        </span>
        <h3 className="font-serif text-base font-semibold text-ink-charcoal">
          {title}
        </h3>
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
