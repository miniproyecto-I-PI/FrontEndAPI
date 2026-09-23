/**
 * dateUtils.js
 * ---------------------------------------------------------------------------
 * Small, dependency-free date helpers used to classify and format gestiones
 * (logistics tasks) for the "/hoy" view.
 *
 * Kept framework-agnostic on purpose: these are plain functions with no
 * React or API knowledge, so they are easy to unit test and easy to move
 * to the backend later if the grouping logic ends up living server-side
 * (see services/api.js for that discussion).
 */

const MS_PER_DAY = 24 * 60 * 60 * 1000;

const WEEKDAYS = [
  "domingo",
  "lunes",
  "martes",
  "miércoles",
  "jueves",
  "viernes",
  "sábado",
];

const MONTHS = [
  "ene",
  "feb",
  "mar",
  "abr",
  "may",
  "jun",
  "jul",
  "ago",
  "sep",
  "oct",
  "nov",
  "dic",
];

/** Returns a new Date set to 00:00:00 of the same calendar day as `date`. */
export function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Returns a new Date `days` days after `date` (negative to go backwards). */
export function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

/** Returns a new Date with the same day as `date` but at hour:minute. */
export function atTime(date, hour, minute = 0) {
  const d = new Date(date);
  d.setHours(hour, minute, 0, 0);
  return d;
}

/** True when both dates fall on the same calendar day. */
export function isSameDay(a, b) {
  return startOfDay(a).getTime() === startOfDay(b).getTime();
}

/** Whole calendar days between `from` and `to` (`to` - `from`, can be negative). */
export function diffInCalendarDays(from, to) {
  return Math.round((startOfDay(to).getTime() - startOfDay(from).getTime()) / MS_PER_DAY);
}

/**
 * Classifies a target date relative to `today` into one of the three
 * groups used across the whole app (US-04): 'vencida' | 'hoy' | 'proxima'.
 * Anything further away than `upcomingWindowDays` is classified as
 * 'fuera_de_rango' and is intentionally excluded from the "/hoy" view.
 */
export function classifyByDate(targetDate, today = new Date(), upcomingWindowDays = 7) {
  const diff = diffInCalendarDays(today, targetDate);
  if (diff < 0) return "vencida";
  if (diff === 0) return "hoy";
  if (diff <= upcomingWindowDays) return "proxima";
  return "fuera_de_rango";
}

/** "Vencida hace 6 días" / "Vencida ayer" — mirrors the original prototype copy. */
export function formatOverdueLabel(targetDate, today = new Date()) {
  const days = Math.abs(diffInCalendarDays(targetDate, today));
  if (days === 1) return "Vencida ayer";
  return `Vencida hace ${days} días`;
}

/** "Mañana, 25 Oct" / "Lunes, 28 Oct" — mirrors the original prototype copy. */
export function formatUpcomingLabel(targetDate, today = new Date()) {
  const days = diffInCalendarDays(today, targetDate);
  const d = new Date(targetDate);
  const dayNumber = d.getDate();
  const month = MONTHS[d.getMonth()];
  if (days === 1) return `Mañana, ${dayNumber} ${capitalize(month)}`;
  const weekday = WEEKDAYS[d.getDay()];
  return `${capitalize(weekday)}, ${dayNumber} ${capitalize(month)}`;
}

/** "14:00" from a Date. */
export function formatTime(date) {
  const d = new Date(date);
  return d.toTimeString().slice(0, 5);
}

/** Full readable date for headers, e.g. "Jueves, 24 de Octubre de 2026". */
export function formatFullDate(date = new Date()) {
  const weekday = capitalize(WEEKDAYS[date.getDay()]);
  const day = date.getDate();
  const monthNames = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
  ];
  return `${weekday}, ${day} de ${monthNames[date.getMonth()]} de ${date.getFullYear()}`;
}

function capitalize(word) {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

/** "15 Oct" — fecha corta para listas (sin año, útil en detalle de evento). */
export function formatShortDate(date) {
  const d = new Date(date);
  return `${d.getDate()} ${capitalize(MONTHS[d.getMonth()])}`;
}