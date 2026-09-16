/**
 * useDailyLimit.js
 * ---------------------------------------------------------------------------
 * Encapsulates US-12 ("Configurar límite diario de horas de gestión").
 * Per the Arquitectura de Información (C5), this setting is NOT a route —
 * it's a global modal reachable from a persistent header icon on every main
 * route (/hoy, /evento/:id, /progreso). Putting the state in its own hook
 * (instead of inside the Header component) means any future page can reuse
 * it the same way, matching that architectural decision.
 */
import { useCallback, useEffect, useState } from "react";
import { dailyLimitApi } from "../services/api";

const DEFAULT_LIMIT_HOURS = 6;
const MIN_HOURS = 1;
const MAX_HOURS = 16;

export function useDailyLimit() {
  const [hours, setHours] = useState(DEFAULT_LIMIT_HOURS);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    dailyLimitApi.get().then(({ dailyLimitHours }) => {
      setHours(dailyLimitHours);
      setIsLoaded(true);
    });
  }, []);

  const update = useCallback(async (newHours) => {
    if (newHours < MIN_HOURS || newHours > MAX_HOURS) {
      throw new Error(`El límite debe estar entre ${MIN_HOURS} y ${MAX_HOURS} horas`);
    }
    const result = await dailyLimitApi.update(newHours);
    setHours(result.dailyLimitHours);
    return result.dailyLimitHours;
  }, []);

  return { hours, isLoaded, update, MIN_HOURS, MAX_HOURS };
}
