import { useNavigate } from "react-router-dom";

/**
 * ComingSoonPlaceholder.jsx
 * ---------------------------------------------------------------------------
 * Sprint 0 only implements the "/hoy" route end-to-end (rúbrica C6). The
 * other routes defined in the Arquitectura de Información (C5) already
 * exist and are reachable — so navigation/IA can be reviewed and the
 * structure is ready for the backend — but their real UI lands in later
 * sprints per the Backlog Refinado (C4) sprint plan. This component keeps
 * that intent explicit instead of leaving a blank/broken page.
 */
export default function ComingSoonPlaceholder({ title, description, plannedSprint }) {
  const navigate = useNavigate();

  return (
    <div className="max-w-[1440px] mx-auto px-4 md:px-8 lg:px-12 py-16">
      <div className="bg-paper-card border border-sepia-border rounded-sharp p-8 md:p-12 text-center max-w-xl mx-auto warm-card-shadow">
        <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-terracotta-light text-terracotta flex items-center justify-center">
          <span className="material-symbols-outlined text-[24px]">construction</span>
        </div>
        <h1 className="font-serif text-2xl md:text-3xl text-ink-charcoal font-semibold mb-2">{title}</h1>
        <p className="font-body text-sm text-ink-muted max-w-md mx-auto mb-2">{description}</p>
        {plannedSprint && (
          <p className="font-mono-stamp text-[11px] text-terracotta-dark uppercase tracking-wide mb-6">
            Planificado para {plannedSprint}
          </p>
        )}
        <button
          type="button"
          onClick={() => navigate("/hoy")}
          className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 bg-terracotta text-[#FAF6F0] font-body font-semibold text-sm rounded-sharp shadow-sm hover:bg-terracotta-dark transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          <span>Volver a Hoy</span>
        </button>
      </div>
    </div>
  );
}
