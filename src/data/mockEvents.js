/**
 * mockEvents.js
 * ---------------------------------------------------------------------------
 * Datos de muestra SOLO hasta que exista GET /events en el backend.
 * Las fechas se generan relativas a "hoy" para que la demo siempre funcione
 * (mismo criterio que mockGestiones.js).
 *
 * `progress` y `status` son campos NUEVOS que el backend todavía no devuelve
 * (ver services/api.js → mapEventFromBackend). TODO(backend): confirmar que
 * el serializador de Event los exponga.
 */

import { addDays } from "../utils/dateUtils";

const now = new Date();

export const mockEvents = [
  {
    id: "evt-boda-valentina",
    name: "Boda Valentina & Mateo",
    contact: "Valentina Arismendi & Mateo Silva",
    type: "boda",
    dateTime: addDays(now, 25).toISOString(),
    place: "Finca El Olivo, Madrid",
    progress: { done: 8, total: 12 },
    status: "en_produccion",
  },
  {
    id: "evt-gala-innovatech",
    name: "Gala Anual Innovatech 2024",
    contact: "Innovatech Solutions",
    type: "corporativo",
    dateTime: addDays(now, 45).toISOString(),
    place: "Palacio San Cristóbal",
    progress: { done: 5, total: 9 },
    status: "atencion_requerida",
  },
  {
    id: "evt-nexa-cloud",
    name: "Lanzamiento Nexa Cloud",
    contact: "Nexa Technologies",
    type: "corporativo",
    dateTime: addDays(now, 2).toISOString(),
    place: "Hotel Villa Real, Madrid",
    progress: { done: 11, total: 14 },
    status: "hoy_en_marcha",
  },
  {
    id: "evt-cumple-rodrigo",
    name: "Cumpleaños 40s — Rodrigo",
    contact: "Familia Méndez",
    type: "cumpleanos",
    dateTime: addDays(now, 90).toISOString(),
    place: "Terraza Miramar, Bcn",
    progress: { done: 3, total: 8 },
    status: "planificacion_inicial",
  },
  {
    id: "evt-aniversario-arismendi",
    name: "50 Aniversario Bodas de Oro",
    contact: "Familia Arismendi",
    type: "boda",
    dateTime: addDays(now, 120).toISOString(),
    place: "Hacienda Los Arcángeles",
    progress: { done: 4, total: 10 },
    status: "en_produccion",
  },
];

export const EVENT_STATUS_LABELS = {
  en_produccion: "En producción",
  atencion_requerida: "Atención requerida",
  hoy_en_marcha: "Hoy en marcha",
  planificacion_inicial: "Planificación inicial",
  completado: "Completado",
};

/** Tonos visuales por estado. */
export const EVENT_STATUS_TONES = {
  en_produccion: { bg: "bg-sage-light/80", text: "text-sage-wax" },
  atencion_requerida: { bg: "bg-crimson-paper", text: "text-crimson-tag" },
  hoy_en_marcha: { bg: "bg-terracotta-light/60", text: "text-terracotta-dark" },
  planificacion_inicial: { bg: "bg-paper-linen", text: "text-ink-muted" },
  completado: { bg: "bg-sage-light/80", text: "text-sage-wax" },
};

/** Etiqueta singular para el badge de categoría de la tabla. */
export const EVENT_TYPE_SINGULAR = {
  boda: "Boda",
  corporativo: "Corporativo",
  cumpleanos: "Cumpleaños",
  social: "Social",
  otro: "Otro",
};