import { mockGestiones } from "../data/mockGestiones";

export const API_BASE_URL = (import.meta.env.VITE_API_URL || "http://localhost:8000/api").replace(/\/$/, "");

function toEvent(event) {
  if (!event) return event;
  return {
    ...event,
    type: event.type?.toLowerCase(),
    contact: event.client_contact ?? event.contact ?? "",
    dateTime: event.event_datetime ?? event.dateTime ?? "",
    subtasks: event.subtasks?.map(toSubtask),
  };
}

function toSubtask(subtask) {
  if (!subtask) return subtask;
  return {
    ...subtask,
    eventId: subtask.event ?? subtask.eventId,
    title: subtask.name ?? subtask.title,
    targetDate: subtask.target_date ?? subtask.targetDate,
    estimatedHours: Number(subtask.estimated_hours ?? subtask.estimatedHours),
    status: subtask.status?.toLowerCase() ?? "pendiente",
  };
}

function fromEvent(event) {
  const payload = {};
  if (event.name !== undefined) payload.name = event.name.trim();
  if (event.type !== undefined) payload.type = event.type.toUpperCase();
  if (event.dateTime !== undefined) payload.event_datetime = event.dateTime;
  if (event.contact !== undefined) payload.client_contact = event.contact;
  if (event.place !== undefined) payload.place = event.place;
  if (event.subtasks) {
    payload.subtasks = event.subtasks.map((subtask) => ({
      name: subtask.title?.trim(),
      target_date: subtask.targetDate,
      estimated_hours: Number(subtask.estimatedHours),
    }));
  }
  return payload;
}

function fromSubtask(subtask) {
  const payload = {};
  if (subtask.title !== undefined) payload.name = subtask.title?.trim();
  if (subtask.targetDate !== undefined) payload.target_date = subtask.targetDate;
  if (subtask.estimatedHours !== undefined) payload.estimated_hours = Number(subtask.estimatedHours);
  if (subtask.status !== undefined) payload.status = subtask.status.toUpperCase();
  if (subtask.note !== undefined) payload.note = subtask.note;
  return payload;
}

async function request(path, options = {}) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: { "Content-Type": "application/json", ...options.headers },
    });
  } catch {
    throw new Error("No pudimos conectar con el servidor. Revisa que el backend esté activo.");
  }

  const body = await response.json().catch(() => ({}));
  if (!response.ok || body.success === false) {
    const error = new Error(body.error?.message || "No se pudo completar la operación. Intenta de nuevo.");
    error.details = body.error?.details ?? {};
    throw error;
  }
  return body.success === true ? body.data : body;
}

const json = (method, payload) => ({ method, body: JSON.stringify(payload) });

// La vista Hoy pertenece al T2; mantiene los datos de demostración existentes.
export async function getToday({ simulateError = false } = {}) {
  if (simulateError) throw new Error("No pudimos cargar tus gestiones");
  return structuredClone(mockGestiones);
}

export async function markGestionAsDone(id) {
  return toSubtask(await request(`/subtasks/${id}`, json("PATCH", { status: "EJECUTADA" })));
}

export async function postponeGestion(id, note = "") {
  return toSubtask(await request(`/subtasks/${id}`, json("PATCH", { status: "POSPUESTA", note })));
}

export async function rescheduleGestion(id, newTargetDateISO) {
  return toSubtask(await request(`/subtasks/${id}`, json("PATCH", { target_date: newTargetDateISO })));
}

export async function createEvent(payload) {
  return toEvent(await request("/events", json("POST", fromEvent(payload))));
}

export async function getEventById(id) {
  return toEvent(await request(`/events/${id}`));
}

export async function getEventSubtasks(eventId) {
  const subtasks = await request(`/events/${eventId}/subtasks`);
  return subtasks.map(toSubtask);
}

export async function addSubtask(eventId, payload) {
  return toSubtask(await request(`/events/${eventId}/subtasks`, json("POST", fromSubtask(payload))));
}

export async function updateEvent(id, patch) {
  return toEvent(await request(`/events/${id}`, json("PATCH", fromEvent(patch))));
}

export async function deleteEvent(id) {
  await request(`/events/${id}`, { method: "DELETE" });
  return { id, deleted: true };
}

export async function updateSubtask(id, patch) {
  return toSubtask(await request(`/subtasks/${id}`, json("PATCH", fromSubtask(patch))));
}

export async function deleteSubtask(id) {
  await request(`/subtasks/${id}`, { method: "DELETE" });
  return { id, deleted: true };
}

export const dailyLimitApi = {
  async get() { return { dailyLimitHours: 6 }; },
  async update(hours) { return { dailyLimitHours: hours }; },
};

export async function login() {
  throw new Error("Login aún no disponible — se implementa desde el Sprint 2 (US-11).");
}
