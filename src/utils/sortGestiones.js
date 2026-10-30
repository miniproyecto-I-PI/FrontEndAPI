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
 * "Próximas" ya NO tiene límite de días (decisión UX): cualquier gestión con
 * target_date > hoy cae en ese grupo. El backend (GET /today) tampoco filtra
 * por fecha superior, así que ambos lados son consistentes.
 *
 * This lives as a pure, framework-agnostic module (no React, no fetch) so it
 * can be unit-tested in isolation and so the exact same rule can be reused
 * by /evento/:id (which also needs to react to reprogramming — US-06/US-07).
 */

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

/** Fecha local en formato "YYYY-MM-DD" sin desfase de zona horaria. */
function toISODateLocal(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Groups and sorts a flat list of gestiones into { vencidas, hoy, proximas }.
 * Gestiones EJECUTADA stay out of the three groups (US-04: "excluir
 * gestiones ejecutadas") and are returned apart in `ejecutadas`, which /hoy
 * only shows as section "0. Ejecutadas" (switch or "Ejecutadas" chip).
 * POSPUESTA stay in their date group with a "Pospuesta" tag (Sprint 2), so
 * the US-05 status filter (Pendiente / Pospuesta) is meaningful.
 *
 * Toda gestión con target_date > hoy va a "próximas", sin importar cuán
 * lejos esté (no hay ventana de días). Así el FE nunca "esconde" trabajo
 * futuro que el backend sí devuelve.
 *
 * @param {Gestion[]} gestiones
 * @param {{ today?: Date }} [options]
 */
export function groupAndSortGestiones(gestiones, options = {}) {
  const { today = new Date() } = options;

  const active = gestiones.filter((g) => g.status !== "EJECUTADA");
  const ejecutadas = gestiones.filter((g) => g.status === "EJECUTADA");

  const vencidas = [];
  const hoy = [];
  const proximas = [];

  const todayISO = toISODateLocal(today);

  for (const gestion of active) {
    const dateISO = String(gestion.targetDate ?? "").split("T")[0];
    if (!dateISO) continue; // sin fecha → no aparece en /hoy
    if (dateISO < todayISO) vencidas.push(gestion);
    else if (dateISO === todayISO) hoy.push(gestion);
    else proximas.push(gestion);
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
 * "Carga estimada" covers hoy + próximas (the workload still ahead),
 * while vencidas are tracked separately as risk rather than load.
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