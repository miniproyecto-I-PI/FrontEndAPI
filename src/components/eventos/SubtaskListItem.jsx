import {
  classifyByDate,
  formatOverdueLabel,
  formatShortDate,
  formatUpcomingLabel,
} from "../../utils/dateUtils";

const isDone = (s) => s?.status === "EJECUTADA";

/**
 * SubtaskListItem.jsx — fila de una gestión logística en /evento/:id.
 * Borde izquierdo decreciente por urgencia (Design.md §4):
 *   vencida  → 6px crimson
 *   hoy      → 4px terracotta
 *   próxima  → 2px sepia-dark
 *   hecha    → 2px sepia-border (atenuada)
 */
export default function SubtaskListItem({
  subtask,
  onToggleDone,
  onEdit,
  onDelete,
  onMarkDone,
  onReschedule,
}) {
  const done = isDone(subtask);
  const bucket = classifyByDate(subtask.targetDate);

  const borderLeft = done
    ? "border-l-[2px] border-l-sepia-border"
    : bucket === "vencida"
      ? "border-l-[6px] border-l-crimson-urgent"
      : bucket === "hoy"
        ? "border-l-4 border-l-terracotta"
        : "border-l-[2px] border-l-sepia-dark";

  const badge = (() => {
    if (done) {
      return (
        <span className="font-mono-stamp text-[10px] uppercase px-2 py-0.5 rounded-sharp bg-paper-linen border border-sepia-border text-ink-muted font-medium tracking-wide">
          Completada
        </span>
      );
    }
    if (bucket === "vencida") {
      return (
        <span className="font-mono-stamp text-[10px] uppercase px-2 py-0.5 rounded-sharp bg-crimson-paper border border-crimson-urgent/30 text-crimson-urgent font-bold tracking-wide">
          {formatOverdueLabel(subtask.targetDate)}
        </span>
      );
    }
    if (bucket === "hoy") {
      return (
        <span className="font-mono-stamp text-[10px] uppercase px-2 py-0.5 rounded-sharp bg-terracotta-light/70 border border-terracotta/30 text-terracotta-dark font-bold tracking-wide">
          Hoy
        </span>
      );
    }
    return (
      <span className="font-mono-stamp text-[10px] uppercase px-2 py-0.5 rounded-sharp bg-paper-linen border border-sepia-border text-ink-muted font-medium tracking-wide">
        {formatUpcomingLabel(subtask.targetDate) || formatShortDate(subtask.targetDate)}
      </span>
    );
  })();

  return (
    <li
      className={[
        "bg-paper-card border border-sepia-border rounded-sharp p-4 md:p-5",
        "flex flex-col lg:flex-row lg:items-center justify-between gap-4",
        "transition-shadow hover:shadow-sm",
        borderLeft,
        done && "opacity-75",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="flex items-start gap-3.5 flex-1 min-w-0">
        <input
          type="checkbox"
          checked={done}
          onChange={onToggleDone}
          aria-label={
            done
              ? `Marcar "${subtask.title}" como pendiente`
              : `Marcar "${subtask.title}" como hecha`
          }
          className="mt-1 h-5 w-5 rounded-sharp border-sepia-border text-terracotta focus:ring-2 focus:ring-terracotta focus:ring-offset-1 accent-terracotta cursor-pointer shrink-0"
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-center flex-wrap gap-2 mb-1">
            {badge}
            <span className="font-mono-stamp text-[11px] text-terracotta-dark font-medium inline-flex items-center gap-1">
              <span className="material-symbols-outlined text-[13px]">timer</span>
              {subtask.estimatedHours} hrs estimadas
            </span>
          </div>

          <h4
            className={[
              "font-serif text-lg font-bold leading-snug",
              done
                ? "line-through text-ink-muted"
                : "text-ink-charcoal",
            ].join(" ")}
          >
            {subtask.title}
          </h4>

            {subtask.provider && (
  <p className="font-body text-xs text-ink-muted mt-1 inline-flex items-center gap-1">
    <span className="material-symbols-outlined text-[13px] text-ink-subtle">
      storefront
    </span>
    <span>{subtask.provider}</span>
  </p>
)}

          {subtask.note && (
            <p className="font-body text-xs text-ink-muted mt-1 leading-relaxed">
              {subtask.note}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center flex-wrap gap-2 self-end lg:self-center shrink-0">
        <button
          type="button"
          onClick={onEdit}
          title="Editar gestión"
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-sharp font-body text-xs text-ink-muted hover:text-ink-charcoal border border-sepia-border hover:bg-paper-linen transition-colors"
        >
          <span className="material-symbols-outlined text-[15px]">edit</span>
          <span>Editar</span>
        </button>

        {!done && (
          <>
            <button
              type="button"
              onClick={onMarkDone}
              title="Marcar como hecha"
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-sharp font-body text-xs font-medium bg-paper-linen hover:bg-paper-base border border-sepia-border text-ink-charcoal transition-colors"
            >
              <span className="material-symbols-outlined text-[15px] text-terracotta">
                check_circle
              </span>
              <span>Marcar como hecha</span>
            </button>

            <button
              type="button"
              onClick={onReschedule}
              title="Reprogramar"
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-sharp font-body text-xs text-ink-muted hover:text-ink-charcoal border border-sepia-border hover:bg-paper-linen transition-colors"
            >
              <span className="material-symbols-outlined text-[15px]">update</span>
              <span>Reprogramar</span>
            </button>
          </>
        )}

        <button
          type="button"
          onClick={onDelete}
          title="Eliminar gestión"
          aria-label={`Eliminar gestión "${subtask.title}"`}
          className="p-1.5 rounded-sharp border border-sepia-border text-ink-muted hover:text-crimson-urgent hover:border-crimson-urgent/40 hover:bg-crimson-paper transition-colors"
        >
          <span className="material-symbols-outlined text-[15px]">delete</span>
        </button>
      </div>
    </li>
  );
}