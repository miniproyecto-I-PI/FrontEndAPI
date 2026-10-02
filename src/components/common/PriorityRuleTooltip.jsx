import { useEffect, useId, useRef, useState } from "react";

/**
 * PriorityRuleTooltip.jsx — "¿Cómo se ordena?" (US-04, escenario 4).
 * Va junto al título de cada grupo de /hoy (Vencidas, Agenda de Hoy,
 * Próximas Jornadas) y muestra la regla de orden de ese grupo (`rule`).
 * Se abre con hover, con foco de teclado o con clic/toque, y se cierra con
 * Escape o al hacer clic fuera.
 */
export default function PriorityRuleTooltip({ rule }) {
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
    <span
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
        className="inline-flex items-center gap-1 font-body text-sm font-semibold text-terracotta hover:text-terracotta-dark underline decoration-2 underline-offset-4 decoration-terracotta/50 hover:decoration-terracotta-dark cursor-help transition-colors rounded-sharp focus:outline-none focus-visible:ring-2 focus-visible:ring-terracotta"
      >
        <span className="material-symbols-outlined text-[17px] no-underline" aria-hidden="true">help</span>
        ¿Cómo se ordena?
      </button>

      <span
        id={tooltipId}
        role="tooltip"
        className={[
          "absolute left-0 top-full mt-2 w-72 max-w-[85vw] p-3.5 bg-terracotta-light border border-terracotta/40 border-l-4 border-l-terracotta rounded-sharp shadow-lg text-ink-charcoal text-xs font-body leading-relaxed transition-opacity duration-150",
          open ? "opacity-100 visible" : "opacity-0 invisible",
        ].join(" ")}
      >
        <strong className="block mb-1 font-bold text-terracotta-dark uppercase tracking-wider">¿Cómo se ordena?</strong>
        {rule}
      </span>
    </span>
  );
}
