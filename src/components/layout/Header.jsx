import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import DailyLimitModal from "../common/DailyLimitModal";
import UserMenu from "./UserMenu";
import logo from "../../assets/logo.png";

/**
 * Header.jsx
 * ---------------------------------------------------------------------------
 * Barra superior única para todas las rutas autenticadas (diseño Stitch,
 * Sprint 2). Ninguna página arma su propio header.
 *
 *  1. El ícono de configuración abre el modal "límite diario de horas"
 *     (US-12). Por Arquitectura de Información (C5) es un modal global.
 *  2. `onSearchChange`/`searchValue` son opcionales: el buscador solo se
 *     muestra en las páginas que lo conectan (/hoy y /eventos).
 *  3. "Mis Eventos" queda activo en /eventos, /evento/:id y /crear.
 */
export default function Header({ searchValue, onSearchChange }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [isLimitModalOpen, setIsLimitModalOpen] = useState(false);

  const isEventsSection =
    pathname.startsWith("/eventos") || pathname.startsWith("/evento/") || pathname === "/crear";

  const navLinkClasses = (isActive) =>
    [
      "px-3 py-1.5 font-body text-xs tracking-wide rounded-sharp transition-colors border",
      isActive
        ? "bg-paper-base text-terracotta-dark border-sepia-border shadow-sm font-bold"
        : "border-transparent text-ink-muted hover:text-ink-charcoal hover:bg-paper-linen/60",
    ].join(" ");

  return (
    <header className="fixed top-0 inset-x-0 z-40 bg-[#FAF6F0]/95 backdrop-blur-md border-b border-sepia-border">
      <div className="h-16 max-w-[1440px] mx-auto px-4 md:px-8 lg:px-12 flex items-center justify-between gap-4">
        {/* Marca + navegación principal */}
        <div className="flex items-center gap-4 lg:gap-6 shrink-0">
          <Link to="/hoy" className="flex items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-terracotta rounded-sharp" aria-label="Convoka — ir a Hoy">
            <img src={logo} alt="Convoka Events" className="h-8 w-auto" />
          </Link>
          <div className="h-5 w-px bg-sepia-border hidden md:block" />
          <nav className="hidden md:flex items-center gap-1" aria-label="Navegación principal">
            <NavLink to="/hoy" className={({ isActive }) => navLinkClasses(isActive)}>
              Hoy
            </NavLink>
            <NavLink to="/eventos" className={() => navLinkClasses(isEventsSection)}>
              Mis Eventos
            </NavLink>
          </nav>
        </div>

        {/* Buscador — solo en páginas que lo conectan */}
        {onSearchChange && (
          <div className="hidden md:flex items-center gap-2 flex-1 max-w-xl mx-2 lg:mx-4">
            <div className="relative flex-1">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[17px] text-ink-muted">
                search
              </span>
              <input
                type="search"
                aria-label="Buscar gestión, proveedor o evento"
                value={searchValue ?? ""}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Buscar gestión, proveedor o evento..."
                className="w-full h-8 pl-9 pr-3 bg-paper-base border border-sepia-border rounded-sharp font-body text-xs text-ink-charcoal placeholder:text-ink-subtle placeholder:italic focus:outline-none focus:border-terracotta"
              />
            </div>
          </div>
        )}

        {/* Acciones */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => navigate("/crear")}
            type="button"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-terracotta text-[#FAF6F0] font-body font-semibold text-xs md:text-sm tracking-wide rounded-sharp border border-terracotta-dark shadow-sm hover:bg-terracotta-dark transition-colors active:translate-y-0.5"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            <span>Crear evento</span>
          </button>

          <button
            onClick={() => setIsLimitModalOpen(true)}
            aria-label="Configurar límite diario de horas"
            title="Límite diario de horas"
            type="button"
            className="w-8 h-8 rounded-sharp border border-sepia-border bg-paper-card flex items-center justify-center text-ink-muted hover:text-ink-charcoal hover:border-sepia-dark transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">settings</span>
          </button>

          <UserMenu />
        </div>
      </div>

      {isLimitModalOpen && <DailyLimitModal onClose={() => setIsLimitModalOpen(false)} />}
    </header>
  );
}
