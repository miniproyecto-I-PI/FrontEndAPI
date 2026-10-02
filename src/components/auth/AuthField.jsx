import { useState } from "react";

/**
 * AuthField.jsx — campo de los formularios de acceso (login/registro),
 * con label visible, ícono, mensaje de error asociado por aria-describedby
 * y, para contraseñas, botón para mostrar u ocultar el texto.
 */
export default function AuthField({ id, label, icon, type = "text", error, hint, inputRef, ...inputProps }) {
  const [revealed, setRevealed] = useState(false);
  const isPassword = type === "password";
  const describedBy = [error && `${id}-error`, hint && `${id}-hint`].filter(Boolean).join(" ") || undefined;

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block font-heading text-xs font-semibold uppercase tracking-wider text-ink-charcoal">
        {label} <span className="text-crimson-urgent" aria-hidden="true">*</span>
      </label>
      <div className="relative">
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-ink-muted pointer-events-none" aria-hidden="true">
          {icon}
        </span>
        <input
          id={id}
          ref={inputRef}
          type={isPassword && revealed ? "text" : type}
          required
          aria-required="true"
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          className={[
            "w-full h-10 pl-9 bg-paper-base border rounded-sharp text-sm text-ink-charcoal placeholder:text-ink-subtle placeholder:italic focus:outline-none focus:ring-1 transition-colors",
            isPassword ? "pr-10" : "pr-3",
            error
              ? "border-crimson-urgent bg-crimson-paper focus:border-crimson-urgent focus:ring-crimson-urgent"
              : "border-sepia-border focus:border-terracotta focus:ring-terracotta",
          ].join(" ")}
          {...inputProps}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setRevealed((v) => !v)}
            aria-label={revealed ? "Ocultar contraseña" : "Mostrar contraseña"}
            aria-pressed={revealed}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink-charcoal p-1 rounded-sharp focus:outline-none focus-visible:ring-2 focus-visible:ring-terracotta"
          >
            <span className="material-symbols-outlined text-[18px]">{revealed ? "visibility_off" : "visibility"}</span>
          </button>
        )}
      </div>
      {hint && !error && (
        <p id={`${id}-hint`} className="text-[11px] text-ink-muted">{hint}</p>
      )}
      {error && (
        <p id={`${id}-error`} className="text-xs text-crimson-urgent flex items-center gap-1 font-medium">
          <span className="material-symbols-outlined text-[14px]" aria-hidden="true">error</span>
          {error}
        </p>
      )}
    </div>
  );
}

/** Banner de estado de los formularios de acceso (error / info / éxito). */
export function AuthBanner({ tone = "error", title, children, action }) {
  const tones = {
    error: { box: "bg-crimson-paper border-crimson-urgent/30 border-l-crimson-urgent", icon: "error", iconColor: "text-crimson-urgent", title: "text-crimson-tag" },
    info: { box: "bg-paper-linen border-sepia-border border-l-terracotta", icon: "info", iconColor: "text-terracotta", title: "text-terracotta-dark" },
    success: { box: "bg-sage-light border-sage-wax/30 border-l-sage-wax", icon: "check_circle", iconColor: "text-sage-wax", title: "text-sage-wax" },
  }[tone];

  return (
    <div role={tone === "error" ? "alert" : "status"} className={`mb-5 border border-l-4 p-3.5 rounded-sharp ${tones.box}`}>
      <div className="flex items-start gap-2.5">
        <span className={`material-symbols-outlined text-[20px] shrink-0 ${tones.iconColor}`} aria-hidden="true">{tones.icon}</span>
        <div className="space-y-0.5 flex-1">
          <p className={`text-xs font-bold font-heading ${tones.title}`}>{title}</p>
          {children && <p className="text-[12px] text-ink-charcoal leading-snug">{children}</p>}
          {action}
        </div>
      </div>
    </div>
  );
}
