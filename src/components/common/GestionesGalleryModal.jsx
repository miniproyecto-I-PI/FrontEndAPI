import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import TaskCard from "../tasks/TaskCard";

/**
 * GestionesGalleryModal.jsx
 * ---------------------------------------------------------------------------
 * Modal visor / carrusel estilo galería de WhatsApp para explorar todas las
 * gestiones de una sección (Hoy, Vencidas, Próximas) cuando hay más de 3.
 *
 * Características:
 * - Deslizamiento suave entre tarjetas con flechas y gestos táctiles (swipe).
 * - Navegación rápida por índice o tirilla de puntos/pills.
 * - Soporte para atajos de teclado (ArrowLeft, ArrowRight, Escape).
 * - Vista alterna tipo lista completa para escaneo rápido.
 * - Acciones integradas en cada tarjeta: marcar hecha, reprogramar, editar.
 */
export default function GestionesGalleryModal({
  isOpen,
  title = "Gestiones",
  numeral = "II.",
  tone = "terracotta",
  gestiones = [],
  initialIndex = 0,
  onClose,
  onMarkDone,
  onReschedule,
  onEdit,
}) {
  const total = gestiones.length;
  const [currentIndex, setCurrentIndex] = useState(() => {
    if (initialIndex >= 0 && initialIndex < total) return initialIndex;
    return 0;
  });
  const [viewMode, setViewMode] = useState("slider"); // 'slider' | 'list'

  const touchStartXRef = useRef(null);
  const modalRef = useRef(null);

  // Manejo de teclado
  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e) {
      if (e.key === "Escape") {
        onClose?.();
      } else if (e.key === "ArrowLeft") {
        setCurrentIndex((prev) => (prev > 0 ? prev - 1 : total - 1));
      } else if (e.key === "ArrowRight") {
        setCurrentIndex((prev) => (prev < total - 1 ? prev + 1 : 0));
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, total, onClose]);

  if (!isOpen || !gestiones || gestiones.length === 0) return null;

  const currentGestion = gestiones[currentIndex] || gestiones[0];

  function handlePrev() {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : total - 1));
  }

  function handleNext() {
    setCurrentIndex((prev) => (prev < total - 1 ? prev + 1 : 0));
  }

  // Soporte para gestos táctiles (Swipe)
  function handleTouchStart(e) {
    touchStartXRef.current = e.touches[0].clientX;
  }

  function handleTouchEnd(e) {
    if (touchStartXRef.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diffX = touchEndX - touchStartXRef.current;
    touchStartXRef.current = null;

    if (diffX > 45) {
      // Swipe hacia la derecha -> anterior
      handlePrev();
    } else if (diffX < -45) {
      // Swipe hacia la izquierda -> siguiente
      handleNext();
    }
  }

  // Determinar variante de tarjeta según el tono/título
  let cardVariant = "hoy-secundaria";
  if (tone === "crimson" || title.toLowerCase().includes("vencida")) {
    cardVariant = "vencida";
  } else if (title.toLowerCase().includes("próxima")) {
    cardVariant = "proxima";
  }

  const modalContent = (
    <div
      ref={modalRef}
      role="dialog"
      aria-modal="true"
      aria-label={`${title} - Galería de gestiones`}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-ink-charcoal/60 backdrop-blur-sm focus:outline-none"
      onClick={(e) => e.target === e.currentTarget && onClose?.()}
    >
      <div className="relative w-full max-w-2xl bg-paper-card border border-sepia-border rounded-sharp shadow-2xl warm-card-shadow flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Cabecera del modal */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-sepia-border bg-paper-linen/60">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="font-heading text-xs font-bold text-ink-muted">
              {numeral}
            </span>
            <h2 className="font-heading text-lg sm:text-xl font-bold text-ink-charcoal truncate">
              {title}
            </h2>
            <span className="px-2 py-0.5 rounded-sharp bg-paper-base border border-sepia-border font-stamp text-[10px] font-bold text-ink-muted shrink-0">
              {total} gestiones
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Toggle de vista */}
            <div className="hidden sm:flex items-center bg-paper-base border border-sepia-border rounded-sharp p-0.5 text-xs font-body">
              <button
                type="button"
                onClick={() => setViewMode("slider")}
                className={`px-2.5 py-1 rounded-sharp transition-colors flex items-center gap-1 ${
                  viewMode === "slider"
                    ? "bg-terracotta text-[#FAF6F0] font-semibold"
                    : "text-ink-muted hover:text-ink-charcoal"
                }`}
                title="Modo carrusel deslizable"
              >
                <span className="material-symbols-outlined text-[14px]">view_carousel</span>
                <span>Deslizar</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className={`px-2.5 py-1 rounded-sharp transition-colors flex items-center gap-1 ${
                  viewMode === "list"
                    ? "bg-terracotta text-[#FAF6F0] font-semibold"
                    : "text-ink-muted hover:text-ink-charcoal"
                }`}
                title="Modo lista completa"
              >
                <span className="material-symbols-outlined text-[14px]">list</span>
                <span>Lista</span>
              </button>
            </div>

            {/* Botón cerrar */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-sharp text-ink-muted hover:text-ink-charcoal hover:bg-paper-linen transition-colors focus:outline-none focus:ring-2 focus:ring-terracotta"
              aria-label="Cerrar visor"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
        </div>

        {/* Cuerpo del modal según modo */}
        {viewMode === "slider" ? (
          <div
            className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col justify-between select-none"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            {/* Barra superior del visor con contador y flechas rápidas */}
            <div className="flex items-center justify-between mb-3 text-xs font-body text-ink-muted">
              <span className="font-stamp text-[11px] font-bold text-terracotta uppercase tracking-wider">
                Gestión {currentIndex + 1} de {total}
              </span>
              <span className="text-[11px] italic text-ink-subtle hidden sm:inline">
                Usa las flechas ← → o desliza con el dedo
              </span>
            </div>

            {/* Contenedor central con tarjeta y flechas laterales */}
            <div className="relative flex items-center gap-2 sm:gap-4 my-auto py-2">
              {/* Flecha izquierda */}
              <button
                type="button"
                onClick={handlePrev}
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-paper-base hover:bg-paper-linen border border-sepia-border shadow-sm flex items-center justify-center text-ink-charcoal transition-transform active:scale-95 shrink-0 focus:outline-none focus:ring-2 focus:ring-terracotta z-10"
                aria-label="Gestión anterior"
                title="Anterior (Flecha izquierda)"
              >
                <span className="material-symbols-outlined text-[20px]">chevron_left</span>
              </button>

              {/* Tarjeta activa */}
              <div className="flex-1 min-w-0 transition-all duration-200">
                <TaskCard
                  key={currentGestion.id}
                  gestion={currentGestion}
                  variant={cardVariant}
                  onMarkDone={() => onMarkDone?.(currentGestion)}
                  onReschedule={() => {
                    onReschedule?.(currentGestion);
                  }}
                  onEdit={() => {
                    onEdit?.(currentGestion);
                  }}
                />
              </div>

              {/* Flecha derecha */}
              <button
                type="button"
                onClick={handleNext}
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-paper-base hover:bg-paper-linen border border-sepia-border shadow-sm flex items-center justify-center text-ink-charcoal transition-transform active:scale-95 shrink-0 focus:outline-none focus:ring-2 focus:ring-terracotta z-10"
                aria-label="Gestión siguiente"
                title="Siguiente (Flecha derecha)"
              >
                <span className="material-symbols-outlined text-[20px]">chevron_right</span>
              </button>
            </div>

            {/* Paginador inferior con tira de puntos / pills */}
            <div className="pt-4 mt-2 border-t border-sepia-border/60">
              <div className="flex items-center justify-center gap-1.5 flex-wrap max-h-24 overflow-y-auto px-2 py-1">
                {gestiones.map((g, idx) => {
                  const isActive = idx === currentIndex;
                  return (
                    <button
                      key={g.id || idx}
                      type="button"
                      onClick={() => setCurrentIndex(idx)}
                      className={`h-2 sm:h-2.5 rounded-full transition-all focus:outline-none ${
                        isActive
                          ? "w-7 sm:w-8 bg-terracotta shadow-sm ring-1 ring-terracotta"
                          : "w-2 sm:w-2.5 bg-sepia-dark/30 hover:bg-sepia-dark/60"
                      }`}
                      aria-label={`Ir a gestión ${idx + 1}: ${g.title || "Sin título"}`}
                      title={`${idx + 1}. ${g.title || "Gestión"}`}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          /* Modo lista completa */
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
            {gestiones.map((g, idx) => (
              <div key={g.id || idx} className="relative">
                <div className="text-[10px] font-stamp text-ink-muted uppercase font-bold mb-1">
                  #{idx + 1} de {total}
                </div>
                <TaskCard
                  gestion={g}
                  variant={cardVariant}
                  onMarkDone={() => onMarkDone?.(g)}
                  onReschedule={() => onReschedule?.(g)}
                  onEdit={() => onEdit?.(g)}
                />
              </div>
            ))}
          </div>
        )}

        {/* Footer del modal */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-sepia-border bg-paper-linen/40">
          <span className="font-body text-xs text-ink-muted">
            {currentIndex + 1} de {total} gestiones
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-sharp bg-paper-base hover:bg-paper-linen border border-sepia-border text-ink-charcoal font-body text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-terracotta"
          >
            Listo
          </button>
        </div>
      </div>
    </div>
  );

  return typeof document !== "undefined" ? createPortal(modalContent, document.body) : modalContent;
}
