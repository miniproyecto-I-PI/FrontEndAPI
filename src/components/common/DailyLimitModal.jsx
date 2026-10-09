import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useDailyLimit } from "../../hooks/useDailyLimit";
import Toast from "./Toast";

/**
 * DailyLimitModal.jsx
 * ---------------------------------------------------------------------------
 * US-12 — "Configurar límite diario de horas de gestión".
 * Renderizado vía React Portal para garantizar centrado perfecto en viewport
 * y evitar que backdrop-filter o position:fixed de Header lo desplace.
 *
 * Validación estándar con:
 * - noValidate en form (evita tooltips del navegador en inglés)
 * - Borde rojo e indicación textual en campo
 * - Toast / letrero de error en la esquina inferior izquierda
 */
export default function DailyLimitModal({ onClose, onSuccess }) {
  const {
    hours,
    allowOverload,
    allowSubtasksAfterEvent,
    allowOverdueSubtasks,
    isLoaded,
    update,
    MIN_HOURS,
    MAX_HOURS,
  } = useDailyLimit();
  const [inputValue, setInputValue] = useState(null);
  const [allowOverloadState, setAllowOverloadState] = useState(null);
  const [allowAfterEventState, setAllowAfterEventState] = useState(null);
  const [allowOverdueState, setAllowOverdueState] = useState(null);
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [localToast, setLocalToast] = useState(null);

  const inputRef = useRef(null);
  const displayedValue = inputValue ?? (isLoaded ? String(hours) : "6");
  const currentAllowOverload = allowOverloadState ?? (isLoaded ? allowOverload : false);
  const currentAllowAfterEvent = allowAfterEventState ?? (isLoaded ? allowSubtasksAfterEvent : false);
  const currentAllowOverdue = allowOverdueState ?? (isLoaded ? allowOverdueSubtasks : false);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, [isLoaded]);

  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  async function handleSave(e) {
    e?.preventDefault();
    const numericValue = Number(displayedValue);
    if (!Number.isFinite(numericValue) || numericValue < MIN_HOURS || numericValue > MAX_HOURS) {
      const msg = `El límite debe estar entre ${MIN_HOURS} y ${MAX_HOURS} horas`;
      setError(msg);
      setLocalToast({ message: msg, intent: "error" });
      inputRef.current?.focus();
      return;
    }

    setIsSaving(true);
    setError("");
    setLocalToast(null);
    try {
      await update({
        dailyLimitHours: numericValue,
        allowOverload: currentAllowOverload,
        allowSubtasksAfterEvent: currentAllowAfterEvent,
        allowOverdueSubtasks: currentAllowOverdue,
      });
      onSuccess?.("Preferencias actualizadas");
      onClose();
    } catch (err) {
      const msg = err.message || `El límite debe estar entre ${MIN_HOURS} y ${MAX_HOURS} horas`;
      setError(msg);
      setLocalToast({ message: msg, intent: "error" });
    } finally {
      setIsSaving(false);
    }
  }

  const modalContent = (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="daily-limit-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-charcoal/40 backdrop-blur-sm focus:outline-none"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="relative w-full max-w-md bg-paper-card border border-sepia-border rounded-sharp p-6 shadow-xl warm-card-shadow">
        <h3 id="daily-limit-title" className="font-heading text-xl font-bold text-ink-charcoal">
          Configuración de jornada
        </h3>
        <p id="daily-limit-desc" className="font-body text-xs text-ink-muted mt-1 leading-relaxed">
          Define tus reglas de dedicación y tolerancia a sobrecarga para la programación y reprogramación de gestiones.
        </p>

        <form onSubmit={handleSave} noValidate className="mt-4 space-y-4">
          <label className="block">
            <div className="flex items-center justify-between">
              <span className="font-body text-xs font-semibold text-ink-charcoal">
                Límite diario de horas
              </span>
              <span className="font-stamp text-[11px] text-ink-muted">
                {MIN_HOURS}–{MAX_HOURS} horas
              </span>
            </div>
            <input
              ref={inputRef}
              type="number"
              min={MIN_HOURS}
              max={MAX_HOURS}
              step="0.5"
              value={displayedValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                if (error) setError("");
                if (localToast) setLocalToast(null);
              }}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? "daily-limit-error" : "daily-limit-desc"}
              className={`mt-1.5 w-full border rounded-sharp px-3 py-2 font-body text-sm text-ink-charcoal bg-paper-card focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-paper-card ${
                error
                  ? "border-crimson-urgent ring-1 ring-crimson-urgent focus:border-crimson-urgent focus:ring-crimson-urgent text-crimson-urgent"
                  : "border-sepia-border focus:border-terracotta focus:ring-terracotta"
              }`}
            />
          </label>
          {error && (
            <p id="daily-limit-error" role="alert" className="text-crimson-urgent text-xs font-body mt-1">
              {error}
            </p>
          )}

          {/* Opción US-12 / Sprint 3: Permitir cargas de trabajo por encima del límite diario */}
          <div className="pt-3.5 border-t border-sepia-border/70">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <span className="font-body text-xs font-semibold text-ink-charcoal block">
                  Permitir sobrecarga de horas diaria
                </span>
                <p className="font-body text-[11px] text-ink-muted leading-relaxed">
                  Si se desactiva, deberás resolver el conflicto (mover de fecha o reducir horas) antes de poder guardar.
                </p>
              </div>

              {/* Selector Sí / No */}
              <div className="inline-flex rounded-sharp border border-sepia-border bg-paper-linen p-0.5 shrink-0" role="group" aria-label="Permitir sobrecarga">
                <button
                  type="button"
                  onClick={() => setAllowOverloadState(false)}
                  className={`px-3 py-1 text-xs font-body font-semibold rounded-sharp transition-colors ${
                    !currentAllowOverload
                      ? "bg-terracotta text-[#FAF6F0] shadow-xs"
                      : "text-ink-muted hover:text-ink-charcoal"
                  }`}
                >
                  No
                </button>
                <button
                  type="button"
                  onClick={() => setAllowOverloadState(true)}
                  className={`px-3 py-1 text-xs font-body font-semibold rounded-sharp transition-colors ${
                    currentAllowOverload
                      ? "bg-terracotta text-[#FAF6F0] shadow-xs"
                      : "text-ink-muted hover:text-ink-charcoal"
                  }`}
                >
                  Sí
                </button>
              </div>
            </div>
          </div>

          {/* Opción nueva: Permitir gestiones después de la fecha del evento */}
          <div className="pt-3.5 border-t border-sepia-border/70">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <span className="font-body text-xs font-semibold text-ink-charcoal block">
                  Permitir gestiones después de la fecha del evento
                </span>
                <p className="font-body text-[11px] text-ink-muted leading-relaxed">
                  Por defecto en <strong>No</strong>. Evita programar gestiones logísticas para fechas posteriores al evento.
                </p>
              </div>

              <div className="inline-flex rounded-sharp border border-sepia-border bg-paper-linen p-0.5 shrink-0" role="group" aria-label="Permitir gestiones después del evento">
                <button
                  type="button"
                  onClick={() => setAllowAfterEventState(false)}
                  className={`px-3 py-1 text-xs font-body font-semibold rounded-sharp transition-colors ${
                    !currentAllowAfterEvent
                      ? "bg-terracotta text-[#FAF6F0] shadow-xs"
                      : "text-ink-muted hover:text-ink-charcoal"
                  }`}
                >
                  No
                </button>
                <button
                  type="button"
                  onClick={() => setAllowAfterEventState(true)}
                  className={`px-3 py-1 text-xs font-body font-semibold rounded-sharp transition-colors ${
                    currentAllowAfterEvent
                      ? "bg-terracotta text-[#FAF6F0] shadow-xs"
                      : "text-ink-muted hover:text-ink-charcoal"
                  }`}
                >
                  Sí
                </button>
              </div>
            </div>
          </div>

          {/* Opción nueva: Permitir crear gestiones vencidas (para pruebas) */}
          <div className="pt-3.5 border-t border-sepia-border/70">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <span className="font-body text-xs font-semibold text-ink-charcoal block">
                  Permitir crear gestiones vencidas
                </span>
                <p className="font-body text-[11px] text-ink-muted leading-relaxed">
                  Habilita la asignación o reprogramación de gestiones en fechas pasadas para pruebas y simulaciones.
                </p>
              </div>

              <div className="inline-flex rounded-sharp border border-sepia-border bg-paper-linen p-0.5 shrink-0" role="group" aria-label="Permitir gestiones vencidas">
                <button
                  type="button"
                  onClick={() => setAllowOverdueState(false)}
                  className={`px-3 py-1 text-xs font-body font-semibold rounded-sharp transition-colors ${
                    !currentAllowOverdue
                      ? "bg-terracotta text-[#FAF6F0] shadow-xs"
                      : "text-ink-muted hover:text-ink-charcoal"
                  }`}
                >
                  No
                </button>
                <button
                  type="button"
                  onClick={() => setAllowOverdueState(true)}
                  className={`px-3 py-1 text-xs font-body font-semibold rounded-sharp transition-colors ${
                    currentAllowOverdue
                      ? "bg-terracotta text-[#FAF6F0] shadow-xs"
                      : "text-ink-muted hover:text-ink-charcoal"
                  }`}
                >
                  Sí
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-sepia-border/60">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-sharp bg-paper-base hover:bg-paper-linen border border-sepia-border text-ink-charcoal font-body text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-terracotta"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 rounded-sharp bg-terracotta hover:bg-terracotta-dark disabled:opacity-60 text-[#FAF6F0] font-body text-xs font-semibold tracking-wide border border-terracotta-dark shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-terracotta disabled:cursor-not-allowed"
            >
              {isSaving ? "Guardando…" : "Guardar"}
            </button>
          </div>
        </form>
      </div>

      {localToast && (
        <Toast toast={localToast} onClose={() => setLocalToast(null)} />
      )}
    </div>
  );

  return typeof document !== "undefined" ? createPortal(modalContent, document.body) : modalContent;
}
