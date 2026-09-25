import { useEffect, useRef, useState } from "react";
import { toDatetimeLocalValue } from "../../utils/dateUtils";

const EVENT_TYPES = [
  { value: "", label: "Selecciona un tipo" },
  { value: "boda", label: "Boda" },
  { value: "social", label: "Social" },
  { value: "corporativo", label: "Corporativo" },
  { value: "cumpleanos", label: "Cumpleaños" },
  { value: "otro", label: "Otro" },
];

/**
 * EditEventModal.jsx — US-03, escenario "Editar evento".
 * Misma estructura de campos que CrearPage (US-01), en modo edición.
 */
export default function EditEventModal({ initialEvent, onCancel, onSubmit }) {
  const [form, setForm] = useState(() => ({
    name: initialEvent.name ?? "",
    type: initialEvent.type ?? "",
    contact: initialEvent.contact ?? "",
    dateTime: toDatetimeLocalValue(initialEvent.dateTime),
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
      if (e.key === "Escape") onCancel();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  function handleChange(field) {
    return (e) => {
      const value = e.target.value;
      setForm((prev) => ({ ...prev, [field]: value }));
      setFieldErrors((prev) => {
        if (!prev[field]) return prev;
        const next = { ...prev };
        delete next[field];
        return next;
      });
    };
  }

  function validate() {
    const errors = {};
    if (!form.name.trim()) errors.name = "El nombre del evento es obligatorio.";
    if (!form.type) errors.type = "Selecciona un tipo de evento.";
    if (!form.dateTime) {
      errors.dateTime = "La fecha y hora del evento son obligatorias.";
    } else if (Number.isNaN(new Date(form.dateTime).getTime())) {
      errors.dateTime = "La fecha ingresada no es válida.";
    }
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
      await onSubmit({
        name: form.name.trim(),
        type: form.type,
        contact: form.contact,
        dateTime: new Date(form.dateTime).toISOString(),
        place: form.place,
      });
    } catch (err) {
      setStatus("idle");
      setGeneralError(err.message || "No se pudo actualizar el evento. Intenta de nuevo.");
    }
  }

  const isLoading = status === "loading";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-event-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-charcoal/40 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onCancel()}
    >
      <div className="relative w-full max-w-lg bg-paper-card border border-sepia-border rounded-sharp p-6 shadow-xl warm-card-shadow max-h-[90vh] overflow-y-auto">
        <h2 id="edit-event-title" className="font-serif text-2xl font-bold text-ink-charcoal">
          Editar evento
        </h2>

        <form onSubmit={handleSubmit} noValidate className="mt-4 space-y-4">
          <div>
            <label htmlFor="edit-name" className="block font-body text-xs font-medium text-ink-muted mb-1">
              Nombre del evento
            </label>
            <input
              id="edit-name"
              ref={firstInputRef}
              type="text"
              value={form.name}
              onChange={handleChange("name")}
              aria-invalid={Boolean(fieldErrors.name)}
              aria-describedby={fieldErrors.name ? "edit-name-error" : undefined}
              className={`w-full rounded-sharp border px-3 py-2 font-body text-sm text-ink-charcoal focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-paper-card ${
                fieldErrors.name
                  ? "border-crimson-urgent focus:ring-crimson-urgent"
                  : "border-sepia-border focus:border-terracotta focus:ring-terracotta"
              }`}
            />
            {fieldErrors.name && (
              <p id="edit-name-error" className="mt-1 font-body text-xs text-crimson-urgent">
                {fieldErrors.name}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="edit-type" className="block font-body text-xs font-medium text-ink-muted mb-1">
              Tipo de evento
            </label>
            <select
              id="edit-type"
              value={form.type}
              onChange={handleChange("type")}
              aria-invalid={Boolean(fieldErrors.type)}
              aria-describedby={fieldErrors.type ? "edit-type-error" : undefined}
              className={`w-full rounded-sharp border px-3 py-2 font-body text-sm text-ink-charcoal bg-paper-card focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-paper-card ${
                fieldErrors.type
                  ? "border-crimson-urgent focus:ring-crimson-urgent"
                  : "border-sepia-border focus:border-terracotta focus:ring-terracotta"
              }`}
            >
              {EVENT_TYPES.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            {fieldErrors.type && (
              <p id="edit-type-error" className="mt-1 font-body text-xs text-crimson-urgent">
                {fieldErrors.type}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="edit-contact" className="block font-body text-xs font-medium text-ink-muted mb-1">
              Cliente / contacto <span className="text-ink-muted/70">(opcional)</span>
            </label>
            <input
              id="edit-contact"
              type="text"
              value={form.contact}
              onChange={handleChange("contact")}
              className="w-full rounded-sharp border border-sepia-border px-3 py-2 font-body text-sm text-ink-charcoal focus:outline-none focus:border-terracotta focus:ring-2 focus:ring-terracotta focus:ring-offset-1 focus:ring-offset-paper-card"
            />
          </div>

          <div>
            <label htmlFor="edit-dateTime" className="block font-body text-xs font-medium text-ink-muted mb-1">
              Fecha y hora del evento
            </label>
            <input
              id="edit-dateTime"
              type="datetime-local"
              value={form.dateTime}
              onChange={handleChange("dateTime")}
              aria-invalid={Boolean(fieldErrors.dateTime)}
              aria-describedby={fieldErrors.dateTime ? "edit-dateTime-error" : undefined}
              className={`w-full rounded-sharp border px-3 py-2 font-body text-sm text-ink-charcoal focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-paper-card ${
                fieldErrors.dateTime
                  ? "border-crimson-urgent focus:ring-crimson-urgent"
                  : "border-sepia-border focus:border-terracotta focus:ring-terracotta"
              }`}
            />
            {fieldErrors.dateTime && (
              <p id="edit-dateTime-error" className="mt-1 font-body text-xs text-crimson-urgent">
                {fieldErrors.dateTime}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="edit-place" className="block font-body text-xs font-medium text-ink-muted mb-1">
              Lugar / plazo límite <span className="text-ink-muted/70">(opcional)</span>
            </label>
            <input
              id="edit-place"
              type="text"
              value={form.place}
              onChange={handleChange("place")}
              className="w-full rounded-sharp border border-sepia-border px-3 py-2 font-body text-sm text-ink-charcoal focus:outline-none focus:border-terracotta focus:ring-2 focus:ring-terracotta focus:ring-offset-1 focus:ring-offset-paper-card"
            />
          </div>

          {generalError && (
            <div role="alert" className="rounded-sharp bg-crimson-paper border border-crimson-urgent/30 px-3 py-2 font-body text-xs text-crimson-urgent">
              {generalError}
            </div>
          )}

          <div className="flex items-center justify-end gap-2.5 pt-6 mt-2">
            <button
              type="button"
              onClick={onCancel}
              disabled={isLoading}
              className="px-4 py-2 rounded-sharp bg-paper-base hover:bg-paper-linen border border-sepia-border text-ink-charcoal font-body text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-terracotta focus:ring-offset-1 disabled:opacity-60"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2 rounded-sharp bg-terracotta hover:bg-terracotta-dark text-[#FAF6F0] font-body text-xs font-semibold tracking-wide border border-terracotta-dark shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-terracotta focus:ring-offset-1 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading ? "Guardando…" : "Guardar cambios"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}