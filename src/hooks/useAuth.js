import { useContext } from "react";
import { AuthContext } from "../context/authContext";

/** Sesión actual: { user, status, endReason, login, logout }. */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>.");
  return ctx;
}
