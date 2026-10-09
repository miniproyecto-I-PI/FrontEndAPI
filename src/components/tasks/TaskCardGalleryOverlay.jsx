import TaskCard from "./TaskCard";

/**
 * TaskCardGalleryOverlay.jsx
 * ---------------------------------------------------------------------------
 * Tarjeta con capa de galería estilo WhatsApp.
 * Representa la tercera tarjeta cuando hay más tareas en el grupo; muestra
 * la tarjeta en segundo plano con un overlay oscuro translúcido indicando
 * `+{remainingCount}` y permitiendo hacer clic para abrir el modal carrusel.
 */
export default function TaskCardGalleryOverlay({
  gestion,
  variant,
  remainingCount,
  totalCount,
  onClickMore,
  onMarkDone,
  onReschedule,
  onEdit,
}) {
  return (
    <div className="relative group/gallery-item h-full overflow-hidden rounded-sharp">
      {/* Tarjeta de fondo */}
      <div className="pointer-events-none select-none opacity-85 filter contrast-95">
        <TaskCard
          gestion={gestion}
          variant={variant}
          onMarkDone={onMarkDone}
          onReschedule={onReschedule}
          onEdit={onEdit}
        />
      </div>

      {/* Capa de overlay estilo galería interactiva con tono claro */}
      <button
        type="button"
        onClick={onClickMore}
        aria-label={`Ver ${remainingCount} gestiones más en galería interactiva`}
        className="absolute inset-0 z-20 rounded-sharp bg-[#FAF6F0]/92 hover:bg-[#FAF6F0]/98 backdrop-blur-[3px] border-2 border-dashed border-sepia-dark/40 hover:border-terracotta/70 transition-all flex flex-col items-center justify-center p-4 text-ink-charcoal cursor-pointer text-center select-none shadow-sm focus:outline-none focus:ring-2 focus:ring-terracotta focus:ring-offset-2 focus:ring-offset-paper-card"
      >
        <span className="material-symbols-outlined text-[28px] text-terracotta mb-1 group-hover/gallery-item:scale-110 transition-transform">
          collections
        </span>
        <span className="font-heading text-3xl sm:text-4xl font-bold tracking-tight text-ink-charcoal group-hover/gallery-item:text-terracotta group-hover/gallery-item:scale-105 transition-all">
          +{remainingCount}
        </span>
        <span className="font-body text-xs sm:text-sm font-semibold text-ink-charcoal mt-1 inline-flex items-center gap-1 group-hover/gallery-item:underline decoration-1 underline-offset-2">
          <span>Ver todas ({totalCount})</span>
          <span className="material-symbols-outlined text-[15px] text-terracotta group-hover/gallery-item:translate-x-0.5 transition-transform" aria-hidden="true">
            arrow_forward
          </span>
        </span>
        <span className="font-stamp text-[10px] font-bold text-sepia-dark bg-sepia-border/60 px-2 py-0.5 rounded-sharp mt-1.5 uppercase tracking-wider border border-sepia-dark/20">
          Deslizar en galería
        </span>
      </button>
    </div>
  );
}
