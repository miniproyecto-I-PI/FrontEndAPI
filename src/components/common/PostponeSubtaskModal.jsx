import { useEffect, useId, useRef, useState } from "react";
import { toDateInputValue } from "../../utils/dateUtils";
import { useDailyLimit } from "../../hooks/useDailyLimit";

/**
 * PostponeSubtaskModal.jsx — US-09 + US-06.
 *
 * Permite posponer una gestión con una nota opcional y, además, reprogramarla
 * a una nueva fecha tentativa en la misma operación (opcional). Si el usuario
 * deja la fecha vacía, solo se marca como POSPUESTA y conserva la fecha actual
 * (comportamiento original de US-09). Si elige una fecha, el backend valida
 * fecha pasada, fecha posterior al evento y sobrecarga diaria (US-07), y la
 * gestión se mueve al grupo correspondiente en /hoy.
 */
export default function PostponeSubtaskModal({
  subtask,
  eventDateTime,
  onCancel,
  onSubmit,
}) {
  const { allowOverdueSubtasks, allowSubtasksAfterEvent } = useDailyLimit();
  const [note, setNote] = useState(subtask?.note ?? "");
  const [newDate, setNewDate] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const textareaRef = useRef(null);
  const baseId = useId();
  const dateId = `${baseId}-date`;

  // Límites del date picker según la configuración del usuario (/settings).
  const todayISO = toDateInputValue(new Date());
  const eventDateISO = eventDateTime ? toDateInputValue(eventDateTime) : null;
  const minDate = allowOverdueSubtasks ? undefined : todayISO;
  const maxDate = !allowSubtasksAfterEvent && eventDateISO ? eventDateISO : undefined;

  useEffect(() => {
    textareaRef.current?.focus();
    function onKeyDown(event) {
      if (event.key === "Escape" && !saving) onCancel();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onCancel, saving]);

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await onSubmit({
        note: note.trim(),
        newDate: newDate || null,
      });
    } catch (err) {
      const messageByCode = {
        target_date_in_past:
          "La fecha elegida es anterior a hoy y tu configuración no permite fechas pasadas.",
        target_date_after_event:
          "La fecha elegida es posterior al evento y tu configuración no lo permite.",
        overload_conflict: err.message,
      };
      setError(
        messageByCode[err.code] ||
        err?.message ||
        "No se pudo posponer la gestión. Intenta de nuevo."
      );
      setSaving(false);
    }
  }

  const currentDateLabel = subtask?.targetDate
    ? new Date(`${subtask.targetDate.split("T")[0]}T12:00:00`).toLocaleDateString("es", {
        day: "numeric",
        month: "long",
      })
    : null;
  const eventDateLabel = eventDateTime
    ? new Date(eventDateTime).toLocaleDateString("es", {
        day: "numeric",
        month: "long",
      })
    : null;

  const submitLabel = saving
    ? "Guardando…"
    : newDate
      ? "Posponer y mover"
      : "Posponer gestión";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="postpone-title"
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-ink-charcoal/50 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !saving) onCancel();
      }}
    >
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-lg max-h-[90vh] flex flex-col bg-paper-card border border-sepia-border rounded-sharp warm-card-shadow"
        aria-busy={saving}
      >
        <div className="p-6 overflow-y-auto scrollbar-editorial space-y-5">
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-terracotta" aria-hidden="true">
              pause_circle
            </span>
            <div className="min-w-0">
              <h2 id="postpone-title" className="font-heading text-2xl text-ink-charcoal">
                Posponer gestión
              </h2>
              <p className="font-body text-sm text-ink-muted mt-1 truncate">
                {subtask?.title}
              </p>
            </div>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor={dateId}
              className="flex items-center justify-between font-body text-sm font-semibold text-ink-charcoal"
            >
              <span>Nueva fecha tentativa</span>
              <span className="font-normal text-ink-muted text-xs">Opcional</span>
            </label>
            <input
              id={dateId}
              type="date"
              value={newDate}
              onChange={(event) => setNewDate(event.target.value)}
              min={minDate}
              max={maxDate}
              className="w-full bg-paper-base border border-sepia-border rounded-sharp px-3 py-2 font-body text-sm text-ink-charcoal focus:outline-none focus:ring-2 focus:ring-terracotta"
            />
            <p className="font-body text-xs text-ink-muted leading-relaxed">
              {currentDateLabel && (
                <>
                  Fecha actual: <strong className="text-ink-charcoal">{currentDateLabel}</strong>.{" "}
                </>
              )}
              {eventDateLabel && (
                <>
                  El evento se celebra el{" "}
                  <strong className="text-ink-charcoal">{eventDateLabel}</strong>.{" "}
                </>
              )}
              Si la dejas vacía, solo se marcará como pospuesta sin mover la fecha.
            </p>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="postpone-note"
              className="flex items-center justify-between font-body text-sm font-semibold text-ink-charcoal"
            >
              <span>Nota</span>
              <span className="font-normal text-ink-muted text-xs">Opcional</span>
            </label>
            <textarea
              id="postpone-note"
              ref={textareaRef}
              value={note}
              onChange={(event) => setNote(event.target.value)}
              maxLength={500}
              rows={3}
              placeholder="Agrega el motivo o una indicación para retomarla…"
              className="w-full resize-y bg-paper-base border border-sepia-border rounded-sharp px-3 py-2 font-body text-sm text-ink-charcoal focus:outline-none focus:ring-2 focus:ring-terracotta"
            />
            <p className="mt-1 text-right font-body text-xs text-ink-muted">
              {note.length}/500
            </p>
          </div>

          {error && (
            <div
              role="alert"
              className="rounded-sharp bg-crimson-paper border border-crimson-urgent/30 px-3 py-2 font-body text-xs text-crimson-urgent"
            >
              {error}
            </div>
          )}
        </div>

        <div className="px-6 pb-6 pt-4 border-t border-sepia-border flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="px-4 py-2 border border-sepia-border rounded-sharp font-body text-sm text-ink-charcoal disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-terracotta hover:bg-terracotta-dark rounded-sharp font-body text-sm font-semibold text-paper-card disabled:opacity-60"
          >
            {submitLabel}
          </button>
        </div>
      </form>
    </div>
  );
}