import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

/**
 * ProtectedRoute.jsx — guard de rutas privadas (US-11, escenario 3).
 * Sin sesión redirige a /login recordando la ruta pedida, sin renderizar
 * nada de la página (no se muestran datos privados).
 */
export default function ProtectedRoute() {
  const { status } = useAuth();
  const location = useLocation();

  if (status === "checking") return <SessionCheck />;
  if (status !== "authenticated") {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  }
  return <Outlet />;
}

/**
 * PublicOnlyRoute — /login y /registro: si ya hay sesión, se va directo a /hoy.
 */
export function PublicOnlyRoute() {
  const { status } = useAuth();
  if (status === "checking") return <SessionCheck />;
  if (status === "authenticated") return <Navigate to="/hoy" replace />;
  return <Outlet />;
}

function SessionCheck() {
  return (
    <div role="status" className="min-h-screen flex items-center justify-center bg-paper-base dot-grid-pattern font-body">
      <div className="flex items-center gap-2.5 text-sm text-ink-muted">
        <span className="material-symbols-outlined text-[20px] text-terracotta animate-spin">progress_activity</span>
        Verificando tu sesión…
      </div>
    </div>
  );
}
