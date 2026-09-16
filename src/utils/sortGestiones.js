/**
 * sortGestiones.js
 * ---------------------------------------------------------------------------
 * Implements the "regla de priorización" from Backlog Refinado (C4), US-04,
 * and the Arquitectura de Información (C5) callout box:
 *
 *   1. Gestiones vencidas primero, de la más antigua a la más reciente.
 *   2. Luego las de hoy.
 *   3. Luego las próximas, ordenadas por fecha más cercana.
 *   4. En caso de empate (misma fecha), gana la de MENOR esfuerzo estimado.
 *
 * This lives as a pure, framework-agnostic module (no React, no fetch) so it
 * can be unit-tested in isolation and so the exact same rule can be reused
 * by /evento/:id (which also needs to react to reprogramming — US-06/US-07).
 *
 * IMPORTANT — Sprint 0 scope note:
 * For the MVP, this grouping/sorting happens on the frontend over data that
 * (eventually) comes from `GET /today` (see services/api.js). The backlog's
 * "Evidencia esperada" for US-04 allows either backend-side or frontend-side
 * grouping as long as it's documented — here it's documented as FRONTEND.
 */

import { classifyByDate } from "./dateUtils";

/**
 * @typedef {Object} Gestion
 * @property {string} id
 * @property {string} eventId
 * @property {string} eventName
 * @property {'boda'|'corporativo'|'cumpleanos'|'social'|'otro'} eventType
 * @property {string} title
 * @property {string} targetDate - ISO datetime string
 * @property {number} estimatedHours
 * @property {'PENDIENTE'|'EJECUTADA'|'POSPUESTA'} status
 * @property {string} [provider]
 * @property {string} [detail]
 * @property {string} [postponeNote]
 */

/**
 * Groups and sorts a flat list of gestiones into { vencidas, hoy, proximas }.
 * Gestiones already EJECUTADA or POSPUESTA are excluded (US-09: an executed
 * gestión "ya no aparece en /hoy"; a postponed one is surfaced elsewhere,
 * e.g. in the event detail history, not as an active priority).
 * Anything further than `upcomingWindowDays` away is excluded too — it will
 * "enter" the view naturally as the date approaches.
 *
 * @param {Gestion[]} gestiones
 * @param {{ today?: Date, upcomingWindowDays?: number }} [options]
 */
export function groupAndSortGestiones(gestiones, options = {}) {
  const { today = new Date(), upcomingWindowDays = 7 } = options;

  const active = gestiones.filter((g) => g.status === "PENDIENTE");

  const vencidas = [];
  const hoy = [];
  const proximas = [];

  for (const gestion of active) {
    const bucket = classifyByDate(gestion.targetDate, today, upcomingWindowDays);
    if (bucket === "vencida") vencidas.push(gestion);
    else if (bucket === "hoy") hoy.push(gestion);
    else if (bucket === "proxima") proximas.push(gestion);
    // 'fuera_de_rango' gestiones are intentionally dropped from /hoy.
  }

  const byDateThenEffort = (a, b) =>
    new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime() ||
    a.estimatedHours - b.estimatedHours;

  vencidas.sort(byDateThenEffort); // oldest overdue first
  hoy.sort(byDateThenEffort); // earliest time first
  proximas.sort(byDateThenEffort); // soonest date first

  return { vencidas, hoy, proximas };
}

/**
 * Derives the header metrics shown at the top of "/hoy".
 * "Carga estimada" intentionally covers hoy + próximas (the workload still
 * ahead), while vencidas are tracked separately as risk rather than load —
 * this mirrors the numbers in the original prototype. Flag for product/UX
 * to confirm once `GET /today` is implemented for real.
 */
export function computeHoyStats({ vencidas, hoy, proximas }) {
  const sumHours = (list) => list.reduce((total, g) => total + g.estimatedHours, 0);
  return {
    overdueCount: vencidas.length,
    todayCount: hoy.length,
    upcomingCount: proximas.length,
    estimatedLoadHours: round1(sumHours(hoy) + sumHours(proximas)),
    todayLoadHours: round1(sumHours(hoy)),
  };
}

function round1(n) {
  return Math.round(n * 10) / 10;
}
