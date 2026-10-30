import TaskCard from "./TaskCard";

/**
 * TaskCardGalleryOverlay.jsx
 * ---------------------------------------------------------------------------
 * Tarjeta con capa de galería estilo WhatsApp.
 * Se ajustó el overflow para que el focus ring sea visible al navegar con teclado.
 * Se añadieron clases group-focus-visible para replicar los efectos de hover.
 */
export default function TaskCardGalleryOverlay({
  gestion,
  variant,
  remainingCount,
  totalCount,
  onClickMore,
  onMarkDone,
  onReschedule,
  onPostpone,
  onEdit,
  onDelete,
}) {
  return (
    /* 1. Quitamos overflow-hidden del padre para que el anillo de foco se vea */
    <div className="relative group/gallery-item h-full rounded-sharp">
      {/* Tarjeta de fondo */}
      {/* 2. Mantenemos el overflow-hidden aquí para que las esquinas de la tarjeta de atrás no se salgan */}
      <div className="pointer-events-none select-none opacity-85 filter contrast-95 h-full overflow-hidden rounded-sharp">
        <TaskCard
          gestion={gestion}
          variant={variant}
          onMarkDone={onMarkDone}
          onReschedule={onReschedule}
          onPostpone={onPostpone}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      </div>

      {/* Capa de overlay estilo galería interactiva */}
      <button
        type="button"
        onClick={onClickMore}
        aria-label={`Ver ${remainingCount} gestiones más en galería interactiva`}
        /* 3. Usamos focus-visible para que el anillo aparezca solo con Tab y no al hacer clic */
        className="absolute inset-0 z-20 rounded-sharp bg-[#FAF6F0]/94 hover:bg-[#FAF6F0]/98 focus-visible:bg-[#FAF6F0]/98 backdrop-blur-[3px] border-2 border-dashed border-sepia-dark/40 hover:border-terracotta/70 focus-visible:border-terracotta/70 transition-all flex items-center justify-center gap-3 sm:gap-4 p-3 text-ink-charcoal cursor-pointer select-none shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-terracotta focus-visible:ring-offset-2 focus-visible:ring-offset-paper-card"
      >
        {/* Bloque izquierdo: ícono + contador */}
        {/* 4. Añadimos group-focus-visible para que escale al recibir foco por teclado */}
        <div className="flex flex-col items-center shrink-0 group-hover/gallery-item:scale-105 group-focus-visible/gallery-item:scale-105 transition-transform">
          <span className="material-symbols-outlined text-[22px] sm:text-[24px] text-terracotta leading-none">
            collections
          </span>
          <span className="font-heading text-2xl sm:text-3xl font-extrabold tracking-tight text-terracotta group-hover/gallery-item:text-terracotta-dark group-focus-visible/gallery-item:text-terracotta-dark transition-colors leading-none mt-0.5">
            +{remainingCount}
          </span>
        </div>

        {/* Separador vertical sutil */}
        <span className="h-10 w-px bg-sepia-dark/25 shrink-0" aria-hidden="true" />

        {/* Bloque derecho: ver todas */}
        <div className="flex flex-col items-start min-w-0">
          <span className="font-body text-xs sm:text-sm font-bold text-ink-charcoal group-hover/gallery-item:text-terracotta group-focus-visible/gallery-item:text-terracotta transition-colors inline-flex items-center gap-1">
            <span>Ver todas ({totalCount})</span>
            <span
              className="material-symbols-outlined text-[15px] text-terracotta group-hover/gallery-item:translate-x-0.5 group-focus-visible/gallery-item:translate-x-0.5 transition-transform"
              aria-hidden="true"
            >
              arrow_forward
            </span>
          </span>
          <span className="font-stamp text-[9px] sm:text-[10px] font-bold text-terracotta-dark bg-paper-card px-2 py-0.5 rounded-sharp mt-1 uppercase tracking-wider border border-sepia-border shadow-xs">
            Deslizar en galería
          </span>
        </div>
      </button>
    </div>
  );
}