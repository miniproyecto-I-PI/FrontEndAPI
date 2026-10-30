import { useEffect, useRef, useState } from "react";

/**
 * DurationInput.jsx — patrón estándar "campo + unidad" (Asana, ClickUp, Linear).
 *
 * Uso: recibe el decimal en horas (`value`) y emite el decimal al padre
 * (`onChange`). La UI permite al usuario escribir en horas o en minutos; al
 * cambiar la unidad, el valor se convierte sin pérdida de información.
 *
 *   <DurationInput value={form.estimatedHours} onChange={(h) => ...} />
 *
 * Internamente guarda `amount` como string en la unidad actual, y convierte
 * a horas para emitir. El padre sigue recibiendo un string decimal ("2.5",
 * "0.75", "1.5") compatible con lo que ya hace `createEvent`, `updateSubtask`,
 * `estimated_hours` del backend, etc.
 */
export default function DurationInput({
  value = "",
  onChange,
  minHours = 0.5,
  maxHours = 24,
  disabled = false,
  invalid = false,
  id,
  placeholderHours = "2.5",
  placeholderMinutes = "30",
}) {
  const numericValue = Number(value) || 0;

  const [unit, setUnit] = useState("hours"); // 'hours' | 'minutes'
  const [amount, setAmount] = useState(() =>
    numericValue > 0 ? String(numericValue) : ""
  );

  // Evita el loop de resync con el padre: solo reconvertimos si el valor
  // externo cambió respecto al que ya emitimos nosotros.
  const lastEmittedRef = useRef(numericValue);

  useEffect(() => {
    if (numericValue === lastEmittedRef.current) return;
    lastEmittedRef.current = numericValue;
    if (numericValue > 0) {
      const converted =
        unit === "hours" ? numericValue : Math.round(numericValue * 60);
      setAmount(String(converted));
    } else {
      setAmount("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [numericValue]);

  function emit(hours) {
    lastEmittedRef.current = hours;
    onChange(hours > 0 ? String(hours) : "");
  }

  function handleAmountChange(e) {
    const raw = e.target.value;
    setAmount(raw);
    const num = Number(raw);
    if (!raw || isNaN(num) || num <= 0) {
      emit(0);
      return;
    }
    const hours = unit === "hours" ? num : num / 60;
    emit(hours);
  }

  function handleUnitChange(e) {
    const nextUnit = e.target.value;
    if (nextUnit === unit) return;
    const num = Number(amount);
    if (!amount || isNaN(num) || num <= 0) {
      setUnit(nextUnit);
      return;
    }
    let converted;
    if (unit === "hours" && nextUnit === "minutes") {
      converted = Math.round(num * 60);
    } else if (unit === "minutes" && nextUnit === "hours") {
      // 3 decimales para no perder precisión (45 min → 0.75 h, 40 min → 0.667 h)
      converted = Math.round((num / 60) * 1000) / 1000;
    } else {
      converted = num;
    }
    setUnit(nextUnit);
    setAmount(String(converted));
    // El decimal guardado no cambia al cambiar de unidad, no emitimos.
  }

  // Preview legible: "= 3.5 h" o "= 2 h 30 min"
  const previewHours =
    Number(amount) > 0
      ? unit === "hours"
        ? Number(amount)
        : Number(amount) / 60
      : 0;

  let previewText = "";
  if (previewHours > 0) {
    if (unit === "minutes") {
      previewText = `= ${previewHours.toFixed(2).replace(/\.?0+$/, "")} h`;
    } else if (!Number.isInteger(previewHours)) {
      const h = Math.floor(previewHours);
      const m = Math.round((previewHours - h) * 60);
      previewText = m > 0 ? `= ${h} h ${m} min` : `= ${h} h`;
    }
  }

  const min = unit === "hours" ? minHours : Math.round(minHours * 60);
  const max = unit === "hours" ? maxHours : Math.round(maxHours * 60);
  const step = unit === "hours" ? 0.5 : 15;

  return (
    <div className="space-y-1">
      <div
        className={`flex items-stretch rounded-sharp border bg-paper-base overflow-hidden transition-colors ${
          invalid
            ? "border-crimson-urgent focus-within:ring-1 focus-within:ring-crimson-urgent"
            : "border-sepia-border focus-within:border-terracotta focus-within:ring-1 focus-within:ring-terracotta"
        } ${disabled ? "opacity-60" : ""}`}
      >
        <input
          id={id}
          type="number"
          inputMode="decimal"
          min={min}
          max={max}
          step={step}
          value={amount}
          onChange={handleAmountChange}
          disabled={disabled}
          placeholder={unit === "hours" ? placeholderHours : placeholderMinutes}
          aria-invalid={invalid || undefined}
          className="flex-1 min-w-0 px-3.5 py-2 bg-transparent text-sm text-ink-charcoal placeholder:text-ink-subtle placeholder:italic focus:outline-none border-none"
        />
        <select
          value={unit}
          onChange={handleUnitChange}
          disabled={disabled}
          aria-label="Unidad de duración"
          className="shrink-0 border-l border-sepia-border bg-paper-linen text-xs font-body font-medium text-ink-charcoal px-2.5 focus:outline-none cursor-pointer"
        >
          <option value="hours">horas</option>
          <option value="minutes">minutos</option>
        </select>
      </div>
      {previewText && (
        <p className="font-mono-stamp text-[10px] text-ink-muted pl-0.5">
          {previewText}
        </p>
      )}
    </div>
  );
}