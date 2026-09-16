/**
 * mockGestiones.js
 * ---------------------------------------------------------------------------
 * Sample data used ONLY until the backend endpoint `GET /today` (US-04) is
 * available. The content (event names, providers, tasks) mirrors the
 * original approved HTML prototype 1:1, so the Sprint 0 demo looks the same.
 *
 * Dates are generated RELATIVE to "now" (not hardcoded) so the grouping into
 * vencidas/hoy/próximas is always correct no matter when this is run/graded.
 *
 * services/api.js is the ONLY file that imports this module — once the real
 * endpoint exists, delete this file and remove that one import.
 */

import { addDays, atTime } from "../utils/dateUtils";

const now = new Date();

/** @type {import('../utils/sortGestiones').Gestion[]} */
export const mockGestiones = [
  // ---- Vencidas -----------------------------------------------------------
  {
    id: "urg-1",
    eventId: "evt-boda-valentina",
    eventName: "Boda Valentina & Mateo",
    eventType: "boda",
    title: "Confirmar degustación y menú final",
    targetDate: addDays(now, -6).toISOString(),
    estimatedHours: 3.5,
    status: "PENDIENTE",
    provider: "Chef Jean-Luc (Atelier Gastronomique)",
    detail: "Pendiente selección de maridaje de postres",
  },
  {
    id: "urg-2",
    eventId: "evt-gala-innovatech",
    eventName: "Gala Anual Innovatech 2024",
    eventType: "corporativo",
    title: "Firma de contrato de salón y depósito",
    targetDate: addDays(now, -3).toISOString(),
    estimatedHours: 1.5,
    status: "PENDIENTE",
    detail:
      "Palacio San Cristóbal requiere transferencia del 30% antes de las 18:00 para liberar reserva opcional de sala magna.",
  },
  {
    id: "urg-3",
    eventId: "evt-aniversario-arismendi",
    eventName: "50 Aniversario Familia Arismendi",
    eventType: "cumpleanos",
    title: "Enviar pruebas de imprenta de minutas y seating chart",
    targetDate: addDays(now, -1).toISOString(),
    estimatedHours: 2.0,
    status: "PENDIENTE",
    detail: "Taller Tipográfico Numancia espera el archivo PDF con fuentes incrustadas para entintado en golpe seco.",
  },

  // ---- Hoy ------------------------------------------------------------------
  {
    id: "hoy-hero",
    eventId: "evt-boda-valentina",
    eventName: "Boda Valentina & Mateo",
    eventType: "boda",
    title: "Reservar salón principal y terraza cóctel",
    targetDate: atTime(now, 14, 0).toISOString(),
    estimatedHours: 2.5,
    status: "PENDIENTE",
    detail: "Revisar cláusula de horario nocturno (ampliación hasta las 04:30) y pruebas de sonorización en pérgola con el regidor de sala.",
    contractRef: "Contrato B-2024-88",
  },
  {
    id: "hoy-2",
    eventId: "evt-nexa-cloud",
    eventName: "Lanzamiento Nexa Cloud",
    eventType: "corporativo",
    title: "Confirmar catering y opciones veganas/celíacas",
    targetDate: atTime(now, 17, 30).toISOString(),
    estimatedHours: 1.0,
    status: "PENDIENTE",
    provider: "Gourmet Studio",
    detail: "42 asistentes confirmados con requerimientos dietéticos",
  },
  {
    id: "hoy-3",
    eventId: "evt-cumple-rodrigo",
    eventName: "Cumpleaños 40s - Rodrigo",
    eventType: "cumpleanos",
    title: "Enviar invitaciones digitales y enlace RSVP",
    targetDate: atTime(now, 19, 0).toISOString(),
    estimatedHours: 1.5,
    status: "PENDIENTE",
    detail: "Plantilla en borrador • 85 contactos listos en listado",
  },
  {
    id: "hoy-4",
    eventId: "evt-boda-valentina",
    eventName: "Boda Valentina & Mateo",
    eventType: "boda",
    title: "Liquidación anticipo fotógrafo y videógrafo",
    targetDate: atTime(now, 20, 0).toISOString(),
    estimatedHours: 0.5,
    status: "PENDIENTE",
    detail: "Revisar comprobante por el 40% para Cinematografía Lumière.",
  },

  // ---- Próximas -------------------------------------------------------------
  {
    id: "prox-1",
    eventId: "evt-gala-innovatech",
    eventName: "Gala Innovatech 2024",
    eventType: "corporativo",
    title: "Prueba de sonido y contratación DJ",
    targetDate: addDays(now, 1).toISOString(),
    estimatedHours: 3.0,
    status: "PENDIENTE",
    provider: "Auditorio Principal",
    detail: "Reunión técnica en el recinto para microfonía inalámbrica y rider de cabina para gala.",
  },
  {
    id: "prox-2",
    eventId: "evt-boda-valentina",
    eventName: "Boda Valentina & Mateo",
    eventType: "boda",
    title: "Reunión de diseño floral y centros de mesa",
    targetDate: addDays(now, 4).toISOString(),
    estimatedHours: 2.0,
    status: "PENDIENTE",
    provider: "Estudio Flor & Rama",
    detail: "Muestrario botánico en estudio con hortensias blancas, eucalipto y estructuras de forja cálida.",
  },
  {
    id: "prox-3",
    eventId: "evt-nexa-cloud",
    eventName: "Nexa Cloud Launch",
    eventType: "corporativo",
    title: "Coordinación de transporte y transfers VIP",
    targetDate: addDays(now, 6).toISOString(),
    estimatedHours: 4.0,
    status: "PENDIENTE",
    provider: "Flota Mercedes V-Class",
    detail: "Rutas desde el aeropuerto al hotel sede para los 12 ponentes internacionales.",
  },
];

/** Distinct event "type" filter chips shown in the header (matches US-05 filter by evento/estado). */
export const EVENT_TYPE_LABELS = {
  boda: "Bodas",
  corporativo: "Corporativo",
  cumpleanos: "Cumpleaños",
  social: "Social",
  otro: "Otro",
};
