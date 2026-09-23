import { useEffect, useRef, useState } from "react";
import { toDateInputValue } from "../../utils/dateUtils";

/**
 * AddSubtaskModal.jsx
 * US-02 (crear) + US-03 (editar). Un solo modal, dos modos:
 *   - sin `initialValues` → "Agregar gestión"
 *   - con `initialValues` → "Editar gestión"
 * * Modal para agregar una gestión logística a un evento (US-02).
 * Sigue el patrón visual de RescheduleModal.jsx (overlay z-50, backdrop-blur,
 * clic fuera cierra, rounded-sharp, tipografía serif en el título) y el
 * patrón de formularios de CrearPage.jsx (form controlado, validate()
 * separada, fieldErrors por campo + generalError de red, status idle/loading).
 *
 * Extras sobre RescheduleModal (por TS-06 — accesibilidad mínima):
 *   - Escape cierra el modal.
 *   - Foco inicial en el primer input.
 *   - focus:ring visible en input y botones.
 *
 * @param {() => void} onCancel
 * @param {(payload: { title: string, targetDate: string, estimatedHours: number }) => Promise<void>} onSubmit
 */
const emptyForm = { title: "", targetDate: "", estimatedHours: "" };

export default function AddSubtaskModal({ initialValues, onCancel, onSubmit }) {
  const isEdit = Boolean(initialValues);

  const [form, setForm] = useState(() =>
    isEdit
      ? {
          title: initialValues.title ?? "",
          targetDate: toDateInputValue(initialValues.targetDate),
          estimatedHours: String(initialValues.estimatedHours ?? ""),
        }
      : emptyForm
  );
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
    if (!form.title.trim()) errors.title = "El nombre es obligatorio.";
    if (!form.targetDate) errors.targetDate = "Elige una fecha objetivo.";
    const hours = Number(form.estimatedHours);
    if (form.estimatedHours === "" || Number.isNaN(hours)) {
      errors.estimatedHours = "Las horas estimadas son obligatorias.";
    } else if (hours <= 0) {
      errors.estimatedHours = "Las horas deben ser mayores a 0.";
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
        title: form.title.trim(),
        targetDate: form.targetDate,
        estimatedHours: Number(form.estimatedHours),
      });
    } catch (err) {
      setStatus("idle");
      setGeneralError(
        err.message || (isEdit ? "No se pudo actualizar la gestión. Intenta de nuevo." : "No se pudo agregar la gestión. Intenta de nuevo.")
      );
    }
  }

  const isLoading = status === "loading";
  const titleId = isEdit ? "edit-subtask-title" : "add-subtask-title";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-charcoal/40 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onCancel()}
    >
      <div className="relative w-full max-w-md bg-paper-card border border-sepia-border rounded-sharp p-6 shadow-xl warm-card-shadow">
        <h2 id={titleId} className="font-serif text-2xl font-bold text-ink-charcoal">
          {isEdit ? "Editar gestión" : "Agregar gestión"}
        </h2>
        <p className="font-body text-xs text-ink-muted mt-1">
          Ejemplos: reservar salón, enviar invitaciones, confirmar catering.
        </p>

        <form onSubmit={handleSubmit} noValidate className="mt-4 space-y-4">
          <div>
            <label htmlFor="subtask-title" className="block font-body text-xs font-medium text-ink-muted mb-1">
              Nombre de la gestión
            </label>
            <input
              id="subtask-title"
              ref={firstInputRef}
              type="text"
              value={form.title}
              onChange={handleChange("title")}
              placeholder="Ej: Reservar salón principal"
              aria-invalid={Boolean(fieldErrors.title)}
              aria-describedby={fieldErrors.title ? "subtask-title-error" : undefined}
              className={`w-full rounded-sharp border px-3 py-2 font-body text-sm text-ink-charcoal placeholder:text-ink-muted/60 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-paper-card ${
                fieldErrors.title
                  ? "border-crimson-urgent focus:ring-crimson-urgent"
                  : "border-sepia-border focus:border-terracotta focus:ring-terracotta"
              }`}
            />
            {fieldErrors.title && (
              <p id="subtask-title-error" className="mt-1 font-body text-xs text-crimson-urgent">
                {fieldErrors.title}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="subtask-date" className="block font-body text-xs font-medium text-ink-muted mb-1">
              Fecha objetivo
            </label>
            <input
              id="subtask-date"
              type="date"
              value={form.targetDate}
              onChange={handleChange("targetDate")}
              aria-invalid={Boolean(fieldErrors.targetDate)}
              aria-describedby={fieldErrors.targetDate ? "subtask-date-error" : undefined}
              className={`w-full rounded-sharp border px-3 py-2 font-body text-sm text-ink-charcoal focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-paper-card ${
                fieldErrors.targetDate
                  ? "border-crimson-urgent focus:ring-crimson-urgent"
                  : "border-sepia-border focus:border-terracotta focus:ring-terracotta"
              }`}
            />
            {fieldErrors.targetDate && (
              <p id="subtask-date-error" className="mt-1 font-body text-xs text-crimson-urgent">
                {fieldErrors.targetDate}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="subtask-hours" className="block font-body text-xs font-medium text-ink-muted mb-1">
              Horas estimadas
            </label>
            <input
              id="subtask-hours"
              type="number"
              inputMode="decimal"
              step="0.5"
              min="0.5"
              value={form.estimatedHours}
              onChange={handleChange("estimatedHours")}
              placeholder="Ej: 2.5"
              aria-invalid={Boolean(fieldErrors.estimatedHours)}
              aria-describedby={fieldErrors.estimatedHours ? "subtask-hours-error" : undefined}
              className={`w-full rounded-sharp border px-3 py-2 font-body text-sm text-ink-charcoal placeholder:text-ink-muted/60 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-paper-card ${
                fieldErrors.estimatedHours
                  ? "border-crimson-urgent focus:ring-crimson-urgent"
                  : "border-sepia-border focus:border-terracotta focus:ring-terracotta"
              }`}
            />
            {fieldErrors.estimatedHours && (
              <p id="subtask-hours-error" className="mt-1 font-body text-xs text-crimson-urgent">
                {fieldErrors.estimatedHours}
              </p>
            )}
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
              {isLoading ? "Guardando…" : isEdit ? "Guardar cambios" : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
