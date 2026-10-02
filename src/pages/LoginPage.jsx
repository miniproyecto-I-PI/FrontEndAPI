import { useEffect, useRef, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import AuthField, { AuthBanner } from "../components/auth/AuthField";

/** Tiempo que se muestra la confirmación antes de redirigir. */
const SUCCESS_REDIRECT_MS = 1400;

/**
 * LoginPage.jsx — ruta "/login" (US-11), diseño Stitch "Acceso a Convoka".
 *
 * Estados:
 *  - Vacío: formulario con labels claros y foco en el correo.
 *  - Error: "Credenciales inválidas" con el mismo mensaje exista o no el
 *    usuario (no revela información), o "Error de conexión" + Reintentar.
 *  - Éxito: confirmación breve y redirección a /hoy (o a la ruta protegida
 *    que se intentó abrir sin sesión).
 *  - Avisos: sesión expirada, sesión cerrada o cuenta recién creada.
 */
export default function LoginPage() {
  const { status, endReason, login } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const redirectTo = location.state?.from || "/hoy";
  const registeredEmail = location.state?.registeredEmail;

  const [email, setEmail] = useState(registeredEmail ?? "");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState(null); // 'credentials' | 'network' | 'other'
  const [otherMessage, setOtherMessage] = useState("");
  const [phase, setPhase] = useState("idle"); // 'idle' | 'submitting' | 'success'
  const [welcomeName, setWelcomeName] = useState("");

  const emailRef = useRef(null);
  const passwordRef = useRef(null);

  useEffect(() => {
    (registeredEmail ? passwordRef : emailRef).current?.focus();
  }, [registeredEmail]);

  useEffect(() => {
    if (phase !== "success") return;
    const timer = setTimeout(() => navigate(redirectTo, { replace: true }), SUCCESS_REDIRECT_MS);
    return () => clearTimeout(timer);
  }, [phase, navigate, redirectTo]);

  // Con sesión activa no tiene sentido ver el login (salvo durante la confirmación).
  if (status === "authenticated" && phase === "idle") {
    return <Navigate to={redirectTo} replace />;
  }

  function validate() {
    const errors = {};
    if (!email.trim()) errors.email = "Ingresa tu correo electrónico.";
    else if (!/^\S+@\S+\.\S+$/.test(email.trim())) errors.email = "Revisa el formato del correo.";
    if (!password) errors.password = "Ingresa tu contraseña.";
    return errors;
  }

  async function handleSubmit(e) {
    e?.preventDefault();
    setFormError(null);
    const errors = validate();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      (errors.email ? emailRef : passwordRef).current?.focus();
      return;
    }

    setPhase("submitting");
    try {
      const user = await login({ identifier: email, password, remember });
      setWelcomeName(user?.username ?? "");
      setPhase("success");
    } catch (err) {
      setPhase("idle");
      if (err.status === 401 || err.code === "invalid_credentials") {
        setFormError("credentials");
        setPassword("");
        passwordRef.current?.focus();
      } else if (err.code === "network_error" || !err.status || err.status >= 500) {
        setFormError("network");
      } else {
        setFormError("other");
        setOtherMessage(err.message);
      }
    }
  }

  const isSubmitting = phase === "submitting";
  const notice = !formError && getNotice({ registeredEmail, endReason });

  return (
    <>
      <div className="bg-paper-card border border-sepia-border rounded-asym-book p-6 sm:p-8 warm-card-shadow">
        <div className="space-y-1.5 mb-6 text-center">
          <h1 className="font-heading text-3xl sm:text-[32px] font-bold text-ink-charcoal tracking-tight">
            Acceso a Convoka
          </h1>
          <p className="text-xs sm:text-sm text-ink-muted leading-relaxed">
            Ingresa a tu cuenta para gestionar tus eventos y agenda.
          </p>
        </div>

        {formError === "credentials" && (
          <AuthBanner title="Credenciales inválidas">
            El correo o la contraseña no coinciden con nuestros registros. Verifica los datos e inténtalo nuevamente.
          </AuthBanner>
        )}
        {formError === "network" && (
          <AuthBanner
            title="Error de conexión"
            action={
              <button
                type="button"
                onClick={handleSubmit}
                className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-terracotta hover:text-terracotta-dark underline underline-offset-2"
              >
                <span className="material-symbols-outlined text-[15px]" aria-hidden="true">refresh</span>
                Reintentar
              </button>
            }
          >
            No pudimos comunicarnos con el servidor. Revisa tu conexión e inténtalo de nuevo.
          </AuthBanner>
        )}
        {formError === "other" && <AuthBanner title="No pudimos iniciar sesión">{otherMessage}</AuthBanner>}
        {notice && (
          <AuthBanner tone={notice.tone} title={notice.title}>
            {notice.text}
          </AuthBanner>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <AuthField
            id="login-email"
            label="Correo electrónico"
            icon="mail"
            type="email"
            autoComplete="email"
            placeholder="ejemplo@convoka.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={fieldErrors.email}
            inputRef={emailRef}
          />
          <AuthField
            id="login-password"
            label="Contraseña"
            icon="lock"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={fieldErrors.password}
            inputRef={passwordRef}
          />

          <label className="flex items-center gap-2 pt-1 cursor-pointer select-none w-fit">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="w-4 h-4 rounded-sharp border-sepia-border accent-terracotta focus:ring-terracotta"
            />
            <span className="text-xs text-ink-muted">Mantener sesión activa</span>
          </label>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-11 bg-terracotta text-[#FAF6F0] font-heading font-semibold text-sm tracking-wide rounded-sharp border border-terracotta-dark shadow-sm hover:bg-terracotta-dark disabled:opacity-60 transition-all flex items-center justify-center gap-2 active:scale-[0.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-terracotta focus-visible:ring-offset-2"
            >
              <span className={`material-symbols-outlined text-[18px] ${isSubmitting ? "animate-spin" : ""}`} aria-hidden="true">
                {isSubmitting ? "progress_activity" : "login"}
              </span>
              <span>{isSubmitting ? "Verificando…" : "Iniciar sesión"}</span>
            </button>
          </div>
        </form>

        <div className="pt-4 mt-4 border-t border-sepia-border/50 text-center">
          <p className="text-xs text-ink-muted">
            ¿No tienes cuenta?{" "}
            <Link to="/registro" className="font-medium text-terracotta hover:text-terracotta-dark underline underline-offset-2 transition-colors">
              Regístrate
            </Link>
          </p>
        </div>
      </div>

      {phase === "success" && <LoginSuccess name={welcomeName} />}
    </>
  );
}

function getNotice({ registeredEmail, endReason }) {
  if (registeredEmail) {
    return { tone: "success", title: "Cuenta creada", text: "Ya puedes iniciar sesión con tu correo y contraseña." };
  }
  if (endReason === "expired") {
    return { tone: "info", title: "Tu sesión expiró", text: "Por seguridad, vuelve a iniciar sesión para continuar." };
  }
  if (endReason === "logout") {
    return { tone: "info", title: "Sesión cerrada", text: "Cerraste sesión correctamente." };
  }
  return null;
}

function LoginSuccess({ name }) {
  return (
    <div className="fixed inset-0 bg-ink-charcoal/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div role="status" aria-live="polite" className="bg-paper-card border border-sepia-border rounded-asym-book p-6 max-w-md w-full warm-card-shadow text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-sage-light text-sage-wax mx-auto flex items-center justify-center">
          <span className="material-symbols-outlined text-[28px]" aria-hidden="true">check_circle</span>
        </div>
        <div>
          <p className="font-stamp text-[10px] uppercase tracking-wider text-sage-wax font-bold">Autenticación exitosa</p>
          <h2 className="font-heading text-2xl font-bold text-ink-charcoal mt-1">
            ¡Hola de nuevo{name ? `, ${name}` : ""}!
          </h2>
          <p className="text-xs sm:text-sm text-ink-muted mt-2 leading-relaxed">
            Sesión iniciada correctamente. Redirigiendo a tu bitácora diaria…
          </p>
        </div>
      </div>
    </div>
  );
}
