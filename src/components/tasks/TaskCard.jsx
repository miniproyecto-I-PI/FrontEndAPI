import { formatOverdueLabel, formatShortDate, formatUpcomingLabel } from "../../utils/dateUtils";

/**
 * TaskCard.jsx
 * ---------------------------------------------------------------------------
 * Una gestión (subtarea logística) en "/hoy". Un solo componente con `variant`
 * para los tratamientos del diseño (vencida / hero de hoy / secundaria de
 * hoy / próxima / ejecutada); comparten anatomía: sello + evento + título +
 * detalle + acciones.
 *
 * La urgencia no depende solo del color (US-04, UX): las vencidas llevan
 * ícono de alerta y el texto "Vencida hace N días"; las pospuestas, la
 * etiqueta "Pospuesta". Las ejecutadas (sección "0. Ejecutadas") llevan la
 * etiqueta "Ejecutada" y solo el botón "Editar". En todas las variantes, el
 * título es un botón que abre el modal "Editar gestión" (`onEdit`).
 *
 * @param {Object} props
 * @param {import('../../utils/sortGestiones').Gestion} props.gestion
 * @param {'vencida'|'hoy-hero'|'hoy-secundaria'|'proxima'|'ejecutada'} props.variant
 * @param {() => void} [props.onMarkDone]
 * @param {() => void} [props.onReschedule]
 * @param {() => void} [props.onEdit]  abre "Editar gestión" (título y botón Editar)
 * @param {Date} [props.today]
 */
export default function TaskCard({ gestion, variant, single = false, onMarkDone, onReschedule, onEdit, today = new Date() }) {
  const isHero = variant === "hoy-hero";
  const isSecondary = variant === "hoy-secundaria";
  const isVencida = variant === "vencida";
  const isProxima = variant === "proxima";
  const isEjecutada = variant === "ejecutada";

  const containerClasses = [
    "bg-paper-card border border-sepia-border rounded-sharp warm-card-shadow warm-card-hover transition-all group",
    single && isVencida && "relative bg-crimson-paper/50 border-l-[6px] border-l-crimson-urgent p-5 md:p-6 flex flex-col justify-between",
    single && isProxima && "border-l-4 border-l-sepia-dark p-5 md:p-6 flex flex-col justify-between",
    !single && isVencida && "relative bg-crimson-paper/50 border-l-[6px] border-l-crimson-urgent p-4 md:p-5",
    isHero && "border-l-[6px] border-l-terracotta p-4 md:p-5 flex flex-col justify-between",
    isSecondary && "border-l-4 border-l-terracotta p-4 flex flex-col justify-between h-full",
    !single && isProxima && "border-l-2 border-l-sepia-dark p-4 flex flex-col justify-between h-full",
    isEjecutada && "border-l-[6px] border-l-sage-wax p-4 md:p-5",
  ]
    .filter(Boolean)
    .join(" ");

  const props = { gestion, today, onMarkDone, onReschedule, onEdit };
  return (
    <article className={containerClasses} data-gestion-id={gestion.id} aria-label={gestion.title}>
      {single && (isVencida || isProxima) ? (
        <SingleCardBody {...props} variant={variant} />
      ) : (
        <>
          {isVencida && <VencidaBody {...props} />}
          {isHero && <HeroBody {...props} />}
          {isSecondary && <SecondaryBody {...props} />}
          {isProxima && <ProximaBody {...props} />}
          {isEjecutada && <EjecutadaBody gestion={gestion} onEdit={onEdit} />}
        </>
      )}
    </article>
  );
}

// ---------------------------------------------------------------------------

const isPostponed = (g) => g.status === "POSPUESTA";
const todayLabel = (g) => (g.time ? `Hoy • ${g.time}` : "Hoy");

function PostponedTag() {
  return (
    <span className="inline-flex items-center gap-1 font-body text-[11px] font-semibold text-ink-charcoal bg-paper-accent border border-sepia-dark/50 px-2 py-0.5 rounded-sharp">
      <span className="material-symbols-outlined text-[13px]" aria-hidden="true">pause_circle</span>
      Pospuesta
    </span>
  );
}

function ActionButtons({ onMarkDone, onReschedule, size = "normal" }) {
  const base = size === "normal" ? "px-3.5 py-1.5 text-xs" : "px-3 py-1 text-xs";
  return (
    <>
      <button
        type="button"
        onClick={onMarkDone}
        className={`${base} rounded-sharp bg-terracotta text-[#FAF6F0] font-body font-semibold tracking-wide inline-flex items-center gap-1.5 border border-terracotta-dark shadow-sm hover:bg-terracotta-dark transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-terracotta focus-visible:ring-offset-1`}
      >
        <span className="material-symbols-outlined text-[15px]" aria-hidden="true">check_circle</span>
        <span>Marcar como hecha</span>
      </button>
      <button
        type="button"
        onClick={onReschedule}
        className={`${base} rounded-sharp bg-paper-card hover:bg-paper-linen border border-sepia-border text-ink-charcoal font-body font-medium inline-flex items-center gap-1.5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-terracotta focus-visible:ring-offset-1`}
      >
        <span className="material-symbols-outlined text-[15px] text-ink-muted" aria-hidden="true">event_repeat</span>
        <span>Reprogramar</span>
      </button>
    </>
  );
}

function EditableTitle({ gestion, onEdit }) {
  if (!onEdit) return gestion.title;
  return (
    <button
      type="button"
      onClick={onEdit}
      title="Editar gestión"
      className="text-left rounded-sharp hover:underline decoration-sepia-dark underline-offset-4 decoration-1 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-terracotta focus-visible:ring-offset-1"
    >
      {gestion.title}
    </button>
  );
}

function Hours({ value, long = false }) {
  return (
    <span className="font-stamp text-[11px] text-ink-muted">
      {value} {long ? "hrs estimadas" : "hrs"}
    </span>
  );
}

function VencidaBody({ gestion, today, onMarkDone, onReschedule, onEdit }) {
  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
      <div className="space-y-1.5 flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
          <span className="inline-flex items-center gap-1 font-body text-[11px] font-bold text-crimson-tag bg-[#F6DDD7] border border-crimson-urgent/30 px-2 py-0.5 rounded-sharp uppercase tracking-wide">
            <span className="material-symbols-outlined text-[13px]" aria-hidden="true">warning</span>
            {formatOverdueLabel(gestion.targetDate, today)}
          </span>
          {isPostponed(gestion) && <PostponedTag />}
          <span className="font-body font-medium text-ink-charcoal">{gestion.eventName}</span>
          <span className="text-sepia-dark" aria-hidden="true">•</span>
          <Hours value={gestion.estimatedHours} long />
        </div>
        <h3 className="font-heading text-xl text-ink-charcoal font-semibold leading-snug"><EditableTitle gestion={gestion} onEdit={onEdit} /></h3>
        {(gestion.provider || gestion.note) && (
          <div className="flex flex-wrap items-center gap-x-2 text-xs font-body text-ink-muted pt-0.5">
            {gestion.provider && <span>{gestion.provider}</span>}
            {gestion.provider && gestion.note && <span className="text-sepia-dark" aria-hidden="true">•</span>}
            {gestion.note && <span className="text-crimson-tag font-medium">{gestion.note}</span>}
          </div>
        )}
      </div>
      <div className="flex items-center gap-2 self-end lg:self-center shrink-0 pt-2 lg:pt-0">
        <ActionButtons onMarkDone={onMarkDone} onReschedule={onReschedule} />
      </div>
    </div>
  );
}

function HeroBody({ gestion, onMarkDone, onReschedule, onEdit }) {
  return (
    <>
      <div className="space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-1.5 border-b border-sepia-border/70">
          <div className="flex items-center gap-2">
            <span className="font-body text-[11px] font-bold text-terracotta-dark bg-terracotta-light/70 border border-terracotta/30 px-2.5 py-0.5 rounded-sharp uppercase tracking-wide">
              {todayLabel(gestion)}
            </span>
            {isPostponed(gestion) ? <PostponedTag /> : <span className="font-body italic text-xs text-terracotta">Prioritaria</span>}
          </div>
          <Hours value={gestion.estimatedHours} long />
        </div>
        <div>
          <span className="font-body text-xs font-semibold text-ink-muted uppercase tracking-wider block">{gestion.eventName}</span>
          <h3 className="font-heading text-xl md:text-2xl text-ink-charcoal font-semibold mt-1 leading-snug"><EditableTitle gestion={gestion} onEdit={onEdit} /></h3>
        </div>
        {gestion.note && (
          <div className="p-3 bg-paper-linen/80 rounded-sharp border border-sepia-border text-xs leading-relaxed space-y-1">
            <p className="font-body font-semibold text-ink-charcoal">Puntos clave:</p>
            <p className="text-ink-muted font-body">{gestion.note}</p>
          </div>
        )}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2.5 pt-3 mt-3 border-t border-sepia-border">
        <span className="font-body text-xs text-ink-muted">{gestion.provider}</span>
        <div className="flex items-center gap-2">
          <ActionButtons onMarkDone={onMarkDone} onReschedule={onReschedule} size="compact" />
        </div>
      </div>
    </>
  );
}

function SecondaryBody({ gestion, onMarkDone, onReschedule, onEdit }) {
  return (
    <>
      <div>
        <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-sepia-border/40">
          <div className="flex items-center gap-2">
            <span className="font-body text-[11px] font-bold text-terracotta-dark bg-terracotta-light/60 border border-terracotta/30 px-2 py-0.5 rounded-sharp uppercase tracking-wide">
              {todayLabel(gestion)}
            </span>
            {isPostponed(gestion) && <PostponedTag />}
          </div>
          <Hours value={gestion.estimatedHours} />
        </div>
        <span className="font-body text-xs font-semibold text-ink-muted block mt-2">{gestion.eventName}</span>
        <h3 className="font-heading text-lg font-semibold text-ink-charcoal leading-snug mt-0.5"><EditableTitle gestion={gestion} onEdit={onEdit} /></h3>
        {(gestion.provider || gestion.note) && (
          <p className="text-xs font-body text-ink-muted mt-1">{[gestion.provider, gestion.note].filter(Boolean).join(" • ")}</p>
        )}
      </div>
      <div className="flex flex-wrap items-center justify-end gap-2 pt-2.5 mt-2 border-t border-sepia-border/50">
        <ActionButtons onMarkDone={onMarkDone} onReschedule={onReschedule} size="compact" />
      </div>
    </>
  );
}

function ProximaBody({ gestion, today, onMarkDone, onReschedule, onEdit }) {
  return (
    <>
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-1 pb-1.5 border-b border-sepia-border/50">
          <div className="flex items-center gap-2">
            <span className="font-body text-[11px] font-semibold text-ink-charcoal bg-paper-linen border border-sepia-border px-2 py-0.5 rounded-sharp">
              {formatUpcomingLabel(gestion.targetDate, today)}
              {gestion.time ? ` • ${gestion.time}` : ""}
            </span>
            {isPostponed(gestion) && <PostponedTag />}
          </div>
          <Hours value={gestion.estimatedHours} />
        </div>
        <span className="font-body text-xs font-semibold text-ink-muted block">{gestion.eventName}</span>
        <h3 className="font-heading text-lg font-semibold text-ink-charcoal leading-snug"><EditableTitle gestion={gestion} onEdit={onEdit} /></h3>
        {gestion.note && <p className="font-body text-xs text-ink-muted leading-relaxed">{gestion.note}</p>}
      </div>
      <div className="pt-3 mt-3 border-t border-sepia-border/50">
        {gestion.provider && <span className="font-body text-xs text-ink-muted block mb-2 font-medium">{gestion.provider}</span>}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onMarkDone}
            className="flex-1 px-3 py-1.5 rounded-sharp bg-terracotta text-[#FAF6F0] font-body text-xs font-semibold inline-flex items-center justify-center gap-1 hover:bg-terracotta-dark transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-terracotta focus-visible:ring-offset-1"
          >
            <span className="material-symbols-outlined text-[14px]" aria-hidden="true">check</span>
            <span>Marcar hecha</span>
          </button>
          <button
            type="button"
            onClick={onReschedule}
            className="px-3 py-1.5 rounded-sharp bg-paper-card hover:bg-paper-linen border border-sepia-border text-ink-charcoal font-body text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-terracotta focus-visible:ring-offset-1"
          >
            Reprogramar
          </button>
        </div>
      </div>
    </>
  );
}

function EjecutadaBody({ gestion, onEdit }) {
  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
      <div className="space-y-1.5 flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
          <span className="inline-flex items-center gap-1 font-body text-[11px] font-bold text-sage-wax bg-sage-light border border-sage-wax/40 px-2 py-0.5 rounded-sharp uppercase tracking-wide">
            <span className="material-symbols-outlined text-[13px]" aria-hidden="true">check_circle</span>
            Ejecutada
          </span>
          <span className="font-body text-[11px] font-semibold text-ink-charcoal bg-paper-linen border border-sepia-border px-2 py-0.5 rounded-sharp">
            {formatShortDate(gestion.targetDate)}
            {gestion.time ? ` • ${gestion.time}` : ""}
          </span>
          <span className="font-body font-medium text-ink-charcoal">{gestion.eventName}</span>
          <span className="text-sepia-dark" aria-hidden="true">•</span>
          <Hours value={gestion.estimatedHours} long />
        </div>
        <h3 className="font-heading text-xl text-ink-muted font-semibold leading-snug"><EditableTitle gestion={gestion} onEdit={onEdit} /></h3>
        {(gestion.provider || gestion.note) && (
          <p className="text-xs font-body text-ink-muted pt-0.5">{[gestion.provider, gestion.note].filter(Boolean).join(" • ")}</p>
        )}
      </div>
      <div className="flex items-center gap-2 self-end lg:self-center shrink-0 pt-2 lg:pt-0">
        <button
          type="button"
          onClick={onEdit}
          title="Editar gestión"
          aria-label={`Editar gestión ${gestion.title}`}
          className="px-3.5 py-1.5 text-xs rounded-sharp bg-paper-card hover:bg-paper-linen border border-sepia-border text-ink-charcoal font-body font-medium inline-flex items-center gap-1.5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-terracotta focus-visible:ring-offset-1"
        >
          <span className="material-symbols-outlined text-[15px] text-ink-muted" aria-hidden="true">edit</span>
          <span>Editar</span>
        </button>
      </div>
    </div>
  );
}

function SingleCardBody({ gestion, variant, today, onMarkDone, onReschedule, onEdit }) {
  const isVencida = variant === "vencida";
  return (
    <>
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-sepia-border/70">
          <div className="flex flex-wrap items-center gap-2.5">
            {isVencida ? (
              <span className="inline-flex items-center gap-1 font-body text-[11px] font-bold text-crimson-tag bg-[#F6DDD7] border border-crimson-urgent/30 px-2.5 py-0.5 rounded-sharp uppercase tracking-wide">
                <span className="material-symbols-outlined text-[13px]" aria-hidden="true">warning</span>
                {formatOverdueLabel(gestion.targetDate, today)}
              </span>
            ) : (
              <span className="font-body text-[11px] font-semibold text-ink-charcoal bg-paper-linen border border-sepia-border px-2.5 py-0.5 rounded-sharp">
                {formatUpcomingLabel(gestion.targetDate, today)}
                {gestion.time ? ` • ${gestion.time}` : ""}
              </span>
            )}
            {isPostponed(gestion) && <PostponedTag />}
            <span className="font-body text-xs font-semibold text-ink-muted uppercase tracking-wider block">
              {gestion.eventName}
            </span>
          </div>
          <Hours value={gestion.estimatedHours} long />
        </div>

        <div>
          <h3 className="font-heading text-xl md:text-2xl text-ink-charcoal font-semibold mt-1 leading-snug">
            <EditableTitle gestion={gestion} onEdit={onEdit} />
          </h3>
        </div>

        {gestion.note && (
          <div className="p-3 bg-paper-linen/80 rounded-sharp border border-sepia-border text-xs leading-relaxed space-y-1">
            <p className="font-body font-semibold text-ink-charcoal">Indicaciones / Observaciones:</p>
            <p className="text-ink-muted font-body">{gestion.note}</p>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 pt-3.5 mt-3.5 border-t border-sepia-border/70">
        <span className="font-body text-xs text-ink-muted font-medium">
          {gestion.provider ? `Encargado: ${gestion.provider}` : ""}
        </span>
        <div className="flex items-center gap-2">
          <ActionButtons onMarkDone={onMarkDone} onReschedule={onReschedule} size="normal" />
        </div>
      </div>
    </>
  );
}
