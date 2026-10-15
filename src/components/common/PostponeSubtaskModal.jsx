import { useEffect, useRef, useState } from "react";

/** US-09: captura una nota opcional antes de persistir la gestión como pospuesta. */
export default function PostponeSubtaskModal({ subtask, onCancel, onSubmit }) {
  const [note, setNote] = useState(subtask?.note ?? "");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const textareaRef = useRef(null);

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
      await onSubmit(note.trim());
    } catch (err) {
      setError(err?.message || "No se pudo posponer la gestión. Intenta de nuevo.");
      setSaving(false);
    }
  }

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="postpone-title" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-charcoal/50 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) onCancel(); }}>
      <form onSubmit={handleSubmit} className="w-full max-w-lg bg-paper-card border border-sepia-border rounded-sharp p-6 warm-card-shadow" aria-busy={saving}>
        <div className="flex items-start gap-3 mb-5">
          <span className="material-symbols-outlined text-terracotta" aria-hidden="true">pause_circle</span>
          <div>
            <h2 id="postpone-title" className="font-heading text-2xl text-ink-charcoal">Posponer gestión</h2>
            <p className="font-body text-sm text-ink-muted mt-1">{subtask?.title}</p>
          </div>
        </div>
        <label htmlFor="postpone-note" className="block font-body text-sm font-semibold text-ink-charcoal mb-1.5">Nota <span className="font-normal text-ink-muted">(opcional)</span></label>
        <textarea id="postpone-note" ref={textareaRef} value={note} onChange={(event) => setNote(event.target.value)} maxLength={500} rows={4} placeholder="Agrega el motivo o una indicación para retomarla…" className="w-full resize-y bg-paper-base border border-sepia-border rounded-sharp px-3 py-2 font-body text-sm text-ink-charcoal focus:outline-none focus:ring-2 focus:ring-terracotta" />
        <p className="mt-1 text-right font-body text-xs text-ink-muted">{note.length}/500</p>
        {error && <p role="alert" className="mt-3 font-body text-sm text-crimson-urgent">{error}</p>}
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onCancel} disabled={saving} className="px-4 py-2 border border-sepia-border rounded-sharp font-body text-sm text-ink-charcoal disabled:opacity-50">Cancelar</button>
          <button type="submit" disabled={saving || note.length > 500} className="px-4 py-2 bg-terracotta hover:bg-terracotta-dark rounded-sharp font-body text-sm font-semibold text-paper-card disabled:opacity-60">{saving ? "Guardando…" : "Posponer gestión"}</button>
        </div>
      </form>
    </div>
  );
}
