import { Link } from "react-router-dom";

/**
 * Breadcrumb — botón "volver" + migas de pan.
 * `items` = [{ label, to? }]; el último elemento es la página actual.
 */
export function Breadcrumb({ backTo, items }) {
  return (
    <div className="flex items-center gap-2 text-xs font-body text-ink-muted">
      {backTo && (
        <Link
          to={backTo}
          aria-label="Volver"
          className="inline-flex items-center justify-center w-7 h-7 rounded-sharp border border-sepia-border bg-paper-card hover:bg-paper-linen text-ink-muted hover:text-ink-charcoal transition-colors mr-1"
        >
          <span className="material-symbols-outlined text-[16px]">arrow_back</span>
        </Link>
      )}
      <nav aria-label="Ruta de navegación" className="flex items-center flex-wrap gap-1.5">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <span key={`${item.label}-${index}`} className="flex items-center gap-1.5">
              {index > 0 && <span className="text-sepia-dark">/</span>}
              {isLast || !item.to ? (
                <span className={isLast ? "text-ink-charcoal font-semibold" : undefined} aria-current={isLast ? "page" : undefined}>
                  {item.label}
                </span>
              ) : (
                <Link to={item.to} className="hover:text-ink-charcoal transition-colors">
                  {item.label}
                </Link>
              )}
            </span>
          );
        })}
      </nav>
    </div>
  );
}

/**
 * PageHeader.jsx
 * ---------------------------------------------------------------------------
 * Cabecera estándar de página: migas/eyebrow → título (con palabra de acento)
 * → descripción, y un bloque opcional a la derecha (`aside`). Todas las
 * páginas la usan para que tamaño de título, espaciado y línea inferior sean
 * iguales.
 */
export default function PageHeader({ breadcrumb, eyebrow, title, accent, description, aside }) {
  return (
    <section className="mb-6">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-5 border-b border-sepia-border">
        <div className="space-y-1.5 max-w-3xl">
          {/* Primera línea de alto fijo (migas o eyebrow) para que el título
              quede a la misma distancia del Header en todas las páginas. */}
          <div className="min-h-7 flex items-center mb-3">
            {breadcrumb ?? (eyebrow && <p className="font-body text-xs md:text-sm font-medium text-ink-muted">{eyebrow}</p>)}
          </div>
          {breadcrumb && eyebrow && <p className="font-body text-xs md:text-sm font-medium text-ink-muted">{eyebrow}</p>}
          <h1 className="font-heading text-4xl sm:text-5xl lg:text-[50px] font-semibold tracking-tight text-ink-charcoal leading-[1.08]">
            {title}
            {accent && (
              <>
                {" "}
                <span className="italic font-normal text-terracotta">{accent}</span>
              </>
            )}
          </h1>
          {description && <p className="font-body text-xs md:text-sm text-ink-muted pt-0.5">{description}</p>}
        </div>
        {aside && <div className="shrink-0 lg:self-end">{aside}</div>}
      </div>
    </section>
  );
}
