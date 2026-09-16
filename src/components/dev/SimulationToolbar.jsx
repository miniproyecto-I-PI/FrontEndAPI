/**
 * SimulationToolbar.jsx
 * ---------------------------------------------------------------------------
 * Floating dev/QA tool ported from the original prototype. Lets whoever is
 * demoing or testing force each of the three required states (vacío / error
 * / carga) WITHOUT needing a real backend to cooperate — handy for Sprint 0
 * review and later for QA scripts (rubric criterio C6: "vacío / éxito /
 * error" must all be demonstrable).
 *
 * Intentionally excluded from production builds: see the `import.meta.env.DEV`
 * guard in pages/HoyPage.jsx, which only renders this component in local
 * development, never in `npm run build`.
 */
export default function SimulationToolbar({ mode, onToggleEmpty, onToggleError, onSimulateLoading }) {
  return (
    <aside className="fixed bottom-6 right-6 z-50">
      <div className="bg-[#FAF6F0]/95 backdrop-blur-md border border-sepia-border rounded-sharp shadow-md p-1.5 flex items-center gap-1.5">
        <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 text-ink-muted font-mono-stamp text-[10px] font-bold uppercase tracking-wider border-r border-sepia-border/70">
          <span className="w-2 h-2 rounded-full bg-terracotta" />
          <span>Simulación</span>
        </div>
        <button
          type="button"
          onClick={onSimulateLoading}
          className="inline-flex items-center gap-1 px-2.5 py-1 bg-paper-base hover:bg-paper-linen text-ink-charcoal font-body text-xs font-medium border border-sepia-border rounded-sharp transition-colors"
        >
          <span className="material-symbols-outlined text-[15px] text-terracotta">hourglass_empty</span>
          <span>Simular carga</span>
        </button>
        <button
          type="button"
          onClick={onToggleEmpty}
          className="inline-flex items-center gap-1 px-2.5 py-1 bg-paper-base hover:bg-paper-linen text-ink-charcoal font-body text-xs font-medium border border-sepia-border rounded-sharp transition-colors"
        >
          <span className="material-symbols-outlined text-[15px] text-terracotta">verified</span>
          <span>{mode === "empty" ? "Ver pendientes" : "Día completado"}</span>
        </button>
        <button
          type="button"
          onClick={onToggleError}
          className="inline-flex items-center gap-1 px-2.5 py-1 bg-paper-base hover:bg-[#fae8e5] text-ink-charcoal font-body text-xs font-medium border border-sepia-border rounded-sharp transition-colors"
        >
          <span className="material-symbols-outlined text-[15px] text-crimson-urgent">error</span>
          <span>{mode === "error" ? "Ver activas" : "Simular error"}</span>
        </button>
      </div>
    </aside>
  );
}
