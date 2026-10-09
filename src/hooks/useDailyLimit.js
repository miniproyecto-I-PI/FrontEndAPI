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
  const [allowSubtasksAfterEvent, setAllowSubtasksAfterEvent] = useState(false);
  const [allowOverdueSubtasks, setAllowOverdueSubtasks] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    dailyLimitApi.get().then((data) => {
      if (active) {
        setHours(data.dailyLimitHours);
        setAllowOverload(Boolean(data.allowOverload));
        setAllowSubtasksAfterEvent(Boolean(data.allowSubtasksAfterEvent));
        setAllowOverdueSubtasks(Boolean(data.allowOverdueSubtasks));
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
      if (e.detail?.allowSubtasksAfterEvent !== undefined) {
        setAllowSubtasksAfterEvent(Boolean(e.detail.allowSubtasksAfterEvent));
      }
      if (e.detail?.allowOverdueSubtasks !== undefined) {
        setAllowOverdueSubtasks(Boolean(e.detail.allowOverdueSubtasks));
      }
    };

    window.addEventListener(DAILY_LIMIT_UPDATED_EVENT, handleUpdate);
    return () => {
      active = false;
      window.removeEventListener(DAILY_LIMIT_UPDATED_EVENT, handleUpdate);
    };
  }, []);

  const update = useCallback(async (params) => {
    let payload = {};
    if (typeof params === "object" && params !== null) {
      if (params.hours !== undefined || params.dailyLimitHours !== undefined) {
        payload.dailyLimitHours = params.hours ?? params.dailyLimitHours;
      }
      if (params.allowOverload !== undefined) {
        payload.allowOverload = params.allowOverload;
      }
      if (params.allowSubtasksAfterEvent !== undefined) {
        payload.allowSubtasksAfterEvent = params.allowSubtasksAfterEvent;
      }
      if (params.allowOverdueSubtasks !== undefined) {
        payload.allowOverdueSubtasks = params.allowOverdueSubtasks;
      }
    } else if (params !== undefined) {
      payload.dailyLimitHours = params;
    }

    if (payload.dailyLimitHours !== undefined) {
      if (payload.dailyLimitHours < MIN_HOURS || payload.dailyLimitHours > MAX_HOURS) {
        throw new Error(`El límite debe estar entre ${MIN_HOURS} y ${MAX_HOURS} horas`);
      }
    }

    const result = await dailyLimitApi.update(payload);
    setHours(result.dailyLimitHours);
    setAllowOverload(result.allowOverload);
    setAllowSubtasksAfterEvent(result.allowSubtasksAfterEvent);
    setAllowOverdueSubtasks(result.allowOverdueSubtasks);

    window.dispatchEvent(
      new CustomEvent(DAILY_LIMIT_UPDATED_EVENT, {
        detail: result,
      })
    );
    return result;
  }, []);

  return {
    hours,
    allowOverload,
    allowSubtasksAfterEvent,
    allowOverdueSubtasks,
    isLoaded,
    update,
    MIN_HOURS,
    MAX_HOURS,
  };
}
