/**
 * TaskCardGalleryOverlay.jsx
 * ---------------------------------------------------------------------------
 * Tarjeta de acceso a la galería interactiva cuando un grupo tiene más tareas
 * de las que caben en la vista principal.
 * Diseñada con estética de mazo de papel editorial (stacked card), evitando
 * transparencias que provoquen colisiones de texto o botones borrosos de fondo.
 */
export default function TaskCardGalleryOverlay({
  gestion,
  variant = "hoy-secundaria",
  remainingCount,
  totalCount,
  onClickMore,
}) {
  const isVencida = variant === "vencida";
  const isProxima = variant === "proxima";

  const groupLabel = isVencida
    ? "Vencidas"
    : isProxima
      ? "Próximas"
      : "Agenda de Hoy";

  const borderLeftClass = isVencida
    ? "border-l-[6px] border-l-crimson-urgent bg-crimson-paper/20"
    : isProxima
      ? "border-l-4 border-l-sepia-dark bg-paper-card"
      : "border-l-4 border-l-terracotta bg-paper-card";

  return (
    <div className="relative h-full flex flex-col group/gallery-card min-h-[160px]">
      {/* Efecto de hoja apilada detrás (mazo de cartas editorial) */}
      <div
        className="absolute inset-0 translate-x-1.5 translate-y-1.5 bg-paper-linen border border-sepia-border rounded-sharp -z-10 shadow-xs transition-transform group-hover/gallery-card:translate-x-2 group-hover/gallery-card:translate-y-2"
        aria-hidden="true"
      />

      {/* Tarjeta principal interactiva */}
      <button
        type="button"
        onClick={onClickMore}
        aria-label={`Ver las ${remainingCount} gestiones adicionales de ${groupLabel} en la galería interactiva`}
        className={`w-full h-full text-left border border-sepia-border rounded-sharp warm-card-shadow p-4 md:p-4.5 flex flex-col justify-between transition-all group-hover/gallery-card:border-terracotta/70 group-hover/gallery-card:shadow-md cursor-pointer select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-terracotta focus-visible:ring-offset-2 focus-visible:ring-offset-paper-base ${borderLeftClass}`}
      >
        {/* Cabecera de la tarjeta */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-ink-muted">
            <span
              className={`material-symbols-outlined text-[17px] ${
                isVencida ? "text-crimson-urgent" : "text-terracotta"
              }`}
              aria-hidden="true"
            >
              auto_awesome_motion
            </span>
            <span className="font-stamp text-[10px] uppercase font-bold tracking-wider">
              {groupLabel}
            </span>
          </div>
          <span
            className={`font-stamp text-[11px] font-bold px-2 py-0.5 rounded-sharp border ${
              isVencida
                ? "bg-crimson-paper text-crimson-urgent border-crimson-urgent/30"
                : "bg-terracotta/10 text-terracotta border-terracotta/25"
            }`}
          >
            +{remainingCount} más
          </span>
        </div>

        {/* Cuerpo central */}
        <div className="my-auto py-2.5">
          <div className="font-heading text-2xl md:text-3xl font-bold text-ink-charcoal group-hover/gallery-card:text-terracotta transition-colors flex items-baseline gap-2">
            <span>+{remainingCount}</span>
            <span className="text-xs md:text-sm font-body font-normal text-ink-muted">
              {remainingCount === 1 ? "gestión restante" : "gestiones restantes"}
            </span>
          </div>

          {gestion?.title && (
            <p className="font-body text-xs text-ink-muted mt-1.5 line-clamp-2 leading-relaxed">
              Siguiente: <span className="font-medium text-ink-charcoal">“{gestion.title}”</span>
            </p>
          )}
        </div>

        {/* Pie de acción */}
        <div className="pt-2.5 border-t border-sepia-border/70 flex items-center justify-between text-ink-charcoal mt-1">
          <span className="font-body text-xs font-semibold text-terracotta group-hover/gallery-card:text-terracotta-dark inline-flex items-center gap-1.5 transition-colors">
            <span>Ver todas ({totalCount})</span>
            <span
              className="material-symbols-outlined text-[15px] group-hover/gallery-card:translate-x-0.5 transition-transform"
              aria-hidden="true"
            >
              arrow_forward
            </span>
          </span>
          <span className="font-stamp text-[10px] text-ink-muted uppercase tracking-wider bg-paper-linen/80 px-2 py-0.5 rounded-sharp border border-sepia-border">
            Galería
          </span>
        </div>
      </button>
    </div>
  );
}
