import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

/**
 * UserMenu.jsx — indicador del organizador autenticado + "Cerrar sesión"
 * (US-11, estado de éxito). Se cierra con Escape o al hacer clic fuera.
 */
export default function UserMenu() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const containerRef = useRef(null);
  const buttonRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    function handlePointer(e) {
      if (!containerRef.current?.contains(e.target)) setOpen(false);
    }
    function handleKey(e) {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    }
    document.addEventListener("mousedown", handlePointer);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handlePointer);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  async function handleLogout() {
    setIsLoggingOut(true);
    await logout();
    navigate("/login", { replace: true });
  }

  const username = user?.username ?? "";

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Cuenta de ${username}`}
        className="h-8 pl-1.5 pr-2 rounded-sharp border border-sepia-border bg-paper-card flex items-center gap-1.5 text-ink-muted hover:text-ink-charcoal hover:border-sepia-dark transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-terracotta"
      >
        <span className="material-symbols-outlined text-[18px] text-terracotta" aria-hidden="true">person</span>
        <span className="hidden lg:inline max-w-[120px] truncate font-body text-xs font-semibold text-ink-charcoal">{username}</span>
        <span className="material-symbols-outlined text-[16px]" aria-hidden="true">{open ? "expand_less" : "expand_more"}</span>
      </button>

      {open && (
        <div role="menu" className="absolute right-0 mt-2 w-64 bg-paper-card border border-sepia-border rounded-sharp warm-card-shadow py-2 z-50">
          <div className="px-4 py-2 border-b border-sepia-border/70">
            <p className="font-stamp text-[10px] uppercase tracking-wider text-ink-muted">Sesión iniciada como</p>
            <p className="font-heading text-sm font-semibold text-ink-charcoal truncate mt-0.5">{username}</p>
            {user?.email && <p className="font-body text-xs text-ink-muted truncate">{user.email}</p>}
          </div>
          <button
            type="button"
            role="menuitem"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="w-full mt-1 px-4 py-2 flex items-center gap-2 font-body text-sm text-ink-charcoal hover:bg-paper-linen hover:text-crimson-urgent disabled:opacity-60 transition-colors focus:outline-none focus-visible:bg-paper-linen"
          >
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">logout</span>
            {isLoggingOut ? "Cerrando sesión…" : "Cerrar sesión"}
          </button>
        </div>
      )}
    </div>
  );
}
