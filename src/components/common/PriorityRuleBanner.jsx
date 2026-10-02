import { useEffect, useId, useRef, useState } from "react";
import { PRIORITY_RULE_TEXT } from "../../utils/sortGestiones";

/**
 * PriorityRuleBanner.jsx — "¿Cómo se ordena esto?" (US-04, escenario 4).
 * Diseño Stitch: botón "(?) Criterio editorial" con un tooltip que muestra la
 * regla. Se abre con hover, con foco de teclado o con clic/toque, y se cierra
 * con Escape o al hacer clic fuera.
 */
export default function PriorityRuleBanner() {
  const [pinned, setPinned] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const containerRef = useRef(null);
  const tooltipId = useId();
  const open = pinned || hovered || focused;

  useEffect(() => {
    if (!open) return;
    function handleKey(e) {
      if (e.key === "Escape") {
        setPinned(false);
        setHovered(false);
        setFocused(false);
      }
    }
    function handlePointer(e) {
      if (!containerRef.current?.contains(e.target)) setPinned(false);
    }
    document.addEventListener("keydown", handleKey);
    document.addEventListener("mousedown", handlePointer);
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.removeEventListener("mousedown", handlePointer);
    };
  }, [open]);

  return (
    <div
      ref={containerRef}
      className="relative inline-flex items-center z-30"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <button
        type="button"
        onClick={() => setPinned((v) => !v)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        aria-expanded={open}
        aria-describedby={tooltipId}
        className="inline-flex items-center gap-1 text-xs text-ink-muted hover:text-terracotta transition-colors rounded-sharp focus:outline-none focus-visible:text-terracotta focus-visible:ring-2 focus-visible:ring-terracotta"
      >
        <span className="material-symbols-outlined text-[16px]" aria-hidden="true">help_outline</span>
        <span className="font-body text-[11px]">Criterio editorial</span>
        <span className="sr-only">: ¿cómo se ordena esta lista?</span>
      </button>

      <div
        id={tooltipId}
        role="tooltip"
        className={[
          "absolute right-0 top-full mt-2 w-80 max-w-[90vw] p-3.5 bg-paper-card border border-sepia-border rounded-sharp shadow-lg warm-card-shadow text-ink-charcoal text-xs font-body leading-relaxed transition-opacity duration-150",
          open ? "opacity-100 visible" : "opacity-0 invisible",
        ].join(" ")}
      >
        <div className="flex items-start gap-2">
          <span className="font-bold text-terracotta text-sm leading-none shrink-0 mt-0.5" aria-hidden="true">§</span>
          <p>
            <strong className="font-bold text-terracotta-dark text-xs uppercase tracking-wider block mb-1">
              Regla de priorización editorial:
            </strong>
            {PRIORITY_RULE_TEXT}
          </p>
        </div>
      </div>
    </div>
  );
}
