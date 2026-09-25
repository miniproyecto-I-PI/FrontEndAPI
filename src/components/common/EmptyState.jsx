import { useNavigate } from "react-router-dom";

/**
 * EmptyState.jsx
 * ---------------------------------------------------------------------------
 * Estado vacío reutilizable. Los defaults replican el copy de la vista "Hoy"
 * (US-04), así que pages/HoyPage.jsx sigue funcionando sin cambios.
 *
 * @param {string}   [title]
 * @param {string}   [description]
 * @param {string}   [ctaLabel]
 * @param {string}   [ctaTo]           - ruta a navegar (usa useNavigate)
 * @param {() => void} [onCta]         - callback alternativo a la navegación
 * @param {string}   [icon]            - nombre de Material Symbols Outlined
 * @param {string}   [secondaryLabel]  - label del botón secundario (opcional)
 * @param {() => void} [onSecondaryCta] - callback del botón secundario
 *
 * NOTA Sprint 1: "Volver al listado" no tiene destino real todavía porque
 * /hoy es la pantalla principal. Cuando exista un listado de eventos, se
 * actualizará a una ruta concreta.
 */
export default function EmptyState({
  title = "Hoy no tienes gestiones pendientes. ¿Creamos un evento?",
  description = "Todos tus compromisos inmediatos están al día.",
  ctaLabel = "Crear evento",
  ctaTo = "/crear",
  onCta,
  icon = "done_all",
  secondaryLabel,
  onSecondaryCta,
}) {
  const navigate = useNavigate();

  function handleCta() {
    if (onCta) onCta();
    else if (ctaTo) navigate(ctaTo);
  }

  return (
    <div className="max-w-[1440px] mx-auto px-4 md:px-8 lg:px-12">
      <div className="mt-8 bg-paper-card border border-sepia-border rounded-sharp p-8 md:p-12 text-center max-w-xl mx-auto warm-card-shadow">
        <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-terracotta-light text-terracotta flex items-center justify-center">
          <span className="material-symbols-outlined text-[24px]">{icon}</span>
        </div>
        <h3 className="font-serif text-2xl md:text-3xl text-ink-charcoal font-semibold mb-2">
          {title}
        </h3>
        <p className="font-body text-sm text-ink-muted max-w-md mx-auto mb-6">
          {description}
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={handleCta}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-5 py-2.5 bg-terracotta text-[#FAF6F0] font-body font-semibold text-sm rounded-sharp shadow-sm hover:bg-terracotta-dark transition-colors focus:outline-none focus:ring-2 focus:ring-terracotta focus:ring-offset-2 focus:ring-offset-paper-card"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            <span>{ctaLabel}</span>
          </button>
          {onSecondaryCta && secondaryLabel && (
            <button
              type="button"
              onClick={onSecondaryCta}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-paper-base hover:bg-paper-linen border border-sepia-border text-ink-charcoal font-body text-sm font-medium rounded-sharp transition-colors focus:outline-none focus:ring-2 focus:ring-terracotta focus:ring-offset-2 focus:ring-offset-paper-card"
            >
              <span>{secondaryLabel}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}