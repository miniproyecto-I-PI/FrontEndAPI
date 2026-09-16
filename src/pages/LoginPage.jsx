import { useState } from "react";
import { login } from "../services/api";

/**
 * LoginPage.jsx — route "/login" (Arquitectura de Información C5, §3, ruta
 * adicional desde Sprint 2; US-11).
 *
 * Unlike the other stub pages, this one IS a working form — it's simple
 * enough to build now — but it submits to `login()` in services/api.js,
 * which currently just throws "not available yet" (see that file). Once
 * Supabase Auth / the DRF token endpoint exists, only `login()` needs to
 * change; this component already handles the loading/error states it will
 * need.
 *
 * Intentionally rendered WITHOUT the app's Header/nav (see App.jsx) — a
 * login screen shouldn't expose the main navigation before authentication.
 */
export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      await login({ email, password });
      // TODO(Sprint 2): on success, store the session and navigate to /hoy.
    } catch (err) {
      setError(err.message || "No pudimos iniciar sesión");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-paper-base font-body px-4">
      <div className="w-full max-w-sm bg-paper-card border border-sepia-border rounded-sharp p-8 warm-card-shadow">
        <h1 className="font-serif text-3xl font-bold text-ink-charcoal text-center mb-1">Convoka</h1>
        <p className="font-body text-xs text-ink-muted text-center mb-6">Inicia sesión para ver tus gestiones</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block">
            <span className="font-body text-xs font-medium text-ink-muted">Correo</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full border border-sepia-border rounded-sharp px-3 py-2 font-body text-sm focus:outline-none focus:border-terracotta"
              placeholder="tú@ejemplo.com"
            />
          </label>
          <label className="block">
            <span className="font-body text-xs font-medium text-ink-muted">Contraseña</span>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full border border-sepia-border rounded-sharp px-3 py-2 font-body text-sm focus:outline-none focus:border-terracotta"
              placeholder="••••••••"
            />
          </label>

          {error && (
            <p className="text-crimson-urgent text-xs font-body bg-crimson-paper border border-crimson-urgent/30 rounded-sharp px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full inline-flex items-center justify-center gap-1.5 px-5 py-2.5 bg-terracotta disabled:opacity-60 text-[#FAF6F0] font-body font-semibold text-sm rounded-sharp shadow-sm hover:bg-terracotta-dark transition-colors"
          >
            {isSubmitting ? "Ingresando…" : "Iniciar sesión"}
          </button>
        </form>
      </div>
    </div>
  );
}
