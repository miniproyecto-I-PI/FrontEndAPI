import { NavLink, useNavigate } from "react-router-dom";
import { useState } from "react";
import DailyLimitModal from "../common/DailyLimitModal";

/**
 * Header.jsx
 * ---------------------------------------------------------------------------
 * Persistent top bar, present on every main route. Ported from the UX HTML.
 *
 * Dos notas de integración con backend:
 *  1. El ícono de configuración abre el modal "límite diario de horas"
 *     (US-12). Por Arquitectura de Información (C5), esto NO es una ruta:
 *     es un modal global alcanzable desde aquí.
 *  2. `onSearchChange`/`searchValue` son opcionales. Solo /hoy los conecta.
 *
 */
export default function Header({ searchValue, onSearchChange }) {
  const navigate = useNavigate();
  const [isLimitModalOpen, setIsLimitModalOpen] = useState(false);

  const navLinkClasses = ({ isActive }) =>
    [
      "px-3 py-1.5 font-serif text-xs rounded-sharp transition-colors",
      isActive
        ? "bg-paper-base text-terracotta-dark border border-sepia-border shadow-sm font-bold"
        : "text-ink-muted hover:text-ink-charcoal hover:bg-paper-linen/60",
    ].join(" ");

  return (
    <header className="fixed top-0 inset-x-0 z-40 bg-[#FAF6F0]/95 backdrop-blur-md border-b border-sepia-border">
      <div className="h-16 max-w-[1440px] mx-auto px-4 md:px-8 lg:px-12 flex items-center justify-between gap-4">
        {/* Brand + primary nav */}
        <div className="flex items-center gap-4 lg:gap-6 shrink-0">
          <button
            onClick={() => navigate("/hoy")}
            className="flex items-center gap-2 focus:outline-none"
            aria-label="Ir a Convoka"
          >
            <span className="font-serif font-bold text-lg text-terracotta-dark">Convoka</span>
          </button>
          <div className="h-5 w-px bg-sepia-border hidden md:block" />
          <nav className="hidden md:flex items-center gap-1">
            <NavLink to="/hoy" className={navLinkClasses}>
              Hoy
            </NavLink>
            <NavLink to="/eventos" className={navLinkClasses}>
              Mis Eventos
            </NavLink>
          </nav>
        </div>

        {/* Search — functional only where a page wires it up (currently /hoy) */}
        <div className="hidden md:flex items-center gap-2 flex-1 max-w-xl mx-2 lg:mx-4">
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[17px] text-ink-muted">
              search
            </span>
            <input
              type="text"
              value={searchValue ?? ""}
              onChange={(e) => onSearchChange?.(e.target.value)}
              placeholder="Buscar gestión, proveedor o evento..."
              className="w-full h-8 pl-9 pr-3 bg-paper-base border border-sepia-border rounded-sharp font-body text-xs text-ink-charcoal placeholder:text-ink-subtle placeholder:italic focus:outline-none focus:border-terracotta"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => navigate("/crear")}
            type="button"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-terracotta text-[#FAF6F0] font-serif font-semibold text-xs md:text-sm tracking-wide rounded-sharp border border-terracotta-dark shadow-sm hover:bg-terracotta-dark transition-colors active:translate-y-0.5"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            <span>Crear evento</span>
          </button>

          <button
            onClick={() => setIsLimitModalOpen(true)}
            aria-label="Configurar límite diario de horas"
            title="Límite diario de horas (US-12)"
            type="button"
            className="w-8 h-8 rounded-sharp border border-sepia-border bg-paper-card flex items-center justify-center text-ink-muted hover:text-ink-charcoal hover:border-sepia-dark transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">settings</span>
          </button>

          <div className="relative flex items-center justify-center">
            <button
              aria-label="Notificaciones"
              title="Notificaciones (próximamente)"
              type="button"
              className="w-8 h-8 rounded-sharp border border-sepia-border bg-paper-card flex items-center justify-center text-ink-muted hover:text-ink-charcoal hover:border-sepia-dark transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">notifications</span>
            </button>
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-crimson-urgent ring-2 ring-[#FAF6F0]" />
          </div>

          <div className="w-8 h-8 rounded-sharp border border-sepia-border bg-paper-card flex items-center justify-center font-serif text-terracotta font-bold text-xs shadow-inner">
            <span className="material-symbols-outlined text-[18px] text-terracotta">person</span>
          </div>
        </div>
      </div>

      {isLimitModalOpen && <DailyLimitModal onClose={() => setIsLimitModalOpen(false)} />}
    </header>
  );
}