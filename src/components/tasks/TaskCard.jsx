import { formatOverdueLabel, formatTime, formatUpcomingLabel } from "../../utils/dateUtils";

/**
 * TaskCard.jsx
 * ---------------------------------------------------------------------------
 * Renders a single gestión (subtarea logística). One component with a
 * `variant` prop instead of four near-identical ones — the original HTML
 * prototype has four visually different card treatments (urgente / hero de
 * hoy / secundaria de hoy / próxima) but they share the same anatomy:
 * badge + event name + title + detail line + actions. Only spacing, border
 * emphasis and which badge to show actually change.
 *
 * @param {Object} props
 * @param {import('../../utils/sortGestiones').Gestion} props.gestion
 * @param {'vencida'|'hoy-hero'|'hoy-secundaria'|'proxima'} props.variant
 * @param {() => void} props.onMarkDone
 * @param {() => void} props.onReschedule - opens the single-item reschedule modal
 * @param {Date} [props.today]
 */
export default function TaskCard({ gestion, variant, onMarkDone, onReschedule, today = new Date() }) {
  const isHero = variant === "hoy-hero";
  const isSecondary = variant === "hoy-secundaria";
  const isVencida = variant === "vencida";
  const isProxima = variant === "proxima";

  const containerClasses = [
    "bg-paper-card border border-sepia-border rounded-sharp warm-card-shadow warm-card-hover transition-all group",
    isVencida && "relative bg-crimson-paper/50 border-l-[6px] border-l-crimson-urgent p-4 md:p-5",
    isHero && "border-l-[6px] border-l-terracotta p-6 rounded-asym-book flex flex-col justify-between h-full",
    isSecondary && "border-l-4 border-l-terracotta p-4 flex flex-col justify-between h-full",
    isProxima && "border-l-2 border-l-sepia-dark p-4 flex flex-col justify-between h-full",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <article className={containerClasses} data-gestion-id={gestion.id}>
      {isVencida && (
        <VencidaBody gestion={gestion} today={today} onMarkDone={onMarkDone} onReschedule={onReschedule} />
      )}
      {isHero && <HeroBody gestion={gestion} onMarkDone={onMarkDone} onReschedule={onReschedule} />}
      {isSecondary && <SecondaryBody gestion={gestion} onMarkDone={onMarkDone} onReschedule={onReschedule} />}
      {isProxima && (
        <ProximaBody gestion={gestion} today={today} onMarkDone={onMarkDone} onReschedule={onReschedule} />
      )}
    </article>
  );
}

// ---------------------------------------------------------------------------
// Variant bodies (kept private to this file — none are reused standalone)
// ---------------------------------------------------------------------------

function ActionButtons({ onMarkDone, onReschedule, size = "normal" }) {
  const base =
    size === "normal"
      ? "px-3.5 py-1.5 text-xs"
      : "px-3 py-1 text-xs";
  return (
    <>
      <button
        type="button"
        onClick={onMarkDone}
        className={`btn-mark-done ${base} rounded-sharp bg-terracotta text-[#FAF6F0] font-body font-semibold tracking-wide inline-flex items-center gap-1.5 border border-terracotta-dark shadow-sm hover:bg-terracotta-dark transition-colors`}
      >
        <span className="material-symbols-outlined text-[15px]">check_circle</span>
        <span>Marcar como hecha</span>
      </button>
      <button
        type="button"
        onClick={onReschedule}
        className={`${base} rounded-sharp bg-paper-card hover:bg-paper-linen border border-sepia-border text-ink-charcoal font-body font-medium inline-flex items-center gap-1.5 transition-colors`}
      >
        <span className="material-symbols-outlined text-[15px] text-ink-muted">event_repeat</span>
        <span>Reprogramar</span>
      </button>
    </>
  );
}

function VencidaBody({ gestion, today, onMarkDone, onReschedule }) {
  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
      <div className="space-y-1.5 flex-1">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs no-strike">
          <span className="font-body text-[11px] font-bold text-crimson-tag bg-[#F6DDD7] border border-crimson-urgent/30 px-2 py-0.5 rounded-sharp uppercase tracking-wide">
            {formatOverdueLabel(gestion.targetDate, today)}
          </span>
          <span className="font-body font-medium text-ink-charcoal">{gestion.eventName}</span>
          <span className="text-sepia-dark">•</span>
          <span className="font-mono-stamp text-[11px] text-ink-muted">{gestion.estimatedHours} hrs estimadas</span>
        </div>
        <h3 className="font-serif text-xl text-ink-charcoal font-bold group-hover:text-terracotta transition-colors leading-snug">
          {gestion.title}
        </h3>
        {(gestion.provider || gestion.detail) && (
          <div className="flex flex-wrap items-center gap-x-2 text-xs font-body text-ink-muted pt-0.5">
            {gestion.provider && <span>{gestion.provider}</span>}
            {gestion.provider && gestion.detail && <span className="text-sepia-dark">•</span>}
            {gestion.detail && <span className="text-crimson-tag font-medium">{gestion.detail}</span>}
          </div>
        )}
      </div>
      <div className="flex items-center gap-2 self-end lg:self-center shrink-0 pt-2 lg:pt-0 no-strike">
        <ActionButtons onMarkDone={onMarkDone} onReschedule={onReschedule} />
      </div>
    </div>
  );
}

function HeroBody({ gestion, onMarkDone, onReschedule }) {
  return (
    <>
      <div className="space-y-3.5">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-sepia-border/70 no-strike">
          <div className="flex items-center gap-2.5">
            <span className="font-body text-[11px] font-bold text-terracotta-dark bg-terracotta-light/70 border border-terracotta/30 px-2.5 py-0.5 rounded-sharp uppercase tracking-wide">
              Hoy • {formatTime(gestion.targetDate)}
            </span>
            <span className="font-serif italic text-xs text-terracotta">Prioritaria</span>
          </div>
          <span className="font-mono-stamp text-xs text-ink-muted">{gestion.estimatedHours} hrs estimadas</span>
        </div>
        <div>
          <span className="font-body text-xs font-semibold text-ink-muted uppercase tracking-wider block no-strike">
            {gestion.eventName}
          </span>
          <h3 className="font-serif text-2xl md:text-3xl text-ink-charcoal font-bold mt-1 group-hover:text-terracotta transition-colors leading-tight">
            {gestion.title}
          </h3>
        </div>
        {gestion.detail && (
          <div className="p-3.5 bg-paper-linen/80 rounded-sharp border border-sepia-border text-xs leading-relaxed space-y-1.5 no-strike">
            <p className="font-body font-semibold text-ink-charcoal">Puntos clave:</p>
            <p className="text-ink-muted font-body">{gestion.detail}</p>
          </div>
        )}
      </div>
      <div className="flex items-center justify-between pt-4 mt-3 border-t border-sepia-border no-strike">
        <span className="font-body text-xs text-ink-muted">{gestion.contractRef ?? ""}</span>
        <div className="flex items-center gap-2">
          <ActionButtons onMarkDone={onMarkDone} onReschedule={onReschedule} />
        </div>
      </div>
    </>
  );
}

function SecondaryBody({ gestion, onMarkDone, onReschedule }) {
  return (
    <>
      <div>
        <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-sepia-border/40 no-strike">
          <span className="font-body text-[11px] font-bold text-terracotta-dark bg-terracotta-light/60 border border-terracotta/30 px-2 py-0.5 rounded-sharp uppercase tracking-wide">
            Hoy • {formatTime(gestion.targetDate)}
          </span>
          <span className="font-mono-stamp text-[11px] text-ink-muted">{gestion.estimatedHours} hrs</span>
        </div>
        <span className="font-body text-xs font-semibold text-ink-muted block mt-2 no-strike">{gestion.eventName}</span>
        <h3 className="font-serif text-lg font-bold text-ink-charcoal group-hover:text-terracotta transition-colors leading-snug mt-0.5">
          {gestion.title}
        </h3>
        {(gestion.provider || gestion.detail) && (
          <p className="text-xs font-body text-ink-muted mt-1">
            {[gestion.provider, gestion.detail].filter(Boolean).join(" • ")}
          </p>
        )}
      </div>
      <div className="flex items-center justify-end gap-2 pt-2.5 mt-2 border-t border-sepia-border/50 no-strike">
        <ActionButtons onMarkDone={onMarkDone} onReschedule={onReschedule} size="compact" />
      </div>
    </>
  );
}

function ProximaBody({ gestion, today, onMarkDone, onReschedule }) {
  return (
    <>
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-1 pb-1.5 border-b border-sepia-border/50 no-strike">
          <span className="font-body text-[11px] font-semibold text-ink-charcoal bg-paper-linen border border-sepia-border px-2 py-0.5 rounded-sharp">
            {formatUpcomingLabel(gestion.targetDate, today)}
          </span>
          <span className="font-mono-stamp text-[11px] text-ink-muted">{gestion.estimatedHours} hrs</span>
        </div>
        <span className="font-body text-xs font-semibold text-ink-muted block no-strike">{gestion.eventName}</span>
        <h3 className="font-serif text-lg font-bold text-ink-charcoal group-hover:text-terracotta transition-colors leading-snug">
          {gestion.title}
        </h3>
        {gestion.detail && <p className="font-body text-xs text-ink-muted leading-relaxed">{gestion.detail}</p>}
      </div>
      <div className="pt-3 mt-3 border-t border-sepia-border/50 no-strike">
        {gestion.provider && (
          <span className="font-body text-xs text-ink-muted block mb-2 font-medium">{gestion.provider}</span>
        )}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onMarkDone}
            className="flex-1 px-3 py-1.5 rounded-sharp bg-terracotta text-[#FAF6F0] font-body text-xs font-semibold inline-flex items-center justify-center gap-1 hover:bg-terracotta-dark transition-colors"
          >
            <span className="material-symbols-outlined text-[14px]">check</span>
            <span>Marcar hecha</span>
          </button>
          <button
            type="button"
            onClick={onReschedule}
            className="px-3 py-1.5 rounded-sharp bg-paper-card hover:bg-paper-linen border border-sepia-border text-ink-charcoal font-body text-xs font-medium transition-colors"
          >
            Reprogramar
          </button>
        </div>
      </div>
    </>
  );
}
