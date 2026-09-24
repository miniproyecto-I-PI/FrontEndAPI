/**
 * SubtaskFilters.jsx — pills de filtro sobre la lista de gestiones.
 * El conteo de cada filtro es excluyente y suma el total:
 *   vencidas + pendientes + completadas === total
 */
export default function SubtaskFilters({ value, onChange, counts }) {
  const items = [
    { key: "todas",      label: "Todas",      count: counts.total,     tone: "default" },
    { key: "vencidas",   label: "Vencidas",   count: counts.overdue,   tone: "danger"  },
    { key: "pendientes", label: "Pendientes", count: counts.pending,   tone: "default" },
    { key: "completadas", label: "Completadas", count: counts.completed, tone: "default" },
  ];

  return (
    <div className="flex items-center gap-2.5 py-4 overflow-x-auto">
      {items.map((f) => {
        const isActive = value === f.key;
        const isDanger = f.tone === "danger";

        const classes = isDanger
          ? [
              "inline-flex items-center gap-1.5 whitespace-nowrap px-3.5 py-1 rounded-sharp font-body text-xs font-semibold tracking-wide transition-colors",
              isActive
                ? "bg-crimson-paper text-crimson-urgent border-2 border-crimson-urgent/60"
                : "bg-paper-card text-crimson-urgent hover:bg-crimson-paper border border-crimson-urgent/40",
            ].join(" ")
          : [
              "inline-flex items-center gap-1.5 whitespace-nowrap px-3.5 py-1 rounded-sharp font-body text-xs font-semibold tracking-wide transition-colors",
              isActive
                ? "bg-paper-card text-ink-charcoal border-2 border-terracotta/60"
                : "bg-paper-card text-ink-muted hover:text-ink-charcoal border border-sepia-border",
            ].join(" ");

        return (
          <button key={f.key} type="button" onClick={() => onChange(f.key)} className={classes}>
            {isDanger && f.count > 0 && (
              <span className="w-1.5 h-1.5 rounded-full bg-crimson-urgent" />
            )}
            <span>
              {f.label} ({f.count})
            </span>
          </button>
        );
      })}
    </div>
  );
}