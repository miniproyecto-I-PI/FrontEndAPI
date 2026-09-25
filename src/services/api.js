/**
 * services/api.js
 * ---------------------------------------------------------------------------
 * Conexión real con el backend Django (DRF) desplegado en Render.
 *
 * El backend usa nombres de campo distintos a los del frontend (name vs
 * eventName, target_date vs targetDate, etc.), así que TODA la traducción
 * vive aquí: los componentes siguen usando los mismos nombres de siempre.
 *
 * El backend envuelve las respuestas en { success, data, message }.
 * Aquí se desenvuelve `data` antes de devolverlo.
 */
// Old comment, pre integration with backend:
/**
 * services/api.js
 * ---------------------------------------------------------------------------
 * SINGLE INTEGRATION POINT with the backend.
 * Every function here is named after (and documented with) the endpoint it
 * will call once the backend team implements it, per Backlog Refinado (C4)
 * and Arquitectura de Información (C5). Right now, Sprint 0 has no backend
 * yet (TS-01/TS-02/TS-07 are still pending), so each function resolves with
 * mock data instead of calling `fetch`.
 *
 * WHY THIS FILE EXISTS (and why components never import mock data directly):
 * When the backend is ready, only this file needs to change — swap the mock
 * implementation for a real `fetch`/axios call with the same return shape,
 * and every hook/page/component in the app keeps working unmodified. This is
 * the seam the rest of the app is built around.
 *
 * Real base URL is read from an environment variable so each environment
 * (local, staging, prod) can point to a different API without code changes.
 * See `.env.example`.
 */
// ---------------------------------------------------------------------------
// Configuración
// ---------------------------------------------------------------------------

export const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8000/api";

/** Simula latencia para que el estado loading se note en desarrollo. */
function delay(ms = 200) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Helper central de fetch. Desenvuelve { success, data, message } y lanza
 * un Error con mensaje legible si algo falla.
 */
async function apiFetch(path, options = {}) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });

  let body = null;
  try {
    body = await res.json();
  } catch {
    // respuesta sin JSON (ej. 204 No Content)
  }

  if (!res.ok) {
    const message =
      body?.message ||
      body?.detail ||
      (body && typeof body === "object" ? Object.values(body).flat()[0] : null) ||
      `Error ${res.status}`;
    throw new Error(message);
  }

  // El backend envuelve todo en { success, data }. Si no viene envuelto,
  // devolvemos el body tal cual (por si algún endpoint no lo hace).
  if (body && typeof body === "object" && "success" in body && "data" in body) {
    return body.data;
  }
  return body;
}

// ---------------------------------------------------------------------------
// Mapeo Backend → Frontend
// ---------------------------------------------------------------------------

/**
 * Evento del backend → Evento del frontend.
 * Backend: { id, name, type, client_contact, event_datetime, place, ... }
 * Frontend: { id, name, type, contact, dateTime, place }
 */
function mapEventFromBackend(raw) {
  if (!raw) return null;
  return {
    id: String(raw.id), // el frontend usa IDs como string en las rutas
    name: raw.name,
    type: (raw.type || "").toLowerCase(),
    contact: raw.client_contact ?? "",
    dateTime: raw.event_datetime ?? "",
    place: raw.place ?? "",
  };
}

/**
 * Subtarea del backend → Gestión del frontend.
 * Backend: { id, event, name, target_date, estimated_hours, status, note, ... }
 * Frontend: { id, eventId, title, targetDate, estimatedHours, status, ... }
 */
function mapSubtaskFromBackend(raw) {
  if (!raw) return null;
  return {
    id: String(raw.id),
    eventId: String(raw.event),
    title: raw.name,
    targetDate: raw.target_date, // "YYYY-MM-DD"
    estimatedHours: Number(raw.estimated_hours),
    status: raw.status,
    note: raw.note ?? "",
  };
}

// ---------------------------------------------------------------------------
// US-04 — Vista "Hoy" (SIN backend todavía: GET /today no existe)
// ---------------------------------------------------------------------------

/**
 * GET /today  — PENDIENTE en el backend.
 * Mientras no exista el endpoint, seguimos usando mock.
 */
export async function getToday({ simulateError = false } = {}) {
  await delay();
  if (simulateError) throw new Error("No pudimos cargar tus gestiones");
  // TODO(backend, Sprint 2): GET `${API_BASE_URL}/today`
  const { mockGestiones } = await import("../data/mockGestiones");
  return structuredClone(mockGestiones);
}

// ---------------------------------------------------------------------------
// US-09 — Marcar / posponer (SIN backend todavía)
// ---------------------------------------------------------------------------

export async function markGestionAsDone(id) {
  await delay(250);
  // TODO(backend, Sprint 4): PATCH /subtasks/:id { status: 'EJECUTADA' }
  return { id, status: "EJECUTADA", doneAt: new Date().toISOString() };
}

export async function postponeGestion(id, note = "") {
  await delay(250);
  // TODO(backend, Sprint 4): PATCH /subtasks/:id { status: 'POSPUESTA', note }
  return { id, status: "POSPUESTA", note };
}

export async function rescheduleGestion(id, newTargetDateISO) {
  await delay(300);
  // TODO(backend, Sprint 3): PATCH /subtasks/:id { target_date: newTargetDateISO }
  return { id, targetDate: newTargetDateISO };
}

// ---------------------------------------------------------------------------
// US-01 — Eventos
// ---------------------------------------------------------------------------

/**
 * POST /events
 * Recibe el formulario del frontend { name, type, contact, dateTime, place }
 * y lo traduce al payload que espera el backend.
 */
export async function createEvent(form) {
  const payload = {
    name: form.name,
    type: form.type.toUpperCase(), // backend espera BODA, SOCIAL, etc.
    client_contact: form.contact ?? "",
    event_datetime: new Date(form.dateTime).toISOString(),
    place: form.place ?? "",
  };

  

  const raw = await apiFetch("/events", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  return mapEventFromBackend(raw);
}

/** Función con datos mock
 * GET /events
 * Lista de eventos para /eventos. Backend todavía no devuelve `progress` ni
 * `status`, así que por ahora usamos mock (mismo patrón que getToday).
 * TODO(backend, Sprint X): reemplazar por fetch real y extender
 * mapEventFromBackend para traducir `progress` / `status`.
 */
/** 
export async function getEvents({ simulateError = false } = {}) {
  await delay();
  if (simulateError) throw new Error("No pudimos cargar tus eventos");
  const { mockEvents } = await import("../data/mockEvents");
  return structuredClone(mockEvents);
}
*/

/** Función conectada con el backend, falta que el backend envíe "progreso" y "estado"
 * GET /events
 * Listado real del backend. El backend todavía no expone `progress` ni
 * `status` por evento (ver follow-up en el mapper), así que la tabla los
 * mostrará como "—" / estado neutro por ahora.
 * TODO(backend, Sprint X): extender mapEventFromBackend cuando el
 * serializador incluya progress / status.
 */
export async function getEvents({ simulateError = false } = {}) {
  if (simulateError) throw new Error("No pudimos cargar tus eventos");
  const raw = await apiFetch("/events");
  const list = Array.isArray(raw) ? raw : raw?.results ?? [];
  return list.map(mapEventFromBackend).filter(Boolean);
}

/**
 * GET /events + GET /events/:id/subtasks (por evento, en paralelo)
 * Enriquece cada evento con `progress: { done, total }` para la tabla de
 * /eventos. No hay endpoint bulk, así que hacemos N requests en paralelo.
 *
 * Si falla el fetch de subtareas de un evento puntual, ese evento queda con
 * `progress: null` (la tabla muestra "—") sin tirar abajo el listado.
 *
 * TODO(backend, Sprint X): un campo `progress` en el serializador de Event
 * eliminaría este N+1.
 */
export async function getEventsWithProgress() {
  const events = await getEvents();
  return Promise.all(
    events.map(async (evt) => {
      try {
        const subs = await getEventSubtasks(evt.id);
        const done = subs.filter((s) => s.status === "EJECUTADA").length;
        return { ...evt, progress: { done, total: subs.length } };
      } catch {
        return { ...evt, progress: null };
      }
    })
  );
}

/**
 * GET /events/:id
 */
export async function getEventById(id) {
  const raw = await apiFetch(`/events/${id}`);
  return mapEventFromBackend(raw);
}

/**
 * PUT /events/:id
 */
export async function updateEvent(id, patch) {
  const payload = {};
  if (patch.name !== undefined) payload.name = patch.name;
  if (patch.type !== undefined) payload.type = patch.type.toUpperCase();
  if (patch.contact !== undefined) payload.client_contact = patch.contact;
  if (patch.dateTime !== undefined)
    payload.event_datetime = new Date(patch.dateTime).toISOString();
  if (patch.place !== undefined) payload.place = patch.place;

  const raw = await apiFetch(`/events/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });

  return mapEventFromBackend(raw);
}

/**
 * DELETE /events/:id  (cascada: el backend borra sus subtareas)
 */
export async function deleteEvent(id) {
  await apiFetch(`/events/${id}`, { method: "DELETE" });
  return { id, deleted: true };
}

// ---------------------------------------------------------------------------
// US-02 — Subtareas logísticas
// ---------------------------------------------------------------------------

/**
 * GET /events/:eventId/subtasks
 */
export async function getEventSubtasks(eventId) {
  const raw = await apiFetch(`/events/${eventId}/subtasks`);
  const list = Array.isArray(raw) ? raw : raw?.results ?? [];
  return list.map(mapSubtaskFromBackend);
}

/**
 * POST /events/:eventId/subtasks
 * Recibe { title, targetDate, estimatedHours } del modal y traduce.
 */
export async function addSubtask(eventId, form) {
  const payload = {
    name: form.title,
    target_date: form.targetDate.split("T")[0], // "YYYY-MM-DD"
    estimated_hours: form.estimatedHours,
  };

  const raw = await apiFetch(`/events/${eventId}/subtasks`, {
    method: "POST",
    body: JSON.stringify(payload),
  });

  return mapSubtaskFromBackend(raw);
}

/**
 * PATCH /subtasks/:id  (US-03 — editar)
 */
export async function updateSubtask(id, patch) {
  const payload = {};
  if (patch.title !== undefined) payload.name = patch.title;
  if (patch.targetDate !== undefined)
    payload.target_date = patch.targetDate.split("T")[0];
  if (patch.estimatedHours !== undefined)
    payload.estimated_hours = patch.estimatedHours;
  if (patch.status !== undefined) payload.status = patch.status;
  if (patch.note !== undefined) payload.note = patch.note;

  const raw = await apiFetch(`/subtasks/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });

  return mapSubtaskFromBackend(raw);
}

/**
 * DELETE /subtasks/:id  (US-03 — eliminar)
 */
export async function deleteSubtask(id) {
  await apiFetch(`/subtasks/${id}`, { method: "DELETE" });
  return { id, deleted: true };
}

// ---------------------------------------------------------------------------
// US-12 / US-11 — pendientes
// ---------------------------------------------------------------------------

export const dailyLimitApi = {
  async get() {
    await delay(200);
    return { dailyLimitHours: 6 };
  },
  async update(hours) {
    await delay(300);
    return { dailyLimitHours: hours };
  },
};

export async function login(_credentials) {
  await delay(400);
  throw new Error("Login aún no disponible — Sprint 2 (US-11).");
}