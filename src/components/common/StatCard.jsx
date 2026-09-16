/**
 * StatCard.jsx
 * ---------------------------------------------------------------------------
 * One reusable card for the four header metrics (Vencidas, Para Hoy,
 * Próximas, Carga Estimada). Kept generic (label/value/accent props) instead
 * of four near-duplicate components, per the "modular y escalable" goal —
 * adding a fifth metric later is just another <StatCard /> call.
 */
const ACCENT_STYLES = {
  crimson: { label: "text-crimson-tag", value: "text-crimson-urgent", track: "bg-[#fae5e1]", bar: "bg-crimson-urgent" },
  terracotta: { label: "text-terracotta-dark", value: "text-terracotta", track: "bg-terracotta-light/60", bar: "bg-terracotta" },
  neutral: { label: "text-ink-muted", value: "text-ink-charcoal", track: "bg-sepia-border", bar: "bg-ink-muted" },
  sage: { label: "text-sage-wax", value: "text-sage-wax", track: "bg-sage-light", bar: "bg-sage-wax" },
};

export default function StatCard({ label, tag, value, unit, accent = "neutral", barWidthPercent = 50 }) {
  const styles = ACCENT_STYLES[accent] ?? ACCENT_STYLES.neutral;

  return (
    <div className="bg-paper-card border border-sepia-border p-3.5 px-4 rounded-sharp warm-card-shadow relative">
      <div className="flex items-center justify-between">
        <span className={`font-stamp text-[10px] uppercase tracking-wider font-bold ${styles.label}`}>{label}</span>
        {tag && <span className={`font-serif italic text-xs font-medium ${styles.label}`}>{tag}</span>}
      </div>
      <div className="flex items-baseline gap-2 mt-1">
        <span className={`font-serif text-3xl font-bold ${styles.value}`}>{value}</span>
        <span className="font-body text-xs text-ink-muted">{unit}</span>
      </div>
      <div className={`w-full h-1 mt-2.5 rounded-none overflow-hidden ${styles.track}`}>
        <div
          className={`h-full ${styles.bar}`}
          style={{ width: `${Math.min(100, Math.max(0, barWidthPercent))}%` }}
        />
      </div>
    </div>
  );
}
