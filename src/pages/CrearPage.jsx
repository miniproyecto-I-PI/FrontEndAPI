import ComingSoonPlaceholder from "../components/common/ComingSoonPlaceholder";

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createEvent } from "../services/api";
/**
 * CrearPage.jsx — route "/crear" (Arquitectura de Información C5, §3; T1).
 *
 * Implements US-01 ("Crear evento") and US-02 ("Agregar gestiones logísticas
 * iniciales") from the Backlog Refinado (C4), planned for Sprint 1.
 *
 * INTEGRATION NOTE for whoever builds this next: the form should call
 * `createEvent()` from services/api.js — that function already documents
 * the expected payload shape and the real `POST /events` endpoint it will
 * call once the backend exists.
 * 
 * US- 1. Done :)
 */

/* Old code. Template for sprint 0
export default function CrearPage() {
  return (
    <ComingSoonPlaceholder
      title="Crear evento"
      description="Aquí vivirá el formulario para crear un evento y su plan inicial de gestiones logísticas (US-01, US-02)."
      plannedSprint="Sprint 1"
    />
  );
}
  */

//New code

const EVENT_TYPES = [
  { value: "", label: "Selecciona un tipo" },
  { value: "boda", label: "Boda" },
  { value: "social", label: "Social" },
  { value: "corporativo", label: "Corporativo" },
  { value: "cumpleanos", label: "Cumpleaños" },
  { value: "otro", label: "Otro" },
];

const initialForm = {
  name: "",
  type: "",
  contact: "",
  dateTime: "",
  place: "",
};

/**
 * CrearPage.jsx — route "/crear" (US-01, T1).
 * Formulario controlado con validación en cliente, estados de
 * loading/éxito/error, y persistencia vía POST /events (services/api.js).
 */
export default function CrearPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState(initialForm);
  const [fieldErrors, setFieldErrors] = useState({});
  const [generalError, setGeneralError] = useState(null);
  const [status, setStatus] = useState("idle"); // idle | loading | success

  function handleChange(field) {
    return (e) => {
      const value = e.target.value;
      setForm((prev) => ({ ...prev, [field]: value }));
      // Limpiar el error de ESE campo apenas el usuario lo corrige
      setFieldErrors((prev) => {
        if (!prev[field]) return prev;
        const next = { ...prev };
        delete next[field];
        return next;
      });
    };
  }

  function validate(values) {
    const errors = {};

    if (!values.name.trim()) {
      errors.name = "El nombre del evento es obligatorio.";
    }

    if (!values.type) {
      errors.type = "Selecciona un tipo de evento.";
    }

    if (!values.dateTime) {
      errors.dateTime = "La fecha y hora del evento son obligatorias.";
    } else if (Number.isNaN(new Date(values.dateTime).getTime())) {
      errors.dateTime = "La fecha ingresada no es válida.";
    }

    return errors;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setGeneralError(null);

    const errors = validate(form);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return; // No se llama a la API si hay errores de validación
    }

    setStatus("loading");
    try {
      await createEvent(form);
      setStatus("success");
      //Llama al toast
      navigate("/hoy", { state: { toast: "Evento creado exitosamente" } });
    } catch (err) {
      setStatus("idle");
      setGeneralError(err.message || "Ocurrió un error inesperado. Intenta de nuevo.");
    }
  }

  const isLoading = status === "loading";

  return (
    <div className="max-w-xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Crear evento</h1>

      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        {/* Nombre */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Nombre del evento
          </label>
          <input
            id="name"
            type="text"
            value={form.name}
            onChange={handleChange("name")}
            aria-invalid={Boolean(fieldErrors.name)}
            aria-describedby={fieldErrors.name ? "name-error" : undefined}
            className={`w-full rounded-md border px-3 py-2 text-sm
              focus:outline-none focus:ring-2 focus:ring-offset-1
              ${fieldErrors.name
                ? "border-red-400 focus:ring-red-400"
                : "border-gray-300 focus:ring-blue-500"}`}
          />
          {fieldErrors.name && (
            <p id="name-error" className="mt-1 text-sm text-red-600">
              {fieldErrors.name}
            </p>
          )}
        </div>

        {/* Tipo */}
        <div>
          <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
            Tipo de evento
          </label>
          <select
            id="type"
            value={form.type}
            onChange={handleChange("type")}
            aria-invalid={Boolean(fieldErrors.type)}
            aria-describedby={fieldErrors.type ? "type-error" : undefined}
            className={`w-full rounded-md border px-3 py-2 text-sm bg-white
              focus:outline-none focus:ring-2 focus:ring-offset-1
              ${fieldErrors.type
                ? "border-red-400 focus:ring-red-400"
                : "border-gray-300 focus:ring-blue-500"}`}
          >
            {EVENT_TYPES.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          {fieldErrors.type && (
            <p id="type-error" className="mt-1 text-sm text-red-600">
              {fieldErrors.type}
            </p>
          )}
        </div>

        {/* Cliente/contacto (opcional) */}
        <div>
          <label htmlFor="contact" className="block text-sm font-medium text-gray-700 mb-1">
            Cliente / contacto <span className="text-gray-400">(opcional)</span>
          </label>
          <input
            id="contact"
            type="text"
            value={form.contact}
            onChange={handleChange("contact")}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
          />
        </div>

        {/* Fecha/hora */}
        <div>
          <label htmlFor="dateTime" className="block text-sm font-medium text-gray-700 mb-1">
            Fecha y hora del evento
          </label>
          <input
            id="dateTime"
            type="datetime-local"
            value={form.dateTime}
            onChange={handleChange("dateTime")}
            aria-invalid={Boolean(fieldErrors.dateTime)}
            aria-describedby={fieldErrors.dateTime ? "dateTime-error" : undefined}
            className={`w-full rounded-md border px-3 py-2 text-sm
              focus:outline-none focus:ring-2 focus:ring-offset-1
              ${fieldErrors.dateTime
                ? "border-red-400 focus:ring-red-400"
                : "border-gray-300 focus:ring-blue-500"}`}
          />
          {fieldErrors.dateTime && (
            <p id="dateTime-error" className="mt-1 text-sm text-red-600">
              {fieldErrors.dateTime}
            </p>
          )}
        </div>

        {/* Lugar / plazo límite (opcional) */}
        <div>
          <label htmlFor="place" className="block text-sm font-medium text-gray-700 mb-1">
            Lugar / plazo límite <span className="text-gray-400">(opcional)</span>
          </label>
          <input
            id="place"
            type="text"
            value={form.place}
            onChange={handleChange("place")}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
          />
        </div>

        {/* Error general (no ligado a un campo) */}
        {generalError && (
          <div role="alert" className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
            {generalError}
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white
            hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1
            disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isLoading ? "Guardando..." : "Guardar"}
        </button>
      </form>
    </div>
  );
}
