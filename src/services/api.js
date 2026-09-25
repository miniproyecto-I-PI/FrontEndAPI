export const API_BASE_URL = (import.meta.env.VITE_API_URL || (import.meta.env.DEV ? "http://localhost:8000/api" : "")).replace(/\/$/, "");

async function request(path, options = {}) {
  if (!API_BASE_URL) {
    throw new Error("El backend no está configurado para este despliegue. Define VITE_API_URL en Vercel.");
  }
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
    const error = new Error(body.error?.message || body.message || body.detail || "No se pudo completar la operación.");
    error.details = body.error?.details ?? {};
    throw error;
  }
  return body.success === true ? body.data : body;
}

const json = (method, payload) => ({ method, body: JSON.stringify(payload) });
const typeToFrontend = (type) => type?.toLowerCase();
const statusToFrontend = (status) => status?.toUpperCase() ?? "PENDIENTE";

function toSubtask(task) {
  return { ...task, id: String(task.id), eventId: String(task.event), title: task.name,
    targetDate: task.target_date, estimatedHours: Number(task.estimated_hours), status: statusToFrontend(task.status),
    eventName: task.event_name, eventType: typeToFrontend(task.event_type) };
}
function toEvent(event) {
  if (!event) return event;
  return { ...event, id: String(event.id), type: typeToFrontend(event.type), contact: event.client_contact ?? "",
    dateTime: event.event_datetime ?? "", subtasks: event.subtasks?.map(toSubtask) };
}
function fromEvent(event) {
  const payload = {};
  if (event.name !== undefined) payload.name = event.name.trim();
  if (event.type !== undefined) payload.type = event.type.toUpperCase();
  if (event.dateTime !== undefined) payload.event_datetime = event.dateTime;
  if (event.contact !== undefined) payload.client_contact = event.contact;
  if (event.place !== undefined) payload.place = event.place;
  if (event.subtasks) payload.subtasks = event.subtasks.map((task) => ({ name: task.title.trim(), target_date: task.targetDate, estimated_hours: Number(task.estimatedHours) }));
  return payload;
}
function fromSubtask(task) {
  const payload = {};
  if (task.title !== undefined) payload.name = task.title.trim();
  if (task.targetDate !== undefined) payload.target_date = task.targetDate.split("T")[0];
  if (task.estimatedHours !== undefined) payload.estimated_hours = Number(task.estimatedHours);
  if (task.status !== undefined) payload.status = task.status.toUpperCase();
  if (task.note !== undefined) payload.note = task.note;
  return payload;
}

export async function getToday({ simulateError = false } = {}) {
  if (simulateError) throw new Error("No pudimos cargar tus gestiones");
  return (await request("/today")).map(toSubtask);
}
export async function markGestionAsDone(id) { return toSubtask(await request(`/subtasks/${id}`, json("PATCH", { status: "EJECUTADA" }))); }
export async function postponeGestion(id, note = "") { return toSubtask(await request(`/subtasks/${id}`, json("PATCH", { status: "POSPUESTA", note }))); }
export async function rescheduleGestion(id, date) { return toSubtask(await request(`/subtasks/${id}`, json("PATCH", { target_date: date.split("T")[0] }))); }
export async function createEvent(event) { return toEvent(await request("/events", json("POST", fromEvent(event)))); }
export async function getEvents() { return (await request("/events")).map(toEvent); }
export async function getEventById(id) { return toEvent(await request(`/events/${id}`)); }
export async function getEventSubtasks(id) { return (await request(`/events/${id}/subtasks`)).map(toSubtask); }
export async function addSubtask(id, task) { return toSubtask(await request(`/events/${id}/subtasks`, json("POST", fromSubtask(task)))); }
export async function updateEvent(id, patch) { return toEvent(await request(`/events/${id}`, json("PATCH", fromEvent(patch)))); }
export async function deleteEvent(id) { await request(`/events/${id}`, { method: "DELETE" }); return { id, deleted: true }; }
export async function updateSubtask(id, patch) { return toSubtask(await request(`/subtasks/${id}`, json("PATCH", fromSubtask(patch)))); }
export async function deleteSubtask(id) { await request(`/subtasks/${id}`, { method: "DELETE" }); return { id, deleted: true }; }

// La autenticación pertenece al Sprint 2 y aún no tiene endpoint en Django.
export async function login() { throw new Error("Login aún no disponible — se implementa desde el Sprint 2 (US-11)."); }

export const dailyLimitApi = {
  async get() { const data = await request("/settings/daily-limit"); return { dailyLimitHours: Number(data.daily_limit_hours) }; },
  async update(hours) {
    const data = await request("/settings/daily-limit", json("PATCH", { daily_limit_hours: hours }));
    return { dailyLimitHours: Number(data.daily_limit_hours) };
  },
};
