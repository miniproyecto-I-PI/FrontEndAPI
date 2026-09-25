import { useState } from "react";
import { useDailyLimit } from "../../hooks/useDailyLimit";

/**
 * DailyLimitModal.jsx
 * ---------------------------------------------------------------------------
 * US-12 — "Configurar límite diario de horas de gestión". Per the
 * Arquitectura de Información (C5, §3/§9), this is a global modal reachable
 * from the header icon, NOT a dedicated route — that decision is why this
 * component lives under components/common instead of pages/.
 *
 * Validation mirrors the acceptance criteria: the value must be within
 * [MIN_HOURS, MAX_HOURS]; on an invalid value we show an inline error and
 * keep the user's input instead of clearing the field.
 */
export default function DailyLimitModal({ onClose }) {
  const { hours, isLoaded, update, MIN_HOURS, MAX_HOURS } = useDailyLimit();
  const [inputValue, setInputValue] = useState(null);
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const displayedValue = inputValue ?? String(hours);

  async function handleSave() {
    const numericValue = Number(displayedValue);
    if (Number.isNaN(numericValue)) {
      setError("Ingresa un número válido");
      return;
    }
    setIsSaving(true);
    setError("");
    try {
      await update(numericValue);
      onClose();
    } catch (err) {
      setError(err.message || `El límite debe estar entre ${MIN_HOURS} y ${MAX_HOURS} horas`);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-charcoal/40 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="relative w-full max-w-sm bg-paper-card border border-sepia-border rounded-sharp p-6 shadow-xl warm-card-shadow">
        <h3 className="font-serif text-xl font-bold text-ink-charcoal">Límite diario de horas</h3>
        <p className="font-body text-xs text-ink-muted mt-2 leading-relaxed">
          Se usa para detectar sobrecarga cuando reprogramas gestiones (US-07/US-08). Valor
          actual: {isLoaded ? `${hours}h` : "cargando…"}.
        </p>

        <label className="block mt-4">
          <span className="font-body text-xs font-medium text-ink-muted">
            Nuevo límite ({MIN_HOURS}–{MAX_HOURS} horas)
          </span>
          <input
            type="number"
            min={MIN_HOURS}
            max={MAX_HOURS}
            step="0.5"
            value={displayedValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="mt-1 w-full border border-sepia-border rounded-sharp px-3 py-2 font-body text-sm text-ink-charcoal focus:outline-none focus:border-terracotta"
          />
        </label>
        {error && <p className="text-crimson-urgent text-xs font-body mt-2">{error}</p>}

        <div className="flex items-center justify-end gap-2.5 pt-6 mt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-sharp bg-paper-base hover:bg-paper-linen border border-sepia-border text-ink-charcoal font-body text-xs font-medium transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={isSaving}
            onClick={handleSave}
            className="px-5 py-2 rounded-sharp bg-terracotta hover:bg-terracotta-dark disabled:opacity-60 text-[#FAF6F0] font-body text-xs font-semibold tracking-wide border border-terracotta-dark shadow-sm transition-colors"
          >
            {isSaving ? "Guardando…" : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
}
