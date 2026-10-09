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

export const DAILY_LIMIT_UPDATED_EVENT = "convoka:daily-limit-updated";

export function useDailyLimit() {
  const [hours, setHours] = useState(DEFAULT_LIMIT_HOURS);
  const [allowOverload, setAllowOverload] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    dailyLimitApi.get().then(({ dailyLimitHours, allowOverload: ao }) => {
      if (active) {
        setHours(dailyLimitHours);
        setAllowOverload(Boolean(ao));
        setIsLoaded(true);
      }
    });

    const handleUpdate = (e) => {
      const updatedHours = Number(e.detail?.dailyLimitHours);
      if (Number.isFinite(updatedHours)) {
        setHours(updatedHours);
      }
      if (e.detail?.allowOverload !== undefined) {
        setAllowOverload(Boolean(e.detail.allowOverload));
      }
    };

    window.addEventListener(DAILY_LIMIT_UPDATED_EVENT, handleUpdate);
    return () => {
      active = false;
      window.removeEventListener(DAILY_LIMIT_UPDATED_EVENT, handleUpdate);
    };
  }, []);

  const update = useCallback(async (params) => {
    let newHours;
    let newAllow;
    if (typeof params === "object" && params !== null) {
      newHours = params.hours ?? params.dailyLimitHours;
      newAllow = params.allowOverload;
    } else {
      newHours = params;
    }

    if (newHours !== undefined) {
      if (newHours < MIN_HOURS || newHours > MAX_HOURS) {
        throw new Error(`El límite debe estar entre ${MIN_HOURS} y ${MAX_HOURS} horas`);
      }
    }

    const result = await dailyLimitApi.update({
      dailyLimitHours: newHours,
      allowOverload: newAllow,
    });
    setHours(result.dailyLimitHours);
    setAllowOverload(result.allowOverload);
    window.dispatchEvent(
      new CustomEvent(DAILY_LIMIT_UPDATED_EVENT, {
        detail: {
          dailyLimitHours: result.dailyLimitHours,
          allowOverload: result.allowOverload,
        },
      })
    );
    return result;
  }, []);

  return { hours, allowOverload, isLoaded, update, MIN_HOURS, MAX_HOURS };
}
