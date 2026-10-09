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

/** Días hacia adelante que cubre el grupo "Próximas" (decisión UX, = backend). */
export const UPCOMING_WINDOW_DAYS = 7;

/**
 * Texto visible de la regla por grupo (US-04, sin jerga técnica). Lo muestra
 * el tooltip "¿Cómo se ordena?" junto al título de cada grupo de /hoy y debe
 * coincidir con groupAndSortGestiones(): si la regla cambia, actualizar ambos.
 */
export const PRIORITY_RULE_BY_GROUP = {
  ejecutadas:
    "Gestiones ya hechas, de la fecha más antigua a la más reciente. Si dos coinciden en fecha y hora, va antes la de menor esfuerzo estimado.",
  vencidas:
    "Aparecen primero, de la más antigua a la más reciente. Si dos vencieron a la misma hora, va antes la de menor esfuerzo estimado.",
  hoy: "Van después de las vencidas, ordenadas por hora. Si dos coinciden en la hora, va antes la de menor esfuerzo estimado.",
  proximas:
    "Van al final, de la fecha más cercana a la más lejana. Si dos coinciden en fecha y hora, va antes la de menor esfuerzo estimado.",
};

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
 * @property {string} [time] - "HH:MM" opcional (solo informativo, no altera el orden)
 * @property {string} [note]
 */

/**
 * Groups and sorts a flat list of gestiones into { vencidas, hoy, proximas }.
 * Gestiones EJECUTADA stay out of the three groups (US-04: "excluir
 * gestiones ejecutadas") and are returned apart in `ejecutadas`, which /hoy
 * only shows as section "0. Ejecutadas" (switch or "Ejecutadas" chip).
 * POSPUESTA stay in their date group with a "Pospuesta" tag (Sprint 2), so
 * the US-05 status filter (Pendiente / Pospuesta) is meaningful.
 * Anything further than `upcomingWindowDays` away is excluded too — it will
 * "enter" the view naturally as the date approaches.
 *
 * @param {Gestion[]} gestiones
 * @param {{ today?: Date, upcomingWindowDays?: number }} [options]
 */
export function groupAndSortGestiones(gestiones, options = {}) {
  const { today = new Date(), upcomingWindowDays = UPCOMING_WINDOW_DAYS } = options;

  const active = gestiones.filter((g) => g.status !== "EJECUTADA");
  const ejecutadas = gestiones.filter((g) => g.status === "EJECUTADA");

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

  const getTimeValue = (g) => {
    if (!g.time) return "00:00"; // backend: sin hora = 00:00, va primero
    const parts = String(g.time).trim().split(":");
    if (parts.length >= 2) {
      const h = parts[0].padStart(2, "0");
      const m = parts[1].padStart(2, "0");
      return `${h}:${m}`;
    }
    return String(g.time);
  };

  const byDateThenTimeThenEffort = (a, b) => {
    // 1. Fecha calendario
    const dateA = a.targetDate ? a.targetDate.split("T")[0] : "";
    const dateB = b.targetDate ? b.targetDate.split("T")[0] : "";
    const dateDiff = new Date(dateA).getTime() - new Date(dateB).getTime();
    if (dateDiff !== 0) return dateDiff;

    // 2. Hora y minutos (sin hora = 00:00, va primero)
    const timeA = getTimeValue(a);
    const timeB = getTimeValue(b);
    const timeDiff = timeA.localeCompare(timeB);
    if (timeDiff !== 0) return timeDiff;

    // 3. Menor esfuerzo estimado
    const effortDiff = (Number(a.estimatedHours) || 0) - (Number(b.estimatedHours) || 0);
    if (effortDiff !== 0) return effortDiff;

    // 4. ID estable
    return String(a.id ?? "").localeCompare(String(b.id ?? ""));
  };

  vencidas.sort(byDateThenTimeThenEffort);
  hoy.sort(byDateThenTimeThenEffort);
  proximas.sort(byDateThenTimeThenEffort);
  ejecutadas.sort(byDateThenTimeThenEffort);

  return { vencidas, hoy, proximas, ejecutadas };
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
