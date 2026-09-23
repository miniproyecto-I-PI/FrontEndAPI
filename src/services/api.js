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

import { mockGestiones } from "../data/mockGestiones";

// Fix: una sola constante con fallback, en vez de dos lecturas distintas de
// la misma env var (una con fallback, otra sin). Ver conversación.
export const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

/** Simulates realistic network latency for the mock responses below. */
function delay(ms = 400) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// =============================================================================
// MOCK STORE (Sprint 1 — se elimina cuando el backend real esté listo)
// =============================================================================
// Sprint 1 no tiene backend todavía. Para que US-01/US-02 funcionen
// end-to-end sin él, guardamos eventos y subtareas en localStorage, así la
// demo en Vercel sobrevive a un F5. Se reemplaza entero por fetch() el día
// que el backend exista: nada fuera de este bloque ni de las funciones de
// abajo sabe que el store existe.
//
// VERSIONING: si cambia la forma de mockGestiones (nuevos campos, etc.),
// sube STORAGE_VERSION. Al abrir la app se detectará el mismatch y se
// re-sembrará desde el mock (evita "fantasmas" de datos viejos).
// =============================================================================

const STORAGE_KEY = "convoka.sprint1.store";
const STORAGE_VERSION = 1;

let _eventsStore = null;   // { [id]: { id, name, type, contact?, dateTime?, place? } }
let _subtasksStore = null; // Gestion[] — misma forma que mockGestiones

function loadFromStorage() {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed?.version !== STORAGE_VERSION) return null;
    if (!parsed.events || !parsed.subtasks) return null;
    return parsed;
  } catch {
    return null; // JSON corrupto → re-seed
  }
}

function saveToStorage() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: STORAGE_VERSION,
        events: _eventsStore,
        subtasks: _subtasksStore,
      })
    );
  } catch {
    // Modo privado / quota excedida — silenciar, la app sigue funcionando en memoria.
  }
}

function ensureMockStores() {
  if (_eventsStore && _subtasksStore) return;

  const persisted = loadFromStorage();
  if (persisted) {
    _eventsStore = persisted.events;
    _subtasksStore = persisted.subtasks;
    return;
  }

  // Primera carga (o versión vieja): sembrar desde mockGestiones.
  _eventsStore = {};
  for (const g of mockGestiones) {
    if (!_eventsStore[g.eventId]) {
      _eventsStore[g.eventId] = {
        id: g.eventId,
        name: g.eventName,
        type: g.eventType,
      };
    }
  }
  _subtasksStore = structuredClone(mockGestiones);

  saveToStorage();
}

// =============================================================================
// US-04 — Vista "Hoy"
// =============================================================================

/**
 * GET /today  (US-04)
 * Returns the raw list of active/relevant gestiones. Grouping and ordering
 * is applied on the frontend by `utils/sortGestiones.js` (see that file for
 * why). Throws to simulate the error state when `simulateError` is true —
 * used by the QA simulation toolbar (components/dev/SimulationToolbar.jsx)
 * to demo the error state without needing a real backend outage.
 *
 * @param {{ simulateError?: boolean }} [opts]
 * @returns {Promise<import('../utils/sortGestiones').Gestion[]>}
 */
export async function getToday({ simulateError = false } = {}) {
  await delay();
  if (simulateError) {
    throw new Error("No pudimos cargar tus gestiones");
  }
  // TODO(backend): reemplazar por:
  //   const res = await fetch(`${API_BASE_URL}/today`);
  //   if (!res.ok) throw new Error('No pudimos cargar tus gestiones');
  //   return res.json();
  return structuredClone(mockGestiones);
}

/** PATCH /subtasks/:id  (US-09, "Marcar tarea ejecutada") */
export async function markGestionAsDone(id) {
  await delay(250);
  // TODO(backend): PATCH `${API_BASE_URL}/subtasks/${id}` { status: 'EJECUTADA' }
  return { id, status: "EJECUTADA", doneAt: new Date().toISOString() };
}

/** PATCH /subtasks/:id  (US-09, "Posponer con nota explicativa") */
export async function postponeGestion(id, note = "") {
  await delay(250);
  // TODO(backend): PATCH { status: 'POSPUESTA', note }
  return { id, status: "POSPUESTA", note };
}

/** PATCH /subtasks/:id  (US-06, "Reprogramar") */
export async function rescheduleGestion(id, newTargetDateISO) {
  await delay(300);
  // TODO(backend): PATCH { target_date: newTargetDateISO }
  // TODO(backend, US-07): antes de confirmar, llamar POST /conflicts/overload
  return { id, targetDate: newTargetDateISO };
}

// =============================================================================
// US-01 — Crear evento
// =============================================================================

const USE_MOCK = true; // TODO(backend): cambiar a false cuando exista el endpoint real

/**
 * POST /events  (US-01)
 * @param {{ name: string, type: string, contact?: string, dateTime: string, place?: string }} payload
 * @returns {Promise<{ id: string, name: string, type: string, contact?: string, dateTime: string, place?: string }>}
 */
export async function createEvent(payload) {
  ensureMockStores();

  if (USE_MOCK) {
    await delay(600);
    const newEvent = { id: `evt-${Date.now()}`, ...payload };
    _eventsStore[newEvent.id] = newEvent;
    saveToStorage();
    return newEvent;
  }

  const response = await fetch(`${API_BASE_URL}/events`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error("No se pudo crear el evento. Intenta de nuevo.");
  }
  return response.json();
}

// =============================================================================
// US-02 — Subtareas logísticas (plan inicial de un evento)
// =============================================================================

/**
 * GET /events/:id  (US-01/US-03 — base para el detalle del evento)
 * @param {string} id
 * @returns {Promise<{ id: string, name: string, type: string }>}
 */
export async function getEventById(id) {
  ensureMockStores();
  await delay();
  // TODO(backend): GET `${API_BASE_URL}/events/${id}`
  const evt = _eventsStore[id];
  if (!evt) throw new Error("No encontramos ese evento");
  return evt;
}

/**
 * GET /events/:id/subtasks  (US-02)
 * @param {string} eventId
 * @returns {Promise<import('../utils/sortGestiones').Gestion[]>}
 */
export async function getEventSubtasks(eventId) {
  ensureMockStores();
  await delay();
  // TODO(backend): GET `${API_BASE_URL}/events/${eventId}/subtasks`
  return _subtasksStore.filter((s) => s.eventId === eventId);
}

/**
 * POST /events/:id/subtasks  (US-02)
 * Crea una subtarea logística asociada al evento.
 * @param {string} eventId
 * @param {{ title: string, targetDate: string, estimatedHours: number }} payload
 */
export async function addSubtask(eventId, payload) {
  ensureMockStores();
  await delay(500);
  // TODO(backend): POST `${API_BASE_URL}/events/${eventId}/subtasks`
  //   body: { title, target_date, estimated_hours }
  //   → 201 con la subtarea creada
  //   → 400 si title vacío o estimated_hours <= 0
  const evt = _eventsStore[eventId];
  const newSubtask = {
    id: `sub-${Date.now()}`,
    eventId,
    eventName: evt?.name ?? "",
    eventType: evt?.type ?? "otro",
    title: payload.title,
    targetDate: payload.targetDate,
    estimatedHours: payload.estimatedHours,
    status: "PENDIENTE",
  };
  _subtasksStore.push(newSubtask);
  saveToStorage();
  return newSubtask;
}

// =============================================================================
// US-12 — Configuración de límite diario
// =============================================================================

export const dailyLimitApi = {
  /** @returns {Promise<{ dailyLimitHours: number }>} */
  async get() {
    await delay(200);
    // TODO(backend): GET /settings/daily-limit — default 6h cuando no existe.
    return { dailyLimitHours: 6 };
  },
  /** @param {number} hours — validar 1–16 en cliente antes de llamar. */
  async update(hours) {
    await delay(300);
    // TODO(backend): PUT /settings/daily-limit { daily_limit_hours: hours }
    return { dailyLimitHours: hours };
  },
};

// =============================================================================
// US-11 — Login (Sprint 2+)
// =============================================================================

/**
 * POST /auth/login  (US-11)
 * @param {{ email: string, password: string }} credentials
 */
export async function login(_credentials) {
  await delay(400);
  throw new Error("Login aún no disponible — se implementa desde el Sprint 2 (US-11).");
}