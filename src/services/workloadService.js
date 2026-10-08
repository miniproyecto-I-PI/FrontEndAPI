import { addDays, toDateInputValue } from "../utils/dateUtils";

const WEEKDAY_SHORT = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const WEEKDAY_FULL = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const MONTH_SHORT = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

/**
 * Normaliza cualquier formato de fecha a 'YYYY-MM-DD'
 */
export function normalizeDate(dateValue) {
  return toDateInputValue(dateValue);
}

/**
 * Calcula la carga horaria acumulada de gestiones activas (no ejecutadas)
 * para un día específico, excluyendo opcionalmente una gestión concreta.
 *
 * @param {Array} gestiones - Lista completa de subtareas
 * @param {string|Date} targetDate - Fecha a consultar
 * @param {string|number|null} [excludeGestionId] - ID de la gestión a excluir
 * @returns {number} Suma de horas estimadas (número con hasta 2 decimales)
 */
export function computeDayWorkload(gestiones = [], targetDate, excludeGestionId = null) {
  if (!targetDate || !Array.isArray(gestiones)) return 0;
  const targetDateISO = normalizeDate(targetDate);
  const excludeIdStr = excludeGestionId != null ? String(excludeGestionId) : null;

  const total = gestiones.reduce((acc, g) => {
    if (!g) return acc;
    const gIdStr = String(g.id);
    if (excludeIdStr && gIdStr === excludeIdStr) return acc;

    const gStatus = (g.status || "").toUpperCase();
    if (gStatus === "EJECUTADA") return acc;

    const gDate = normalizeDate(g.targetDate || g.target_date);
    if (gDate === targetDateISO) {
      const hours = Number(g.estimatedHours ?? g.estimated_hours ?? 0);
      return acc + (Number.isFinite(hours) ? hours : 0);
    }
    return acc;
  }, 0);

  return Math.round(total * 10) / 10;
}

/**
 * Evalúa si una reprogramación o asignación de horas genera sobrecarga (US-07).
 *
 * @param {Object} params
 * @param {Array} params.gestiones - Subtareas existentes
 * @param {string|Date} params.targetDate - Nueva fecha objetivo
 * @param {number} params.taskHours - Horas requeridas por la gestión
 * @param {number} [params.dailyLimitHours=6] - Límite diario del organizador (US-12)
 * @param {string|number|null} [params.excludeGestionId] - ID de la gestión en reprogramación
 * @returns {Object} Resultado detallado del conflicto
 */
export function evaluateConflict({
  gestiones = [],
  targetDate,
  taskHours,
  dailyLimitHours = 6,
  excludeGestionId = null,
}) {
  const targetDateISO = normalizeDate(targetDate);
  const numericTaskHours = Math.max(0, Number(taskHours) || 0);
  const limit = Number(dailyLimitHours) || 6;

  const currentHours = computeDayWorkload(gestiones, targetDateISO, excludeGestionId);
  const totalHours = Math.round((currentHours + numericTaskHours) * 10) / 10;
  const hasConflict = totalHours > limit;
  const excessHours = hasConflict ? Math.round((totalHours - limit) * 10) / 10 : 0;

  return {
    targetDateISO,
    hasConflict,
    currentHours,
    taskHours: numericTaskHours,
    totalHours,
    limitHours: limit,
    excessHours,
  };
}

/**
 * Formatea una fecha para mostrarla como "Vie 10 oct" y día extendido.
 */
function formatSuggestedLabel(dateObj) {
  const d = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate());
  const dayNameShort = WEEKDAY_SHORT[d.getDay()];
  const dayNameFull = WEEKDAY_FULL[d.getDay()];
  const dayNum = d.getDate();
  const monthName = MONTH_SHORT[d.getMonth()];

  return {
    shortLabel: `${dayNameShort} ${dayNum} ${monthName}`,
    weekdayFull: dayNameFull,
  };
}

/**
 * Genera una descripción legible sobre la disponibilidad del día.
 */
function getDayDescription(weekdayFull, freeHours, dailyLimitHours) {
  if (freeHours >= dailyLimitHours) {
    return `${weekdayFull} · Día totalmente despejado`;
  }
  if (freeHours >= dailyLimitHours / 2) {
    return `${weekdayFull} · Tu día con menor saturación`;
  }
  return `${weekdayFull} · Jornada con espacio moderado`;
}

/**
 * Busca los días más cercanos con disponibilidad suficiente para absorber
 * la carga de una gestión sin exceder el límite diario (US-08: Mover a otro día).
 *
 * @param {Object} params
 * @param {Array} params.gestiones - Subtareas existentes
 * @param {number} params.taskHours - Horas requeridas
 * @param {string|Date} [params.fromDate] - Fecha base desde donde escanear
 * @param {number} [params.dailyLimitHours=6] - Límite diario configurado
 * @param {string|Date|null} [params.eventDate] - Fecha límite del evento (si aplica)
 * @param {number} [params.maxDaysToScan=14] - Ventana de días hacia adelante
 * @param {number} [params.limitResults=3] - Máximo de sugerencias a devolver
 * @returns {Array<Object>} Lista de días sugeridos con métricas de capacidad
 */
export function findSuggestedAvailableDays({
  gestiones = [],
  taskHours,
  fromDate = new Date(),
  dailyLimitHours = 6,
  eventDate = null,
  maxDaysToScan = 14,
  limitResults = 3,
  excludeGestionId = null,
}) {
  const numericTaskHours = Math.max(0, Number(taskHours) || 0);
  const limit = Number(dailyLimitHours) || 6;
  const eventDateISO = eventDate ? normalizeDate(eventDate) : null;

  // Empezar a escanear a partir del día siguiente a fromDate (o hoy si fromDate es anterior a hoy)
  const todayISO = toDateInputValue(new Date());
  const baseISO = normalizeDate(fromDate);
  const startISO = baseISO < todayISO ? todayISO : baseISO;
  const baseDate = new Date(`${startISO}T00:00:00`);

  const suggestions = [];

  for (let i = 1; i <= maxDaysToScan; i++) {
    const candidateDate = addDays(baseDate, i);
    const candidateISO = toDateInputValue(candidateDate);

    // No sugerir fechas posteriores a la fecha del evento
    if (eventDateISO && candidateISO > eventDateISO) {
      break;
    }

    const currentHours = computeDayWorkload(gestiones, candidateISO, excludeGestionId);
    const freeHours = Math.round(Math.max(0, limit - currentHours) * 10) / 10;

    // ¿Tiene suficiente espacio para absorber taskHours sin superar el límite?
    if (freeHours >= numericTaskHours) {
      const remainingHoursAfter = Math.round((freeHours - numericTaskHours) * 10) / 10;
      const { shortLabel, weekdayFull } = formatSuggestedLabel(candidateDate);

      suggestions.push({
        dateISO: candidateISO,
        shortLabel,
        weekdayFull,
        currentHours,
        freeHours,
        remainingHoursAfter,
        description: getDayDescription(weekdayFull, freeHours, limit),
      });

      if (suggestions.length >= limitResults) {
        break;
      }
    }
  }

  return suggestions;
}

/**
 * Devuelve el primer día con espacio disponible (para acción rápida "Posponer").
 */
export function findNextAvailableDay(params) {
  const list = findSuggestedAvailableDays({ ...params, limitResults: 1 });
  return list.length > 0 ? list[0] : null;
}
