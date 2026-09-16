import { useNavigate } from "react-router-dom";

/**
 * EmptyState.jsx
 * ---------------------------------------------------------------------------
 * Shown when /hoy has no active gestiones. Matches Design.md §10 and the
 * "estados mínimos" rule from the Arquitectura de Información (C5, §6):
 * every empty state must suggest a concrete next action.
 */
export default function EmptyState() {
  const navigate = useNavigate();

  return (
    <div className="max-w-[1440px] mx-auto px-4 md:px-8 lg:px-12">
      <div className="mt-8 bg-paper-card border border-sepia-border rounded-sharp p-8 md:p-12 text-center max-w-xl mx-auto warm-card-shadow">
        <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-terracotta-light text-terracotta flex items-center justify-center">
          <span className="material-symbols-outlined text-[24px]">done_all</span>
        </div>
        <h3 className="font-serif text-2xl md:text-3xl text-ink-charcoal font-semibold mb-2">
          Hoy no tienes gestiones pendientes. ¿Creamos un evento?
        </h3>
        <p className="font-body text-sm text-ink-muted max-w-md mx-auto mb-6">
          Todos tus compromisos inmediatos están al día.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => navigate("/crear")}
            type="button"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-5 py-2.5 bg-terracotta text-[#FAF6F0] font-body font-semibold text-sm rounded-sharp shadow-sm hover:bg-terracotta-dark transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            <span>Crear evento</span>
          </button>
        </div>
      </div>
    </div>
  );
}
