import { Link } from "react-router-dom";
import {
  EVENT_STATUS_LABELS,
  EVENT_STATUS_TONES,
  EVENT_TYPE_SINGULAR,
} from "../../data/mockEvents";

const MONTHS = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

function formatDayMonthYear(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

function StatusBadge({ status }) {
  const tone = EVENT_STATUS_TONES[status] ?? EVENT_STATUS_TONES.planificacion_inicial;
  const label = EVENT_STATUS_LABELS[status] ?? status ?? "—";
  return (
    <span
      className={`font-mono-stamp text-[10px] font-semibold px-2.5 py-1 rounded-sharp whitespace-nowrap inline-block ${tone.bg} ${tone.text}`}
    >
      {label}
    </span>
  );
}

/**
 * EventsTable.jsx — tabla de /eventos.
 * Columnas: Evento y cliente | Categoría | Fecha | Ubicación | Progreso |
 * Estado | Acciones.
 */
export default function EventsTable({ events, onEdit, onDelete }) {
  return (
    <div className="bg-paper-card border border-sepia-border rounded-sharp warm-card-shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-sepia-border font-mono-stamp text-[10px] uppercase text-ink-muted tracking-wider">
            <tr>
              <th className="py-3.5 px-5 font-bold">Evento y cliente</th>
              <th className="py-3.5 px-4 font-bold">Categoría</th>
              <th className="py-3.5 px-4 font-bold">Fecha</th>
              <th className="py-3.5 px-4 font-bold">Ubicación</th>
              <th className="py-3.5 px-4 font-bold">Progreso</th>
              <th className="py-3.5 px-4 font-bold">Estado</th>
              <th className="py-3.5 px-5 text-right font-bold">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-sepia-border/60 font-body text-ink-charcoal">
            {events.map((evt) => (
              <tr
                key={evt.id}
                className="hover:bg-paper-linen/30 transition-colors"
              >
                <td className="py-4 px-5">
                  <Link to={`/evento/${evt.id}`} className="block group">
                    <div className="font-bold font-serif text-[15px] leading-snug text-ink-charcoal group-hover:text-terracotta transition-colors">
                      {evt.name}
                    </div>
                    {evt.contact && (
                      <div className="text-[11px] text-ink-muted mt-0.5">
                        {evt.contact}
                      </div>
                    )}
                  </Link>
                </td>

                <td className="py-4 px-4">
                  <span className="font-mono-stamp text-[10px] font-bold text-ink-charcoal bg-paper-linen/60 border border-sepia-border px-2 py-1 rounded-sharp uppercase tracking-wider inline-block">
                    {EVENT_TYPE_SINGULAR[evt.type]?.toUpperCase() ?? (evt.type ?? "—").toUpperCase()}
                  </span>
                </td>

                <td className="py-4 px-4 font-mono-stamp text-xs text-ink-charcoal font-medium whitespace-nowrap">
                  {formatDayMonthYear(evt.dateTime)}
                </td>

                <td className="py-4 px-4 text-ink-charcoal text-xs">
                  {evt.place || "—"}
                </td>

                <td className="py-4 px-4">
                  <span className="font-mono-stamp text-xs font-bold text-ink-charcoal">
                    {evt.progress
                      ? `${evt.progress.done} / ${evt.progress.total}`
                      : "—"}
                  </span>
                </td>

                <td className="py-4 px-4">
                  <StatusBadge status={evt.status} />
                </td>

                <td className="py-4 px-5 text-right whitespace-nowrap">
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      type="button"
                      onClick={() => onEdit(evt)}
                      title="Editar evento"
                      aria-label={`Editar evento "${evt.name}"`}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-sharp text-ink-muted hover:text-terracotta hover:bg-paper-linen/60 border border-transparent hover:border-sepia-border transition-colors text-xs font-medium"
                    >
                      <span className="material-symbols-outlined text-[16px]">
                        edit
                      </span>
                      <span>Editar</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(evt)}
                      title="Eliminar evento"
                      aria-label={`Eliminar evento "${evt.name}"`}
                      className="inline-flex items-center justify-center w-7 h-7 rounded-sharp text-ink-muted hover:text-crimson-urgent hover:bg-crimson-paper border border-transparent hover:border-crimson-urgent/30 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[16px]">
                        delete
                      </span>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}