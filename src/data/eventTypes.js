export const EVENT_TYPES = [
  { key: "boda", label: "Boda", icon: "celebration" },
  { key: "corporativo", label: "Corporativo", icon: "business_center" },
  { key: "cumpleanos", label: "Cumpleaños", icon: "cake" },
  { key: "social", label: "Gala / Cultural", icon: "theater_comedy" },
  { key: "otro", label: "Otro", icon: "more_horiz" },
];

/** Etiqueta visible por tipo (única fuente para tablas, chips y modales). */
export const EVENT_TYPE_LABEL = Object.fromEntries(EVENT_TYPES.map((t) => [t.key, t.label]));
