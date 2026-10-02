import { createContext } from "react";

/**
 * Contexto de sesión (US-11). El valor lo entrega <AuthProvider> y se lee
 * con el hook `useAuth()` (hooks/useAuth.js).
 */
export const AuthContext = createContext(null);
