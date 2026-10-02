import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { register } from "../services/api";
import AuthField, { AuthBanner } from "../components/auth/AuthField";

const MIN_PASSWORD_LENGTH = 8;

/** Mismas reglas que el validador de usuario de Django: máx. 150, letras, números y @ . + - _ */
const MAX_USERNAME_LENGTH = 150;
const USERNAME_PATTERN = /^[\p{L}\p{N}_.@+-]+$/u;
const INVALID_USERNAME_ES = "Usa solo letras, números y los caracteres @ . + - _ (sin espacios).";

/**
 * Django responde en inglés con los validadores del modelo User (usuario
 * duplicado exacto, caracteres no permitidos, longitud), que corren antes del
 * validador en español del backend. Reportado al backend; mientras tanto se
 * traduce aquí.
 */
const BACKEND_MESSAGE_ES = {
  "A user with that username already exists.": "Ese usuario ya está en uso.",
  "Enter a valid username. This value may contain only letters, numbers, and @/./+/-/_ characters.": INVALID_USERNAME_ES,
  [`Ensure this field has no more than ${MAX_USERNAME_LENGTH} characters.`]: `Usa como máximo ${MAX_USERNAME_LENGTH} caracteres.`,
};
const toSpanish = (message) => BACKEND_MESSAGE_ES[message] ?? message;

/**
 * RegistroPage.jsx — ruta "/registro" (diseño Stitch "Crear cuenta").
 *
 * POST /auth/register exige username y email por separado, así que el
 * formulario agrega "Nombre de usuario" al diseño original. El backend NO
 * inicia sesión al registrar: tras el éxito se redirige a /login con el
 * correo precargado.
 *
 * Estados: vacío (formulario), error por campo (validación local y del
 * backend: usuario/correo ya registrados, contraseña débil), error de
 * conexión con reintento, y éxito (aviso en /login).
 */
export default function RegistroPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", email: "", password: "", confirm: "" });
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState(null); // { type: 'network' | 'other', message? }
  const [isSubmitting, setIsSubmitting] = useState(false);

  const usernameRef = useRef(null);
  const emailRef = useRef(null);
  const passwordRef = useRef(null);
  const confirmRef = useRef(null);

  useEffect(() => {
    usernameRef.current?.focus();
  }, []);

  function handleChange(field) {
    return (e) => {
      const value = e.target.value;
      setForm((prev) => ({ ...prev, [field]: value }));
      setFieldErrors((prev) => {
        if (!prev[field]) return prev;
        const next = { ...prev };
        delete next[field];
        return next;
      });
    };
  }

  function validate() {
    const errors = {};
    const username = form.username.trim();
    if (!username) errors.username = "Elige un nombre de usuario.";
    else if (username.length > MAX_USERNAME_LENGTH) errors.username = `Usa como máximo ${MAX_USERNAME_LENGTH} caracteres.`;
    else if (!USERNAME_PATTERN.test(username)) errors.username = INVALID_USERNAME_ES;
    if (!form.email.trim()) errors.email = "Ingresa tu correo electrónico.";
    else if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) errors.email = "Revisa el formato del correo.";
    if (!form.password) errors.password = "Crea una contraseña.";
    else if (form.password.length < MIN_PASSWORD_LENGTH)
      errors.password = `Usa al menos ${MIN_PASSWORD_LENGTH} caracteres.`;
    if (!form.confirm) errors.confirm = "Repite la contraseña.";
    else if (form.password && form.confirm !== form.password) errors.confirm = "Las contraseñas no coinciden.";
    return errors;
  }

  function focusFirstError(errors) {
    const fieldRefs = { username: usernameRef, email: emailRef, password: passwordRef, confirm: confirmRef };
    const first = ["username", "email", "password", "confirm"].find((f) => errors[f]);
    if (first) fieldRefs[first].current?.focus();
  }

  async function handleSubmit(e) {
    e?.preventDefault();
    setFormError(null);
    const errors = validate();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      focusFirstError(errors);
      return;
    }

    setIsSubmitting(true);
    try {
      const user = await register(form);
      navigate("/login", { replace: true, state: { registeredEmail: user?.email ?? form.email.trim() } });
    } catch (err) {
      setIsSubmitting(false);
      if (err.status === 400 && Object.keys(err.details ?? {}).length > 0) {
        const backendErrors = {};
        for (const [field, messages] of Object.entries(err.details)) {
          if (["username", "email", "password"].includes(field)) backendErrors[field] = messages.map(toSpanish).join(" ");
        }
        setFieldErrors(backendErrors);
        focusFirstError(backendErrors);
        if (Object.keys(backendErrors).length === 0) setFormError({ type: "other", message: err.message });
      } else if (err.code === "network_error" || !err.status || err.status >= 500) {
        setFormError({ type: "network" });
      } else {
        setFormError({ type: "other", message: err.message });
      }
    }
  }

  return (
    <div className="bg-paper-card border border-sepia-border rounded-asym-book p-6 sm:p-8 warm-card-shadow">
      <div className="space-y-1.5 mb-6 text-center">
        <h1 className="font-heading text-3xl sm:text-[32px] font-bold text-ink-charcoal tracking-tight">
          Crear cuenta en Convoka
        </h1>
        <p className="text-xs sm:text-sm text-ink-muted leading-relaxed">
          Comienza a organizar tus eventos y gestiones operativas.
        </p>
      </div>

      {formError?.type === "network" && (
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
          No pudimos comunicarnos con el servidor. Tus datos siguen en el formulario.
        </AuthBanner>
      )}
      {formError?.type === "other" && <AuthBanner title="No pudimos crear tu cuenta">{formError.message}</AuthBanner>}

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <AuthField
          id="register-username"
          label="Nombre de usuario"
          icon="person"
          autoComplete="username"
          placeholder="sofia.arismendi"
          value={form.username}
          onChange={handleChange("username")}
          error={fieldErrors.username}
          inputRef={usernameRef}
        />
        <AuthField
          id="register-email"
          label="Correo electrónico"
          icon="mail"
          type="email"
          autoComplete="email"
          placeholder="ejemplo@convoka.com"
          value={form.email}
          onChange={handleChange("email")}
          error={fieldErrors.email}
          inputRef={emailRef}
        />
        <AuthField
          id="register-password"
          label="Contraseña"
          icon="lock"
          type="password"
          autoComplete="new-password"
          placeholder="••••••••••••"
          hint={`Mínimo ${MIN_PASSWORD_LENGTH} caracteres.`}
          value={form.password}
          onChange={handleChange("password")}
          error={fieldErrors.password}
          inputRef={passwordRef}
        />
        <AuthField
          id="register-confirm"
          label="Repetir contraseña"
          icon="lock"
          type="password"
          autoComplete="new-password"
          placeholder="••••••••••••"
          value={form.confirm}
          onChange={handleChange("confirm")}
          error={fieldErrors.confirm}
          inputRef={confirmRef}
        />

        <div className="pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-11 bg-terracotta text-[#FAF6F0] font-heading font-semibold text-sm tracking-wide rounded-sharp border border-terracotta-dark shadow-sm hover:bg-terracotta-dark disabled:opacity-60 transition-all flex items-center justify-center gap-2 active:scale-[0.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-terracotta focus-visible:ring-offset-2"
          >
            <span>{isSubmitting ? "Creando cuenta…" : "Crear cuenta"}</span>
            <span className={`material-symbols-outlined text-[18px] ${isSubmitting ? "animate-spin" : ""}`} aria-hidden="true">
              {isSubmitting ? "progress_activity" : "arrow_forward"}
            </span>
          </button>
        </div>
      </form>

      <div className="pt-4 mt-4 border-t border-sepia-border/50 text-center">
        <p className="text-xs text-ink-muted">
          ¿Ya tienes una cuenta?{" "}
          <Link to="/login" className="font-medium text-terracotta hover:text-terracotta-dark underline underline-offset-2 transition-colors">
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
