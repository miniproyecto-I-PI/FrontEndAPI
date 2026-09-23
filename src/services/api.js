/**
 * services/api.js
 * ---------------------------------------------------------------------------
 * SINGLE INTEGRATION POINT with the backend.
 *
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

export const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

/** Simulates realistic network latency for the mock responses below. */
function delay(ms = 400) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

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
  // TODO(backend): replace with:
  //   const res = await fetch(`${API_BASE_URL}/today`);
  //   if (!res.ok) throw new Error('No pudimos cargar tus gestiones');
  //   return res.json();
  return structuredClone(mockGestiones);
}

/**
 * PATCH /subtasks/:id  (US-09, escenario "Marcar tarea ejecutada")
 * @param {string} id
 * @returns {Promise<{ id: string, status: 'EJECUTADA', doneAt: string }>}
 */
export async function markGestionAsDone(id) {
  await delay(250);
  // TODO(backend): replace with:
  //   return fetch(`${API_BASE_URL}/subtasks/${id}`, {
  //     method: 'PATCH',
  //     headers: { 'Content-Type': 'application/json' },
  //     body: JSON.stringify({ status: 'EJECUTADA' }),
  //   }).then((r) => r.json());
  return { id, status: "EJECUTADA", doneAt: new Date().toISOString() };
}

/**
 * PATCH /subtasks/:id  (US-09, escenario "Posponer con nota explicativa")
 * @param {string} id
 * @param {string} [note]
 */
export async function postponeGestion(id, note = "") {
  await delay(250);
  // TODO(backend): PATCH { status: 'POSPUESTA', note }
  return { id, status: "POSPUESTA", note };
}

/**
 * PATCH /subtasks/:id  (US-06, "Reprogramar subtarea logística / gestión")
 * @param {string} id
 * @param {string} newTargetDateISO
 */
export async function rescheduleGestion(id, newTargetDateISO) {
  await delay(300);
  // TODO(backend): PATCH { target_date: newTargetDateISO }
  // TODO(backend, US-07): before confirming in the real flow, first call the
  // conflict-check endpoint (POST /conflicts/overload) and let the user
  // resolve it (US-08) if `has_conflict` comes back true.
  return { id, targetDate: newTargetDateISO };
}

const API_URL = import.meta.env.VITE_API_URL;
const USE_MOCK = true; // TODO(backend): cambiar a false cuando exista el endpoint real

/**
 * POST /events  (US-01, "Crear evento")
 * @param {{ name: string, type: string, contact?: string, dateTime: string, place?: string }} payload
 */
/**
 * POST /events  (US-01, "Crear evento")
 * @param {{ name: string, type: string, contact?: string, dateTime: string, place?: string }} payload
 * @returns {Promise<{ id: string, name: string, type: string, contact?: string, dateTime: string, place?: string }>}
 */
export async function createEvent(payload) {
  if (USE_MOCK) {
    await delay(600); // simula latencia real de red, para que el estado "loading" se note
    return { id: `evt-${Date.now()}`, ...payload };
  }

  const response = await fetch(`${API_URL}/events`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error("No se pudo crear el evento. Intenta de nuevo.");
  }

  return response.json();
}

/**
 * GET /settings/daily-limit and PUT /settings/daily-limit  (US-12)
 * Grouped in one object because they always change together in the UI
 * (the settings modal reads the current value, then writes a new one).
 */
export const dailyLimitApi = {
  /** @returns {Promise<{ dailyLimitHours: number }>} */
  async get() {
    await delay(200);
    // TODO(backend): GET /settings/daily-limit — default is 6h when unset.
    return { dailyLimitHours: 6 };
  },
  /**
   * @param {number} hours - must be validated client-side to the 1–16 range
   * before calling this (see components/common/DailyLimitModal.jsx).
   */
  async update(hours) {
    await delay(300);
    // TODO(backend): PUT /settings/daily-limit { daily_limit_hours: hours }
    return { dailyLimitHours: hours };
  },
};

/**
 * POST /auth/login  (US-11) — from Sprint 2 onward.
 * @param {{ email: string, password: string }} credentials
 */
export async function login(_credentials) {
  await delay(400);
  // TODO(backend, Sprint 2): call Supabase Auth / DRF token endpoint using
  // the (currently unused) `_credentials` argument: { email, password }.
  throw new Error("Login aún no disponible — se implementa desde el Sprint 2 (US-11).");
}
