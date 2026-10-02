/**
 * StateCard.jsx
 * ---------------------------------------------------------------------------
 * Tarjeta única para los estados vacío / sin resultados / error de todas las
 * páginas (diseños de Stitch unificados): ícono, sello, título, descripción,
 * acciones y una nota opcional al pie.
 *
 * @param {'empty'|'error'} [tone]
 * @param {string} icon          Material Symbols
 * @param {string} [stamp]       sello en Space Mono ("Incidencia de sincronización")
 * @param {string} title
 * @param {React.ReactNode} [description]
 * @param {{label, icon?, onClick, disabled?}} [primaryAction]
 * @param {{label, icon?, onClick}} [secondaryAction]
 * @param {React.ReactNode} [footnote]
 * @param {boolean} [compact]    sin margen superior grande (dentro de secciones)
 */
export default function StateCard({
  tone = "empty",
  icon,
  stamp,
  title,
  description,
  primaryAction,
  secondaryAction,
  footnote,
  compact = false,
}) {
  const isError = tone === "error";

  return (
    <div
      role={isError ? "alert" : "status"}
      className={[
        "relative bg-paper-card border border-sepia-border rounded-sharp warm-card-shadow text-center max-w-2xl mx-auto overflow-hidden",
        "px-6 py-10 sm:px-12 sm:py-12",
        compact ? "mt-2" : "mt-8",
      ].join(" ")}
    >
      {isError && (
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-crimson-urgent via-terracotta to-sepia-border" aria-hidden="true" />
      )}

      <div
        className={[
          "w-14 h-14 mx-auto mb-4 rounded-sharp border flex items-center justify-center",
          isError ? "bg-crimson-paper border-crimson-urgent/30 text-crimson-urgent" : "bg-terracotta-light/70 border-terracotta/20 text-terracotta",
        ].join(" ")}
        aria-hidden="true"
      >
        <span className="material-symbols-outlined text-[26px]">{icon}</span>
      </div>

      {stamp && (
        <span
          className={[
            "inline-block mb-3 px-2 py-0.5 font-stamp text-[10px] uppercase tracking-wider font-bold rounded-sharp border",
            isError ? "text-crimson-tag bg-crimson-paper border-crimson-urgent/30" : "text-ink-muted bg-paper-linen border-sepia-border",
          ].join(" ")}
        >
          {stamp}
        </span>
      )}

      <h2 className="font-heading text-2xl md:text-[28px] font-bold tracking-tight text-ink-charcoal leading-tight">{title}</h2>
      {description && (
        <p className="font-body text-sm text-ink-muted max-w-md mx-auto mt-2 leading-relaxed">{description}</p>
      )}

      {(primaryAction || secondaryAction) && (
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
          {primaryAction && (
            <button
              type="button"
              onClick={primaryAction.onClick}
              disabled={primaryAction.disabled}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-terracotta text-[#FAF6F0] font-body font-semibold text-sm rounded-sharp border border-terracotta-dark shadow-sm hover:bg-terracotta-dark disabled:opacity-60 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-terracotta focus-visible:ring-offset-2 focus-visible:ring-offset-paper-card"
            >
              {primaryAction.icon && (
                <span className={`material-symbols-outlined text-[18px] ${primaryAction.disabled ? "animate-spin" : ""}`} aria-hidden="true">
                  {primaryAction.disabled ? "progress_activity" : primaryAction.icon}
                </span>
              )}
              <span>{primaryAction.label}</span>
            </button>
          )}
          {secondaryAction && (
            <button
              type="button"
              onClick={secondaryAction.onClick}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-paper-linen hover:bg-paper-accent border border-sepia-border text-ink-charcoal font-body text-sm font-medium rounded-sharp transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-terracotta focus-visible:ring-offset-2 focus-visible:ring-offset-paper-card"
            >
              {secondaryAction.icon && <span className="material-symbols-outlined text-[18px] text-ink-muted" aria-hidden="true">{secondaryAction.icon}</span>}
              <span>{secondaryAction.label}</span>
            </button>
          )}
        </div>
      )}

      {footnote && (
        <div className="mt-7 pt-5 border-t border-sepia-border/70 flex items-center justify-center gap-1.5 font-body text-xs text-ink-muted">
          {footnote}
        </div>
      )}
    </div>
  );
}
