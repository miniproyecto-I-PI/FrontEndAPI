import { useState } from "react";
import { formatOverdueLabel, formatUpcomingLabel } from "../../utils/dateUtils";

/**
 * HoyKanbanView.jsx
 * ---------------------------------------------------------------------------
 * Vista Kanban de 3 columnas para "/hoy" (Sprint 2/3, alineado con mockup de diseño):
 * - Columna 1: Vencidas (agrupadas por evento con cabecera de evento y total de horas).
 * - Columna 2: Hoy (orden cronológico, indicador prioritario y barra terracota).
 * - Columna 3: Próximas (con indicación de día futuro y hora).
 */
export default function HoyKanbanView({
  grouped,
  onMarkDone,
  onReschedule,
  onEdit,
  today = new Date(),
  showExecuted = false,
}) {
  const { vencidas = [], hoy = [], proximas = [], ejecutadas = [] } = grouped;

  // Agrupar vencidas por evento como en el mockup
  const vencidasByEvent = vencidas.reduce((acc, g) => {
    const key = g.eventName || "Sin evento asignado";
    if (!acc[key]) acc[key] = [];
    acc[key].push(g);
    return acc;
  }, {});

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
      {/* =====================================================================
          COLUMNA 1: VENCIDAS
         ===================================================================== */}
      <div className="flex flex-col gap-3 min-w-0">
        {/* Cabecera de columna */}
        <div className="flex items-center justify-between gap-2 pb-2 border-b border-sepia-border">
          <div className="flex items-center gap-2">
            <h2 className="font-heading font-bold text-lg md:text-xl text-ink-charcoal">
              Vencidas
            </h2>
            <span className="font-stamp text-xs font-bold px-2 py-0.5 rounded-sharp bg-crimson-paper border border-crimson-urgent/30 text-crimson-urgent">
              {vencidas.length}
            </span>
          </div>
          <span className="inline-flex items-center gap-1 font-body text-xs font-semibold text-crimson-tag">
            <span className="material-symbols-outlined text-[15px]" aria-hidden="true">
              warning
            </span>
            <span>Requieren atención inmediata</span>
          </span>
        </div>

        {/* Contenido de columna */}
        {vencidas.length === 0 ? (
          <div className="p-6 text-center bg-paper-card border border-dashed border-sepia-border rounded-sharp text-xs text-ink-muted">
            No tienes gestiones vencidas al día de hoy.
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(vencidasByEvent).map(([eventName, items]) => {
              const totalEventHours = items.reduce(
                (sum, it) => sum + Number(it.estimatedHours || 0),
                0
              );
              return (
                <div key={eventName} className="space-y-2.5">
                  {/* Encabezado del grupo de evento */}
                  <div className="flex items-center justify-between text-[11px] font-stamp text-ink-muted uppercase tracking-wider px-1">
                    <span className="inline-flex items-center gap-1.5 font-bold text-crimson-urgent">
                      <span className="w-1.5 h-1.5 rounded-full bg-crimson-urgent" aria-hidden="true" />
                      <span className="truncate max-w-[200px]">{eventName}</span>
                      <span className="text-ink-muted">· {items.length}</span>
                    </span>
                    <span>Total: {totalEventHours.toFixed(1).replace(".0", "")}h</span>
                  </div>

                  {/* Tarjetas de gestiones vencidas */}
                  <div className="space-y-2.5">
                    {items.map((g) => (
                      <KanbanCard
                        key={g.id}
                        gestion={g}
                        variant="vencida"
                        today={today}
                        onMarkDone={() => onMarkDone(g)}
                        onReschedule={() => onReschedule(g)}
                        onEdit={() => onEdit(g)}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* =====================================================================
          COLUMNA 2: HOY
         ===================================================================== */}
      <div className="flex flex-col gap-3 min-w-0">
        {/* Cabecera de columna */}
        <div className="flex items-center justify-between gap-2 pb-2 border-b border-sepia-border">
          <div className="flex items-center gap-2">
            <h2 className="font-heading font-bold text-lg md:text-xl text-ink-charcoal">
              Hoy
            </h2>
            <span className="font-stamp text-xs font-bold px-2 py-0.5 rounded-sharp bg-terracotta-light/70 border border-terracotta/30 text-terracotta-dark">
              {hoy.length}
            </span>
          </div>
          <span className="inline-flex items-center gap-1 font-body text-xs text-ink-muted">
            <span className="material-symbols-outlined text-[15px]" aria-hidden="true">
              schedule
            </span>
            <span>Orden cronológico</span>
          </span>
        </div>

        {/* Contenido de columna */}
        {hoy.length === 0 ? (
          <div className="p-6 text-center bg-paper-card border border-dashed border-sepia-border rounded-sharp text-xs text-ink-muted">
            No tienes gestiones programadas para hoy.
          </div>
        ) : (
          <div className="space-y-2.5">
            {hoy.map((g, idx) => (
              <KanbanCard
                key={g.id}
                gestion={g}
                variant="hoy"
                isPriority={idx === 0}
                today={today}
                onMarkDone={() => onMarkDone(g)}
                onReschedule={() => onReschedule(g)}
                onEdit={() => onEdit(g)}
              />
            ))}
          </div>
        )}
      </div>

      {/* =====================================================================
          COLUMNA 3: PRÓXIMAS
         ===================================================================== */}
      <div className="flex flex-col gap-3 min-w-0">
        {/* Cabecera de columna */}
        <div className="flex items-center justify-between gap-2 pb-2 border-b border-sepia-border">
          <div className="flex items-center gap-2">
            <h2 className="font-heading font-bold text-lg md:text-xl text-ink-charcoal">
              Próximas
            </h2>
            <span className="font-stamp text-xs font-bold px-2 py-0.5 rounded-sharp bg-paper-linen border border-sepia-border text-ink-charcoal">
              {proximas.length}
            </span>
          </div>
          <span className="font-body text-xs text-ink-muted">
            Próximos días
          </span>
        </div>

        {/* Contenido de columna */}
        {proximas.length === 0 ? (
          <div className="p-6 text-center bg-paper-card border border-dashed border-sepia-border rounded-sharp text-xs text-ink-muted">
            No tienes gestiones futuras en los próximos días.
          </div>
        ) : (
          <div className="space-y-2.5">
            {proximas.map((g) => (
              <KanbanCard
                key={g.id}
                gestion={g}
                variant="proxima"
                today={today}
                onMarkDone={() => onMarkDone(g)}
                onReschedule={() => onReschedule(g)}
                onEdit={() => onEdit(g)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Tarjeta individual del tablero Kanban (siguiendo estilo y detalles de Image 2).
 */
function KanbanCard({
  gestion,
  variant,
  isPriority = false,
  today,
  onMarkDone,
  onReschedule,
  onEdit,
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const isVencida = variant === "vencida";
  const isHoy = variant === "hoy";
  const isProxima = variant === "proxima";

  // Formato de hora / fecha según columna
  const timeDisplay = (() => {
    if (isVencida) {
      return (
        <div className="text-right shrink-0">
          <div className="font-stamp text-xs font-bold text-ink-charcoal">
            {gestion.time || "Sin hora"}
          </div>
          <div className="font-stamp text-[11px] text-ink-muted">
            {gestion.estimatedHours}h
          </div>
        </div>
      );
    }
    if (isHoy) {
      return (
        <div className="text-right shrink-0">
          <div className="font-stamp text-xs font-bold text-ink-charcoal">
            {gestion.time || "Sin hora"}
          </div>
          <div className="font-stamp text-[11px] text-ink-muted">
            {gestion.estimatedHours}h
          </div>
        </div>
      );
    }
    // Próxima
    return (
      <div className="text-right shrink-0">
        <div className="font-stamp text-xs font-semibold text-ink-charcoal whitespace-nowrap">
          {formatUpcomingLabel(gestion.targetDate, today)} {gestion.time ? gestion.time : ""}
        </div>
        <div className="font-stamp text-[11px] text-ink-muted">
          {gestion.estimatedHours}h
        </div>
      </div>
    );
  })();

  return (
    <article
      className={`relative bg-paper-card border border-sepia-border rounded-sharp p-3.5 warm-card-shadow warm-card-hover transition-all group ${
        isHoy && isPriority ? "border-l-[4px] border-l-terracotta" : ""
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Círculo para marcar como hecha */}
        <button
          type="button"
          onClick={onMarkDone}
          title="Marcar como hecha"
          aria-label={`Marcar como hecha la gestión "${gestion.title}"`}
          className="mt-0.5 w-4 h-4 rounded-full border border-sepia-dark/80 group-hover:border-terracotta hover:bg-terracotta-light/40 flex items-center justify-center transition-colors shrink-0 focus:outline-none focus:ring-2 focus:ring-terracotta"
        >
          <span className="material-symbols-outlined text-[12px] text-transparent hover:text-terracotta transition-colors">
            check
          </span>
        </button>

        {/* Información central y título */}
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 flex-wrap">
            <button
              type="button"
              onClick={onEdit}
              title="Editar gestión"
              className="text-left font-body font-semibold text-sm text-ink-charcoal hover:underline decoration-sepia-dark underline-offset-2 focus:outline-none"
            >
              {gestion.title}
            </button>
            {isHoy && isPriority && (
              <span className="font-body text-[10px] font-bold text-terracotta-dark bg-terracotta-light/70 border border-terracotta/30 px-1.5 py-0.2 rounded-sharp uppercase tracking-wider">
                Prioritaria
              </span>
            )}
          </div>

          {/* Subtítulo: evento / cliente */}
          <div className="font-body text-xs text-ink-muted truncate mt-0.5">
            {gestion.eventName}
            {gestion.provider && ` · ${gestion.provider}`}
          </div>
        </div>

        {/* Hora y estimación */}
        {timeDisplay}
      </div>

      {/* Fila inferior de acciones y etiqueta */}
      <div className="flex items-center justify-between gap-2 pt-2.5 mt-2.5 border-t border-sepia-border/50">
        <div>
          {isVencida ? (
            <span className="inline-flex items-center gap-1 font-body text-[10px] font-bold text-crimson-tag bg-[#F6DDD7] border border-crimson-urgent/30 px-1.5 py-0.5 rounded-sharp uppercase tracking-wide">
              {formatOverdueLabel(gestion.targetDate, today)}
            </span>
          ) : gestion.status === "POSPUESTA" ? (
            <span className="inline-flex items-center gap-1 font-body text-[10px] font-semibold text-ink-charcoal bg-paper-accent border border-sepia-dark/50 px-1.5 py-0.5 rounded-sharp">
              Pospuesta
            </span>
          ) : (
            <span className="text-[11px] font-stamp text-ink-muted">
              {gestion.time ? `${gestion.time}` : ""}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 relative">
          <button
            type="button"
            onClick={onReschedule}
            className="px-2.5 py-1 text-xs font-body font-medium rounded-sharp bg-paper-card hover:bg-paper-linen border border-sepia-border text-ink-charcoal transition-colors focus:outline-none focus:ring-1 focus:ring-terracotta"
          >
            Reprogramar
          </button>

          {/* Botón menú tres puntos */}
          <button
            type="button"
            onClick={() => setIsMenuOpen((v) => !v)}
            title="Más opciones"
            aria-label="Más opciones"
            className="p-1 rounded-sharp text-ink-muted hover:text-ink-charcoal hover:bg-paper-linen transition-colors focus:outline-none focus:ring-1 focus:ring-terracotta"
          >
            <span className="material-symbols-outlined text-[16px] leading-none">
              more_horiz
            </span>
          </button>

          {/* Menú desplegable */}
          {isMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setIsMenuOpen(false)}
              />
              <div className="absolute right-0 bottom-full mb-1 z-40 w-36 bg-paper-card border border-sepia-border rounded-sharp shadow-lg py-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    onEdit();
                  }}
                  className="w-full text-left px-3 py-1.5 font-body text-xs text-ink-charcoal hover:bg-paper-linen transition-colors flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[14px]">edit</span>
                  <span>Editar</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    onMarkDone();
                  }}
                  className="w-full text-left px-3 py-1.5 font-body text-xs text-ink-charcoal hover:bg-paper-linen transition-colors flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[14px] text-terracotta">
                    check_circle
                  </span>
                  <span>Completar</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </article>
  );
}
