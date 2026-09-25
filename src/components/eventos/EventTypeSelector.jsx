/**
 * EventTypeSelector.jsx — selector visual de tipo de celebración.
 * Usado en CrearPage y EditEventModal. Los `key` mapean 1:1 a los valores
 * que el backend espera en minúsculas (boda, corporativo, cumpleanos,
 * social, otro). "Gala / Cultural" se guarda como `social` — es solo el
 * label visible.
 */
export default function EventTypeSelector({ value, onChange, error }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
      {EVENT_TYPES.map((t) => {
        const isActive = value === t.key;
        const classes = isActive
          ? "border-2 border-terracotta bg-terracotta-light/40 text-terracotta-dark font-semibold"
          : error
            ? "border border-crimson-urgent/60 bg-paper-base text-ink-charcoal font-medium"
            : "border border-sepia-border bg-paper-base hover:bg-paper-linen text-ink-charcoal font-medium";
        return (
          <button
            key={t.key}
            type="button"
            onClick={() => onChange(t.key)}
            aria-pressed={isActive}
            className={`flex flex-col items-center justify-center p-3 text-center rounded-sharp font-body text-xs transition-all ${classes}`}
          >
            <span
              className={`material-symbols-outlined text-[20px] mb-1 ${
                isActive ? "text-terracotta" : "text-ink-muted"
              }`}
            >
              {t.icon}
            </span>
            <span>{t.label}</span>
          </button>
        );
      })}
    </div>
  );
}
import { EVENT_TYPES } from "../../data/eventTypes";
