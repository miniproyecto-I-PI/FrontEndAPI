/**
 * PriorityRuleBanner.jsx
 * ---------------------------------------------------------------------------
 * The explanatory box that tells the user HOW the list below is ordered.
 * This text must always describe the actual rule implemented in
 * utils/sortGestiones.js — if that rule ever changes, update both places.
 */
export default function PriorityRuleBanner() {
  return (
    <div className="mt-4 bg-paper-card border border-sepia-border rounded-asym-book p-4 px-5 flex items-start sm:items-center gap-3.5 warm-card-shadow">
      <div className="w-7 h-7 shrink-0 rounded-sharp border border-sepia-border bg-paper-base flex items-center justify-center text-terracotta font-serif font-bold text-sm">
        §
      </div>
      <div className="flex-1">
        <p className="font-body text-xs md:text-sm text-ink-charcoal leading-relaxed">
          <strong className="font-semibold text-terracotta-dark font-serif text-xs uppercase tracking-wider mr-1">
            Regla de priorización editorial:
          </strong>
          Las gestiones vencidas aparecen primero (de la más antigua a la más reciente), luego las
          de hoy, y luego las próximas ordenadas por fecha más cercana. En caso de empate, se
          prioriza la de menor esfuerzo estimado.
        </p>
      </div>
    </div>
  );
}
