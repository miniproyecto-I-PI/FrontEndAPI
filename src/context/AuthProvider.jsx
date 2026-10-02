import { useCallback, useEffect, useMemo, useState } from "react";
import { AuthContext } from "./authContext";
import {
  UNAUTHORIZED_EVENT,
  clearStoredToken,
  getMe,
  getStoredToken,
  login as apiLogin,
  logout as apiLogout,
} from "../services/api";

/**
 * AuthProvider.jsx — estado de sesión de toda la app (US-11 / TS-04).
 *
 * status:
 *  - "checking"      hay token guardado y se está validando con GET /auth/me
 *  - "authenticated" sesión válida (`user` = { id, username, email })
 *  - "anonymous"     sin sesión
 *
 * `endReason` explica por qué terminó la última sesión ("expired" cuando el
 * backend respondió 401, "logout" al cerrar sesión) para que /login lo muestre.
 */
export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState(() => (getStoredToken() ? "checking" : "anonymous"));
  const [endReason, setEndReason] = useState(null);

  // Restaurar la sesión al cargar la app.
  useEffect(() => {
    if (status !== "checking") return;
    let cancelled = false;
    getMe()
      .then((me) => {
        if (cancelled) return;
        setUser(me);
        setStatus("authenticated");
      })
      .catch((err) => {
        if (cancelled) return;
        // Sin conexión no se descarta el token: se reintenta al recargar.
        if (err.status === 401) clearStoredToken();
        setUser(null);
        setStatus("anonymous");
      });
    return () => {
      cancelled = true;
    };
  }, [status]);

  // Cualquier 401 durante el uso de la app cierra la sesión local.
  useEffect(() => {
    if (status !== "authenticated") return;
    function handleUnauthorized() {
      setUser(null);
      setEndReason("expired");
      setStatus("anonymous");
    }
    window.addEventListener(UNAUTHORIZED_EVENT, handleUnauthorized);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, handleUnauthorized);
  }, [status]);

  const login = useCallback(async (credentials) => {
    const loggedUser = await apiLogin(credentials);
    setUser(loggedUser);
    setEndReason(null);
    setStatus("authenticated");
    return loggedUser;
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiLogout();
    } catch {
      // El token local ya se borró en apiLogout(); un fallo de red no bloquea la salida.
    }
    setUser(null);
    setEndReason("logout");
    setStatus("anonymous");
  }, []);

  const value = useMemo(
    () => ({ user, status, endReason, login, logout }),
    [user, status, endReason, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
