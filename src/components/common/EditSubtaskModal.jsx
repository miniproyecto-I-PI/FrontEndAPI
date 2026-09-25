import { useEffect, useRef, useState } from "react";
import { toDateInputValue } from "../../utils/dateUtils";

const STATUS_OPTIONS = [
  { key: "PENDIENTE", label: "Pendiente",  icon: null,    dot: "bg-terracotta" },
  { key: "EN_CURSO",  label: "En curso",   icon: null,    dot: "bg-ink-subtle" },
  { key: "EJECUTADA", label: "Completada", icon: "check", dot: null },
];

/**
 * EditSubtaskModal.jsx — US-03.
 * Reemplaza al viejo AddSubtaskModal (modo edit). El diseño Stitch (Sprint 1)
 * agrega selector de Estado y separa visualmente en dos bloques numerados.
 */
export default function EditSubtaskModal({
  initialSubtask,
  eventName,
  onCancel,
  onSubmit,
}) {
  const [form, setForm] = useState(() => ({
    title: initialSubtask.title ?? "",
    provider: initialSubtask.provider ?? "",
    estimatedHours: String(initialSubtask.estimatedHours ?? ""),
    date: toDateInputValue(initialSubtask.targetDate),
    time: "",
    status: initialSubtask.status ?? "PENDIENTE",
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
    if (!form.title.trim()) errors.title = "El título es obligatorio.";
    const hours = Number(form.estimatedHours);
    if (form.estimatedHours === "" || Number.isNaN(hours)) {
      errors.estimatedHours = "Indica las horas.";
    } else if (hours <= 0) {
      errors.estimatedHours = "Debe ser mayor a 0.";
    }
    if (!form.date) errors.date = "Elige una fecha límite.";
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
      const timeSuffix = form.time ? `T${form.time}:00` : "T12:00:00";
      const localDate = new Date(`${form.date}${timeSuffix}`);
      await onSubmit({
        title: form.title.trim(),
        provider: form.provider.trim(),
        estimatedHours: Number(form.estimatedHours),
        targetDate: localDate.toISOString(),
        status: form.status,
      });
    } catch (err) {
      setStatus("idle");
      setGeneralError(
        err.message || "No se pudo actualizar la gestión. Intenta de nuevo."
      );
    }
  }

  const isLoading = status === "loading";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-subtask-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-charcoal/50 backdrop-blur-sm overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isLoading) onCancel();
      }}
    >
      <div className="relative w-full max-w-2xl bg-paper-card border border-sepia-border rounded-sharp warm-card-shadow overflow-hidden flex flex-col max-h-[90vh] my-auto">
        <div className="h-1 w-full bg-terracotta flex-shrink-0" />

        <div className="px-6 md:px-8 pt-6 pb-4 border-b border-sepia-border flex items-start justify-between gap-4 flex-shrink-0">
          <div>
            <h2
              id="edit-subtask-title"
              className="font-serif text-2xl font-bold text-ink-charcoal tracking-tight"
            >
              Editar gestión
            </h2>
            <p className="font-body text-xs md:text-sm text-ink-muted mt-1">
              Modifica los parámetros operativos de la subtarea
              {eventName ? (
                <>
                  {" "}para{" "}
                  <strong className="text-ink-charcoal font-medium">
                    {eventName}
                  </strong>
                </>
              ) : null}
              .
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

        <form
          onSubmit={handleSubmit}
          noValidate
          className="p-6 md:p-8 overflow-y-auto flex-1 space-y-6"
        >
          <section className="bg-paper-card border border-sepia-border rounded-sharp p-5 md:p-6 space-y-6">
            <div className="space-y-4">
              <ModalSectionHeader
                number="1"
                title="Definición de la Gestión"
                badge="Paso indispensable"
              />

              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-3">
                  <label
                    htmlFor="edit-subtask-title-input"
                    className="block font-serif font-semibold text-xs md:text-sm text-ink-charcoal"
                  >
                    Título de la subtarea o gestión{" "}
                    <span className="text-crimson-urgent">*</span>
                  </label>
                  <span className="font-body text-[11px] text-ink-muted hidden sm:inline">
                    Visible en la hoja de ruta y en el resumen de Hoy
                  </span>
                </div>
                <input
                  id="edit-subtask-title-input"
                  ref={firstInputRef}
                  type="text"
                  value={form.title}
                  onChange={handleChange("title")}
                  aria-invalid={Boolean(fieldErrors.title)}
                  className={`input-editorial w-full px-3.5 py-2 text-sm text-ink-charcoal font-medium ${
                    fieldErrors.title ? "error-field" : ""
                  }`}
                />
                {fieldErrors.title && <FieldError msg={fieldErrors.title} />}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div className="space-y-1.5">
                  <label
                    htmlFor="edit-subtask-provider"
                    className="block font-serif font-semibold text-xs md:text-sm text-ink-charcoal"
                  >
                    Proveedor o encargado{" "}
                    <span className="font-body text-xs text-ink-muted font-normal">
                      (Opcional)
                    </span>
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted text-[17px] pointer-events-none">
                      storefront
                    </span>
                    <input
                      id="edit-subtask-provider"
                      type="text"
                      value={form.provider}
                      onChange={handleChange("provider")}
                      placeholder="Ej. Atelier Gastronomique"
                      className="input-editorial w-full pl-9 pr-3.5 py-2 text-sm text-ink-charcoal placeholder:text-ink-subtle placeholder:italic"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label
                    htmlFor="edit-subtask-hours"
                    className="block font-serif font-semibold text-xs md:text-sm text-ink-charcoal"
                  >
                    Dedicación estimada{" "}
                    <span className="font-body text-xs text-ink-muted font-normal">
                      (Carga de trabajo)
                    </span>
                  </label>
                  <div className="relative">
                    <input
                      id="edit-subtask-hours"
                      type="number"
                      step="0.5"
                      min="0.5"
                      inputMode="decimal"
                      value={form.estimatedHours}
                      onChange={handleChange("estimatedHours")}
                      aria-invalid={Boolean(fieldErrors.estimatedHours)}
                      className={`input-editorial w-full px-3.5 py-2 text-sm text-ink-charcoal font-mono-stamp ${
                        fieldErrors.estimatedHours ? "error-field" : ""
                      }`}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 font-mono-stamp text-xs text-ink-muted pointer-events-none">
                      horas
                    </span>
                  </div>
                  {fieldErrors.estimatedHours && (
                    <FieldError msg={fieldErrors.estimatedHours} />
                  )}
                </div>
              </div>
            </div>

            <div className="pt-5 border-t border-sepia-border space-y-4">
              <ModalSectionHeader
                number="2"
                title="Calendario y Estado"
                badge="Programación & Seguimiento"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label
                    htmlFor="edit-subtask-date"
                    className="block font-serif font-semibold text-xs md:text-sm text-ink-charcoal"
                  >
                    Fecha límite de resolución{" "}
                    <span className="text-crimson-urgent">*</span>
                  </label>
                  <input
                    id="edit-subtask-date"
                    type="date"
                    value={form.date}
                    onChange={handleChange("date")}
                    aria-invalid={Boolean(fieldErrors.date)}
                    className={`input-editorial w-full px-3.5 py-2 text-sm text-ink-charcoal font-mono-stamp ${
                      fieldErrors.date ? "error-field" : ""
                    }`}
                  />
                  {fieldErrors.date && <FieldError msg={fieldErrors.date} />}
                </div>
                <div className="space-y-1.5">
                  <label
                    htmlFor="edit-subtask-time"
                    className="block font-serif font-semibold text-xs md:text-sm text-ink-charcoal"
                  >
                    Hora límite o reunión{" "}
                    <span className="font-body text-xs text-ink-muted font-normal">
                      (Opcional)
                    </span>
                  </label>
                  <input
                    id="edit-subtask-time"
                    type="time"
                    value={form.time}
                    onChange={handleChange("time")}
                    className="input-editorial w-full px-3.5 py-2 text-sm text-ink-charcoal font-mono-stamp"
                  />
                </div>
              </div>

              <div className="space-y-2 pt-1">
                <label className="block font-serif font-semibold text-xs md:text-sm text-ink-charcoal">
                  Estado de la gestión
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  {STATUS_OPTIONS.map((s) => {
                    const isActive = form.status === s.key;
                    return (
                      <button
                        key={s.key}
                        type="button"
                        onClick={() =>
                          setForm((p) => ({ ...p, status: s.key }))
                        }
                        className={[
                          "flex items-center justify-center gap-2 p-2.5 rounded-sharp font-body text-xs transition-all",
                          isActive
                            ? "border-2 border-terracotta bg-terracotta-light/40 text-terracotta-dark font-semibold shadow-sm"
                            : "border border-sepia-border bg-paper-base hover:bg-paper-linen text-ink-charcoal font-medium",
                        ].join(" ")}
                      >
                        {s.dot && (
                          <span
                            className={`w-2 h-2 rounded-full ${
                              isActive ? "bg-terracotta" : s.dot
                            }`}
                          />
                        )}
                        {s.icon && (
                          <span
                            className={`material-symbols-outlined text-[16px] ${
                              isActive
                                ? "text-terracotta-dark"
                                : "text-ink-muted"
                            }`}
                          >
                            {s.icon}
                          </span>
                        )}
                        <span>{s.label}</span>
                      </button>
                    );
                  })}
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
                type="button"
                disabled={isLoading}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-paper-card hover:bg-paper-linen text-ink-charcoal font-body text-xs font-semibold rounded-sharp border border-sepia-border transition-colors disabled:opacity-60"
              >
                <span className="material-symbols-outlined text-[15px] text-ink-muted">
                  bookmark
                </span>
                <span>Guardar borrador</span>
              </button>
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