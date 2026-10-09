export const API_BASE_URL = (import.meta.env.VITE_API_URL || (import.meta.env.DEV ? "http://localhost:8000/api" : "")).replace(/\/$/, "");

// --- Sesión (US-11) ---------------------------------------------------------
// El token vive en localStorage si el usuario marca "Mantener sesión activa";
// si no, en sessionStorage (se borra al cerrar el navegador).
const TOKEN_KEY = "convoka.token";

export function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
}
function storeToken(token, remember) {
  clearStoredToken();
  (remember ? localStorage : sessionStorage).setItem(TOKEN_KEY, token);
}
export function clearStoredToken() {
  localStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
}

/** Evento global que AuthContext escucha para cerrar la sesión ante un 401. */
export const UNAUTHORIZED_EVENT = "convoka:unauthorized";

async function request(path, options = {}) {
  if (!API_BASE_URL) {
    throw new Error("El backend no está configurado para este despliegue. Define VITE_API_URL en Vercel.");
  }
  // `anonymous`: login/registro no envían token ni disparan el cierre por 401.
  const { anonymous = false, ...fetchOptions } = options;
  const token = getStoredToken();
  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...fetchOptions,
      headers: {
        "Content-Type": "application/json",
        ...(token && !anonymous ? { Authorization: `Token ${token}` } : {}),
        ...fetchOptions.headers,
      },
    });
  } catch {
    const error = new Error("No pudimos conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.");
    error.code = "network_error";
    throw error;
  }
  const body = await response.json().catch(() => ({}));
  if (response.status === 401 && !anonymous) {
    // Token ausente, inválido o revocado: se cierra la sesión local.
    clearStoredToken();
    window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
  }
  if (!response.ok || body.success === false) {
    const fallback = response.status === 404
      ? `El backend no tiene disponible ${path} (404). Actualiza el despliegue de la API.`
      : `El backend respondió con error ${response.status} en ${path}.`;
    const error = new Error(body.error?.message || body.message || body.detail || fallback);
    error.status = response.status;
    error.code = body.error?.code;
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
    eventName: task.event_name, eventType: typeToFrontend(task.event_type),
    provider: task.provider ?? "", time: task.time ?? "",
    conflictResolved: Boolean(task.conflict_resolved) };
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
  if (event.subtasks) payload.subtasks = event.subtasks.map((task) => ({ name: task.title.trim(), target_date: task.targetDate, estimated_hours: Number(task.estimatedHours), provider: task.provider ?? "", time: task.time || null }));
  return payload;
}
function fromSubtask(task) {
  const payload = {};
  if (task.title !== undefined) payload.name = task.title.trim();
  if (task.targetDate !== undefined) payload.target_date = task.targetDate.split("T")[0];
  if (task.estimatedHours !== undefined) payload.estimated_hours = Number(task.estimatedHours);
  if (task.status !== undefined) payload.status = task.status.toUpperCase();
  if (task.note !== undefined) payload.note = task.note;
  if (task.provider !== undefined) payload.provider = task.provider;
  if (task.time !== undefined) payload.time = task.time || null;
  return payload;
}

/**
 * GET /today — gestiones no ejecutadas (vencidas, hoy y próximos 7 días) del
 * organizador autenticado. US-05: el filtrado por evento/estado ocurre en el
 * backend con los query params `event_id` y `status` (PENDIENTE | POSPUESTA).
 */
export async function getToday({ eventId, status, simulateError = false } = {}) {
  if (simulateError) throw new Error("No pudimos cargar tus gestiones");
  const params = new URLSearchParams();
  if (eventId) params.set("event_id", eventId);
  if (status) params.set("status", status.toUpperCase());
  const query = params.toString();
  return (await request(`/today${query ? `?${query}` : ""}`)).map(toSubtask);
}
export async function markGestionAsDone(id) { return toSubtask(await request(`/subtasks/${id}`, json("PATCH", { status: "EJECUTADA" }))); }
export async function postponeGestion(id, note = "") { return toSubtask(await request(`/subtasks/${id}`, json("PATCH", { status: "POSPUESTA", note }))); }
export async function rescheduleGestion(id, date) { return toSubtask(await request(`/subtasks/${id}`, json("PATCH", { target_date: date.split("T")[0] }))); }
export async function createEvent(event) { return toEvent(await request("/events", json("POST", fromEvent(event)))); }
export async function getEvents() { return (await request("/events")).map(toEvent); }
// GET /events ya trae los conteos anotados por Django; no hace llamadas por evento.
export async function getEventsWithProgress(options = {}) {
  if (options.simulateError) throw new Error("No pudimos cargar tus eventos");
  return getEvents();
}
export async function getEventById(id) { return toEvent(await request(`/events/${id}`)); }
export async function getEventSubtasks(id) { return (await request(`/events/${id}/subtasks`)).map(toSubtask); }
export async function addSubtask(id, task) { return toSubtask(await request(`/events/${id}/subtasks`, json("POST", fromSubtask(task)))); }
export async function updateEvent(id, patch) { return toEvent(await request(`/events/${id}`, json("PATCH", fromEvent(patch)))); }
export async function deleteEvent(id) { await request(`/events/${id}`, { method: "DELETE" }); return { id, deleted: true }; }
export async function updateSubtask(id, patch) { return toSubtask(await request(`/subtasks/${id}`, json("PATCH", fromSubtask(patch)))); }
export async function deleteSubtask(id) { await request(`/subtasks/${id}`, { method: "DELETE" }); return { id, deleted: true }; }

// --- Autenticación (US-11) --------------------------------------------------
/** POST /auth/login — acepta correo o usuario; guarda el token si es válido. */
export async function login({ identifier, password, remember = true }) {
  const id = identifier.trim();
  const credentials = id.includes("@") ? { email: id, password } : { username: id, password };
  const data = await request("/auth/login", { ...json("POST", credentials), anonymous: true });
  storeToken(data.token, remember);
  return data.user;
}
/** POST /auth/logout — invalida el token en el servidor; la sesión local se limpia siempre. */
export async function logout() {
  try {
    await request("/auth/logout", { method: "POST" });
  } finally {
    clearStoredToken();
  }
}
/** GET /auth/me — restaura el usuario al recargar la página. */
export async function getMe() { return request("/auth/me"); }
/** POST /auth/register — crea la cuenta; NO inicia sesión (el usuario va a /login). */
export async function register({ username, email, password }) {
  const data = await request("/auth/register", {
    ...json("POST", { username: username.trim(), email: email.trim(), password }),
    anonymous: true,
  });
  return data.user;
}

export const userSettingsApi = {
  async get() {
    try {
      const data = await request("/settings");
      const val = Number(data?.daily_limit_hours);
      return {
        dailyLimitHours: Number.isFinite(val) && val >= 1 ? val : 6,
        allowOverload: Boolean(data?.allow_overload),
        allowSubtasksAfterEvent: Boolean(data?.allow_subtasks_after_event),
        allowOverdueSubtasks: Boolean(data?.allow_overdue_subtasks),
      };
    } catch {
      try {
        const data = await request("/settings/daily-limit");
        const val = Number(data?.daily_limit_hours);
        return {
          dailyLimitHours: Number.isFinite(val) && val >= 1 ? val : 6,
          allowOverload: false,
          allowSubtasksAfterEvent: false,
          allowOverdueSubtasks: false,
        };
      } catch {
        return {
          dailyLimitHours: 6,
          allowOverload: false,
          allowSubtasksAfterEvent: false,
          allowOverdueSubtasks: false,
        };
      }
    }
  },
  async update({ dailyLimitHours, allowOverload, allowSubtasksAfterEvent, allowOverdueSubtasks } = {}) {
    const payload = {};
    if (dailyLimitHours !== undefined) {
      const num = Number(dailyLimitHours);
      if (!Number.isFinite(num) || num < 1 || num > 16) {
        throw new Error("El límite debe estar entre 1 y 16 horas");
      }
      payload.daily_limit_hours = num;
    }
    if (allowOverload !== undefined) {
      payload.allow_overload = Boolean(allowOverload);
    }
    if (allowSubtasksAfterEvent !== undefined) {
      payload.allow_subtasks_after_event = Boolean(allowSubtasksAfterEvent);
    }
    if (allowOverdueSubtasks !== undefined) {
      payload.allow_overdue_subtasks = Boolean(allowOverdueSubtasks);
    }
    const data = await request("/settings", json("PATCH", payload));
    return {
      dailyLimitHours: Number(data.daily_limit_hours),
      allowOverload: Boolean(data.allow_overload),
      allowSubtasksAfterEvent: Boolean(data.allow_subtasks_after_event),
      allowOverdueSubtasks: Boolean(data.allow_overdue_subtasks),
    };
  },
};

export const dailyLimitApi = {
  async get() {
    return userSettingsApi.get();
  },
  async update(hoursOrObj) {
    if (typeof hoursOrObj === "object" && hoursOrObj !== null) {
      return userSettingsApi.update(hoursOrObj);
    }
    return userSettingsApi.update({ dailyLimitHours: hoursOrObj });
  },
};
