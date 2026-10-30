import { useEffect, useRef, useState } from "react";
import { formatOverdueLabel, formatShortDate, formatUpcomingLabel } from "../../utils/dateUtils";

export default function TaskCard({
  gestion,
  variant,
  single = false,
  onMarkDone,
  onReschedule,
  onPostpone,
  onEdit,
  onDelete,
  compactActions = false,
  today = new Date(),
}) {
  const isHero = variant === "hoy-hero";
  const isSecondary = variant === "hoy-secundaria";
  const isVencida = variant === "vencida";
  const isProxima = variant === "proxima";
  const isEjecutada = variant === "ejecutada";

  const showOverflow = !isEjecutada;

  const containerClasses = [
    "bg-paper-card border border-sepia-border rounded-sharp warm-card-shadow warm-card-hover transition-all group",
    showOverflow && "relative",
    single && isVencida && "relative bg-crimson-paper/50 border-l-[6px] border-l-crimson-urgent p-5 md:p-6 flex flex-col justify-between",
    single && isProxima && "border-l-4 border-l-sepia-dark p-5 md:p-6 flex flex-col justify-between",
    !single && isVencida && "relative bg-crimson-paper/50 border-l-[6px] border-l-crimson-urgent p-4 md:p-5",
    isHero && "border-l-[6px] border-l-terracotta p-4 flex flex-col justify-between h-full",
    isSecondary && "border-l-4 border-l-terracotta p-4 flex flex-col justify-between h-full",
    !single && isProxima && "border-l-2 border-l-sepia-dark p-4 flex flex-col justify-between h-full",
    isEjecutada && "border-l-[6px] border-l-sage-wax p-4 md:p-5",
  ]
    .filter(Boolean)
    .join(" ");

  const props = { gestion, today, onMarkDone, onReschedule, onPostpone, onEdit, onDelete, compactActions };

  return (
    <article className={containerClasses} data-gestion-id={gestion.id} aria-label={gestion.title}>
      {showOverflow && (
        <CardOverflowMenu
          gestion={gestion}
          compactActions={compactActions}
          onEdit={onEdit}
          onReschedule={onReschedule}
          onPostpone={onPostpone}
          onDelete={onDelete}
        />
      )}
      {single && (isVencida || isProxima) ? (
        <SingleCardBody {...props} variant={variant} />
      ) : (
        <>
          {isVencida && <VencidaBody {...props} />}
          {isHero && <HeroBody {...props} />}
          {isSecondary && <SecondaryBody {...props} />}
          {isProxima && <ProximaBody {...props} />}
          {isEjecutada && <EjecutadaBody gestion={gestion} onEdit={onEdit} onDelete={onDelete} />}
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

function CardOverflowMenu({ gestion, compactActions, onEdit, onReschedule, onPostpone, onDelete }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!menuOpen) return;
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setMenuOpen(false);
    }
    function handleEscape(e) {
      if (e.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [menuOpen]);

  return (
    <div ref={ref} className="absolute top-2 right-2 z-30">
      <button
        type="button"
        onClick={() => setMenuOpen((v) => !v)}
        aria-expanded={menuOpen}
        aria-haspopup="menu"
        aria-label="Más opciones"
        title="Más opciones"
        className={`w-7 h-7 inline-flex items-center justify-center rounded-sharp transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-terracotta focus-visible:ring-offset-1 ${
          menuOpen
            ? "text-ink-charcoal bg-paper-linen/60"
            : "text-ink-muted hover:text-ink-charcoal hover:bg-paper-linen/60"
        }`}
      >
        <span className="material-symbols-outlined text-[16px]" aria-hidden="true">more_horiz</span>
      </button>
      {menuOpen && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-1 z-40 w-44 bg-paper-card border border-sepia-border rounded-sharp shadow-lg py-1"
        >
          {onEdit && (
            <button
              type="button"
              role="menuitem"
              onClick={() => { setMenuOpen(false); onEdit?.(); }}
              className="w-full text-left px-3 py-1.5 font-body text-xs text-ink-charcoal hover:bg-paper-linen transition-colors flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[14px] text-ink-muted" aria-hidden="true">edit</span>
              <span>Editar</span>
            </button>
          )}
          {compactActions && (
            <button
              type="button"
              role="menuitem"
              onClick={() => { setMenuOpen(false); onReschedule?.(); }}
              className="w-full text-left px-3 py-1.5 font-body text-xs text-ink-charcoal hover:bg-paper-linen transition-colors flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[14px] text-ink-muted" aria-hidden="true">event_repeat</span>
              <span>Reprogramar</span>
            </button>
          )}
          <button
            type="button"
            role="menuitem"
            onClick={() => { setMenuOpen(false); onPostpone?.(); }}
            className="w-full text-left px-3 py-1.5 font-body text-xs text-ink-charcoal hover:bg-paper-linen transition-colors flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[14px] text-ink-muted" aria-hidden="true">pause_circle</span>
            <span>Posponer</span>
          </button>
          {onDelete && (
            <>
              <div className="my-1 border-t border-sepia-border" aria-hidden="true" />
              <button
                type="button"
                role="menuitem"
                onClick={() => { setMenuOpen(false); onDelete?.(); }}
                className="w-full text-left px-3 py-1.5 font-body text-xs text-crimson-urgent hover:bg-crimson-paper transition-colors flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[14px]" aria-hidden="true">delete</span>
                <span>Eliminar</span>
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function ActionButtons({ gestion, onMarkDone, onReschedule, onPostpone, onEdit, onDelete, size = "normal", compactActions = false }) {
  const isTiny = size === "tiny";
  const base = isTiny
    ? "px-2 py-1 text-[10px] gap-1"
    : size === "normal"
      ? "px-3.5 py-1.5 text-xs"
      : "px-3 py-1 text-xs";
  const iconSize = isTiny ? "text-[13px]" : "text-[15px]";
  const ghost = `${base} rounded-sharp bg-paper-card hover:bg-paper-linen border border-sepia-border text-ink-charcoal font-body font-medium inline-flex items-center ${isTiny ? "gap-1" : "gap-1.5"} transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-terracotta focus-visible:ring-offset-1`;

  const primaryBtn = (
    <button
      type="button"
      onClick={onMarkDone}
      className={`${base} rounded-sharp bg-terracotta text-[#FAF6F0] font-body font-semibold tracking-wide inline-flex items-center ${isTiny ? "gap-1" : "gap-1.5"} border border-terracotta-dark shadow-sm hover:bg-terracotta-dark transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-terracotta focus-visible:ring-offset-1`}
    >
      <span className={`material-symbols-outlined ${iconSize}`} aria-hidden="true">check_circle</span>
      <span>Marcar como hecha</span>
    </button>
  );

  if (compactActions) {
    return primaryBtn;
  }

  return (
    <>
      {primaryBtn}
      <button type="button" onClick={onReschedule} className={ghost}>
        <span className={`material-symbols-outlined ${iconSize} text-ink-muted`} aria-hidden="true">event_repeat</span>
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
      className="group/title inline-flex items-center gap-1.5 text-left rounded-sharp hover:underline decoration-sepia-dark underline-offset-4 decoration-1 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-terracotta focus-visible:ring-offset-1"
    >
      <span>{gestion.title}</span>
      <span
        className="material-symbols-outlined text-[0.72em] text-ink-muted group-hover/title:text-terracotta transition-colors"
        aria-hidden="true"
      >
        edit
      </span>
    </button>
  );
}

function Hours({ value }) {
  return <span className="font-stamp text-[11px] text-ink-muted">{value} hrs</span>;
}

function VencidaBody({ gestion, today, onMarkDone, onReschedule, onPostpone, onEdit, onDelete, compactActions }) {
  return (
    <div className="flex flex-col gap-3 pr-8">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
        <span className="inline-flex items-center gap-1 font-body text-[11px] font-bold text-crimson-tag bg-[#F6DDD7] border border-crimson-urgent/30 px-2 py-0.5 rounded-sharp uppercase tracking-wide">
          <span className="material-symbols-outlined text-[13px]" aria-hidden="true">warning</span>
          {formatOverdueLabel(gestion.targetDate, today)}
        </span>
        {isPostponed(gestion) && <PostponedTag />}
        <span className="font-body font-medium text-ink-charcoal">{gestion.eventName}</span>
        <span className="text-ink-muted" aria-hidden="true">•</span>
        <Hours value={gestion.estimatedHours} />
      </div>

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <h3 className="font-heading text-xl text-ink-charcoal font-semibold leading-snug flex-1 min-w-0">
          <EditableTitle gestion={gestion} onEdit={onEdit} />
        </h3>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <ActionButtons gestion={gestion} onMarkDone={onMarkDone} onReschedule={onReschedule} onPostpone={onPostpone} onEdit={onEdit} onDelete={onDelete} compactActions={compactActions} />
        </div>
      </div>

      {(gestion.provider || gestion.note) && (
        <div className="flex flex-wrap items-center gap-x-2 text-xs font-body text-ink-muted">
          {gestion.provider && <span>{gestion.provider}</span>}
          {gestion.provider && gestion.note && <span className="text-ink-muted" aria-hidden="true">•</span>}
          {gestion.note && <span className="text-crimson-tag font-medium">{gestion.note}</span>}
        </div>
      )}
    </div>
  );
}

function HeroBody({ gestion, onMarkDone, onReschedule, onPostpone, onEdit, onDelete, compactActions }) {
  return (
    <>
      <div className="space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-1.5 border-b border-sepia-border/70 pr-8">
          <div className="flex items-center gap-2">
            <span className="font-body text-[11px] font-bold text-terracotta-dark bg-terracotta-light/70 border border-terracotta/30 px-2.5 py-0.5 rounded-sharp uppercase tracking-wide">
              {todayLabel(gestion)}
            </span>
            {isPostponed(gestion) ? <PostponedTag /> : <span className="font-body italic text-xs text-terracotta">Prioritaria</span>}
          </div>
          <Hours value={gestion.estimatedHours} />
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
        <div className="flex flex-wrap items-center gap-2">
          <ActionButtons gestion={gestion} onMarkDone={onMarkDone} onReschedule={onReschedule} onPostpone={onPostpone} onEdit={onEdit} onDelete={onDelete} compactActions={compactActions} size="compact" />
        </div>
      </div>
    </>
  );
}

function SecondaryBody({ gestion, onMarkDone, onReschedule, onPostpone, onEdit, onDelete, compactActions }) {
  return (
    <>
      <div>
        <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-sepia-border/40 pr-8">
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
      <div className="flex flex-wrap sm:flex-nowrap items-center justify-end gap-1.5 pt-2.5 mt-2 border-t border-sepia-border/50">
        <ActionButtons gestion={gestion} onMarkDone={onMarkDone} onReschedule={onReschedule} onPostpone={onPostpone} onEdit={onEdit} onDelete={onDelete} compactActions={compactActions} size="tiny" />
      </div>
    </>
  );
}

function ProximaBody({ gestion, today, onMarkDone, onReschedule, onPostpone, onEdit, onDelete, compactActions }) {
  return (
    <>
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-1 pb-1.5 border-b border-sepia-border/50 pr-8">
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
        <div className="flex flex-wrap items-center gap-2">
          <ActionButtons gestion={gestion} onMarkDone={onMarkDone} onReschedule={onReschedule} onPostpone={onPostpone} onEdit={onEdit} onDelete={onDelete} compactActions={compactActions} size="compact" />
        </div>
      </div>
    </>
  );
}

function EjecutadaBody({ gestion, onEdit, onDelete }) {
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
          <span className="text-ink-muted" aria-hidden="true">•</span>
          <Hours value={gestion.estimatedHours} />
        </div>
        <h3 className="font-heading text-xl text-ink-muted font-semibold leading-snug"><EditableTitle gestion={gestion} onEdit={onEdit} /></h3>
        {(gestion.provider || gestion.note) && (
          <p className="text-xs font-body text-ink-muted pt-0.5">{[gestion.provider, gestion.note].filter(Boolean).join(" • ")}</p>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2 self-end lg:self-center shrink-0 pt-2 lg:pt-0">
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
        {onDelete && (
          <button
            type="button"
            onClick={onDelete}
            title="Eliminar gestión"
            aria-label={`Eliminar gestión ${gestion.title}`}
            className="px-3.5 py-1.5 text-xs rounded-sharp bg-paper-card hover:bg-crimson-paper border border-sepia-border hover:border-crimson-urgent/60 text-ink-charcoal hover:text-crimson-urgent font-body font-medium inline-flex items-center gap-1.5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-crimson-urgent focus-visible:ring-offset-1"
          >
            <span className="material-symbols-outlined text-[15px] text-ink-muted" aria-hidden="true">delete</span>
            <span>Eliminar</span>
          </button>
        )}
      </div>
    </div>
  );
}

function SingleCardBody({ gestion, variant, today, onMarkDone, onReschedule, onPostpone, onEdit, onDelete, compactActions }) {
  const isVencida = variant === "vencida";
  return (
    <>
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-sepia-border/70 pr-8">
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
          <Hours value={gestion.estimatedHours} />
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
        <div className="flex flex-wrap items-center gap-2">
          <ActionButtons gestion={gestion} onMarkDone={onMarkDone} onReschedule={onReschedule} onPostpone={onPostpone} onEdit={onEdit} onDelete={onDelete} compactActions={compactActions} size="normal" />
        </div>
      </div>
    </>
  );
}