import { diffInCalendarDays, formatShortDate } from "../../utils/dateUtils";

/**
 * EventDossierHeader.jsx
 * Cabecera tipo "ficha de expediente" del evento: tipo, título, contacto,
 * meta (fecha + días restantes, lugar) y barra de progreso calculada a
 * partir de las subtareas.
 *
 * @param {Object} event
 * @param {{ total: number, completed: number, pending: number, overdue: number }} stats
 */
export default function EventDossierHeader({ event, stats }) {
  if (!event) return null;

  const hasDate = Boolean(event.dateTime);
  const days = hasDate
    ? diffInCalendarDays(new Date(), new Date(event.dateTime))
    : null;

  const percent =
    stats.total === 0 ? 0 : Math.round((stats.completed / stats.total) * 100);

  return (
    <section className="mt-6 bg-paper-card border border-sepia-border rounded-sharp warm-card-shadow p-6 sm:p-8">
      <div className="space-y-2.5">
        {event.type && (
          <span className="inline-block font-mono-stamp text-[10px] uppercase px-2.5 py-0.5 rounded-sharp bg-paper-linen border border-sepia-border text-ink-muted font-bold tracking-wider">
            {event.type.toUpperCase()}
          </span>
        )}

        <h1 className="font-serif text-4xl sm:text-5xl text-ink-charcoal font-semibold tracking-tight leading-[1.08]">
          {event.name}
        </h1>

        {event.contact && (
          <p className="font-serif italic text-lg text-terracotta font-normal">
            {event.contact}
          </p>
        )}

        <div className="flex items-center flex-wrap gap-x-5 gap-y-2 pt-3 text-ink-muted font-body text-xs">
          {hasDate && (
            <span className="inline-flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-terracotta">
                calendar_today
              </span>
              <span>{formatShortDate(event.dateTime)}</span>
              {days !== null && (
                <span className="font-medium text-crimson-urgent ml-1">
                  {days > 0
                    ? `(Faltan ${days} ${days === 1 ? "día" : "días"})`
                    : days === 0
                      ? "(Es hoy)"
                      : `(Hace ${Math.abs(days)} ${Math.abs(days) === 1 ? "día" : "días"})`}
                </span>
              )}
            </span>
          )}

          {event.place && (
            <>
              <span className="text-sepia-dark/60">•</span>
              <span className="inline-flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-terracotta">
                  location_on
                </span>
                <span>{event.place}</span>
              </span>
            </>
          )}
        </div>
      </div>

      {/* Progreso */}
      <div className="mt-6 pt-5 border-t border-sepia-border">
        <div className="flex justify-between items-center mb-2.5">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-terracotta">
              task_alt
            </span>
            <span className="font-body text-sm font-semibold text-ink-charcoal">
              Progreso de gestiones
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono-stamp text-[11px] text-ink-muted">
              {stats.total === 0
                ? "Sin gestiones programadas"
                : `${stats.completed} / ${stats.total} completadas`}
            </span>
            <span className="font-mono-stamp text-xs font-bold text-terracotta-dark">
              {percent}%
            </span>
          </div>
        </div>

        <div className="w-full rounded-full h-2.5 bg-paper-linen overflow-hidden">
          <div
            className="bg-terracotta h-full rounded-full transition-all duration-500"
            style={{ width: `${percent}%` }}
          />
        </div>

        <div className="flex items-center gap-1.5 mt-2.5">
          <span className="material-symbols-outlined text-[15px] text-ink-subtle">
            schedule
          </span>
          <span className="font-body text-xs text-ink-muted">
            {stats.total === 0 ? (
              "Aún no se han programado gestiones para este evento."
            ) : (
              <>
                {stats.pending} pendiente{stats.pending !== 1 ? "s" : ""}
                {stats.overdue > 0 && (
                  <>
                    {" · "}
                    <span className="text-crimson-urgent font-semibold">
                      {stats.overdue} vencida{stats.overdue !== 1 ? "s" : ""}
                    </span>
                  </>
                )}
              </>
            )}
          </span>
        </div>
      </div>
    </section>
  );
}