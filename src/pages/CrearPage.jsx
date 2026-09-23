import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createEvent } from "../services/api";

const EVENT_TYPES = [
  ["", "Selecciona un tipo"],
  ["boda", "Boda"],
  ["social", "Social"],
  ["corporativo", "Corporativo"],
  ["cumpleanos", "Cumpleaños"],
  ["otro", "Otro"],
];

const initialSubtasks = [
  { title: "Reservar salón", targetDate: "", estimatedHours: "4" },
  { title: "Enviar invitaciones", targetDate: "", estimatedHours: "2" },
  { title: "Confirmar catering", targetDate: "", estimatedHours: "3" },
];

const inputClass = "w-full rounded-sharp border border-sepia-border bg-paper-card px-3 py-2 text-sm text-ink-charcoal focus:border-terracotta focus:outline-none focus:ring-2 focus:ring-terracotta/40";

export default function CrearPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", type: "", contact: "", dateTime: "", place: "" });
  const [subtasks, setSubtasks] = useState(initialSubtasks);
  const [fieldErrors, setFieldErrors] = useState({});
  const [generalError, setGeneralError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  function changeEvent(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
  }

  function changeSubtask(index, field, value) {
    setSubtasks((current) => current.map((subtask, i) => i === index ? { ...subtask, [field]: value } : subtask));
    setFieldErrors((current) => ({ ...current, [`subtasks.${index}.${field}`]: undefined }));
  }

  function validate() {
    const errors = {};
    if (!form.name.trim()) errors.name = "El nombre del evento es obligatorio.";
    if (!form.type) errors.type = "Selecciona un tipo de evento.";
    if (!form.dateTime || Number.isNaN(new Date(form.dateTime).getTime())) {
      errors.dateTime = "Ingresa una fecha y hora válidas para el evento.";
    }
    subtasks.forEach((task, index) => {
      if (!task.title.trim()) errors[`subtasks.${index}.title`] = "El nombre de la gestión es obligatorio.";
      if (!task.targetDate) errors[`subtasks.${index}.targetDate`] = "Elige una fecha objetivo.";
      if (!task.estimatedHours || Number(task.estimatedHours) <= 0) {
        errors[`subtasks.${index}.estimatedHours`] = "Las horas deben ser mayores a 0.";
      }
    });
    return errors;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setGeneralError("");
    const errors = validate();
    setFieldErrors(errors);
    if (Object.keys(errors).length) return;

    setIsLoading(true);
    try {
      const created = await createEvent({
        ...form,
        dateTime: new Date(form.dateTime).toISOString(),
        subtasks: subtasks.map((task) => ({
          title: task.title.trim(),
          targetDate: task.targetDate,
          estimatedHours: Number(task.estimatedHours),
        })),
      });
      navigate(`/evento/${created.id}`, { state: { toast: "Evento y plan inicial creados" } });
    } catch (error) {
      const details = error.details ?? {};
      const nextErrors = {};
      for (const field of ["name", "type", "event_datetime", "eventDateTime"]) {
        if (details[field]) nextErrors[field === "event_datetime" || field === "eventDateTime" ? "dateTime" : field] = details[field][0];
      }
      if (Array.isArray(details.subtasks)) {
        details.subtasks.forEach((taskErrors, index) => {
          if (!taskErrors) return;
          if (taskErrors.name) nextErrors[`subtasks.${index}.title`] = taskErrors.name[0];
          if (taskErrors.target_date) nextErrors[`subtasks.${index}.targetDate`] = taskErrors.target_date[0];
          if (taskErrors.estimated_hours) nextErrors[`subtasks.${index}.estimatedHours`] = taskErrors.estimated_hours[0];
        });
      }
      setFieldErrors((current) => ({ ...current, ...nextErrors }));
      setGeneralError(error.message || "No se pudo guardar el evento. Intenta de nuevo.");
    } finally {
      setIsLoading(false);
    }
  }

  const fieldError = (key) => fieldErrors[key] && <p className="mt-1 text-xs text-crimson-urgent">{fieldErrors[key]}</p>;

  return (
    <main className="max-w-3xl mx-auto px-4 md:px-8 py-8">
      <header className="mb-7">
        <p className="font-mono-stamp text-xs uppercase tracking-widest text-terracotta-dark">Planificación</p>
        <h1 className="mt-1 font-serif text-4xl font-semibold text-ink-charcoal">Crear evento</h1>
        <p className="mt-2 text-sm text-ink-muted">Registra el evento y deja listo su plan logístico inicial.</p>
      </header>

      <form onSubmit={handleSubmit} noValidate className="space-y-6">
        <section className="space-y-4 rounded-sharp border border-sepia-border bg-paper-card p-5">
          <h2 className="font-serif text-xl font-semibold text-ink-charcoal">Datos del evento</h2>
          <div>
            <label htmlFor="event-name" className="mb-1 block text-sm font-medium text-ink-charcoal">Nombre del evento</label>
            <input id="event-name" className={inputClass} value={form.name} onChange={(e) => changeEvent("name", e.target.value)} aria-invalid={Boolean(fieldErrors.name)} aria-describedby={fieldErrors.name ? "event-name-error" : undefined} />
            {fieldErrors.name && <p id="event-name-error" className="mt-1 text-xs text-crimson-urgent">{fieldErrors.name}</p>}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="event-type" className="mb-1 block text-sm font-medium text-ink-charcoal">Tipo de evento</label>
              <select id="event-type" className={inputClass} value={form.type} onChange={(e) => changeEvent("type", e.target.value)} aria-invalid={Boolean(fieldErrors.type)}>
                {EVENT_TYPES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
              {fieldError("type")}
            </div>
            <div>
              <label htmlFor="event-datetime" className="mb-1 block text-sm font-medium text-ink-charcoal">Fecha y hora del evento</label>
              <input id="event-datetime" type="datetime-local" className={inputClass} value={form.dateTime} onChange={(e) => changeEvent("dateTime", e.target.value)} aria-invalid={Boolean(fieldErrors.dateTime)} />
              {fieldError("dateTime")}
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="event-contact" className="mb-1 block text-sm font-medium text-ink-charcoal">Cliente / contacto <span className="font-normal text-ink-muted">(opcional)</span></label>
              <input id="event-contact" className={inputClass} value={form.contact} onChange={(e) => changeEvent("contact", e.target.value)} />
            </div>
            <div>
              <label htmlFor="event-place" className="mb-1 block text-sm font-medium text-ink-charcoal">Lugar <span className="font-normal text-ink-muted">(opcional)</span></label>
              <input id="event-place" className={inputClass} value={form.place} onChange={(e) => changeEvent("place", e.target.value)} />
            </div>
          </div>
        </section>

        <section className="space-y-4 rounded-sharp border border-sepia-border bg-paper-card p-5">
          <div>
            <h2 className="font-serif text-xl font-semibold text-ink-charcoal">Plan logístico inicial</h2>
            <p className="mt-1 text-sm text-ink-muted">Define un plazo y las horas estimadas para cada gestión.</p>
          </div>
          {subtasks.map((task, index) => (
            <fieldset key={task.title} className="grid gap-3 rounded-sharp border border-sepia-border/70 bg-paper-base p-4 sm:grid-cols-[1.4fr_1fr_0.7fr]">
              <legend className="sr-only">Gestión {index + 1}</legend>
              <div>
                <label htmlFor={`subtask-name-${index}`} className="mb-1 block text-xs font-medium text-ink-charcoal">Nombre de la gestión</label>
                <input id={`subtask-name-${index}`} className={inputClass} value={task.title} onChange={(e) => changeSubtask(index, "title", e.target.value)} aria-invalid={Boolean(fieldErrors[`subtasks.${index}.title`])} />
                {fieldError(`subtasks.${index}.title`)}
              </div>
              <div>
                <label htmlFor={`subtask-date-${index}`} className="mb-1 block text-xs font-medium text-ink-charcoal">Fecha objetivo</label>
                <input id={`subtask-date-${index}`} type="date" className={inputClass} value={task.targetDate} onChange={(e) => changeSubtask(index, "targetDate", e.target.value)} aria-invalid={Boolean(fieldErrors[`subtasks.${index}.targetDate`])} />
                {fieldError(`subtasks.${index}.targetDate`)}
              </div>
              <div>
                <label htmlFor={`subtask-hours-${index}`} className="mb-1 block text-xs font-medium text-ink-charcoal">Horas estimadas</label>
                <input id={`subtask-hours-${index}`} type="number" min="0.1" step="0.1" className={inputClass} value={task.estimatedHours} onChange={(e) => changeSubtask(index, "estimatedHours", e.target.value)} aria-invalid={Boolean(fieldErrors[`subtasks.${index}.estimatedHours`])} />
                {fieldError(`subtasks.${index}.estimatedHours`)}
              </div>
            </fieldset>
          ))}
        </section>

        {generalError && <div role="alert" className="rounded-sharp border border-crimson-urgent/30 bg-crimson-paper px-4 py-3 text-sm text-crimson-urgent">{generalError}</div>}

        <div className="flex justify-end gap-3">
          <button type="button" disabled={isLoading} onClick={() => navigate(-1)} className="rounded-sharp border border-sepia-border bg-paper-card px-4 py-2 text-sm font-medium text-ink-charcoal hover:bg-paper-linen disabled:opacity-60">Cancelar</button>
          <button type="submit" disabled={isLoading} className="rounded-sharp bg-terracotta px-5 py-2 text-sm font-semibold text-paper-card hover:bg-terracotta-dark disabled:cursor-wait disabled:opacity-60">{isLoading ? "Guardando…" : "Crear evento y plan"}</button>
        </div>
      </form>
    </main>
  );
}
