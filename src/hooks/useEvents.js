import { useCallback, useEffect, useState } from "react";
import { getEvents } from "../services/api";

/**
 * useEvents.js
 * ---------------------------------------------------------------------------
 * Listado de eventos para la vista /eventos.
 * Patrón idéntico a useTodayGestiones / useEventSubtasks:
 *   { events, status, errorMessage, reload }.
 *
 * @param {{ simulateError?: boolean }} [opts]
 */
export function useEvents({ simulateError = false } = {}) {
  const [events, setEvents] = useState([]);
  const [status, setStatus] = useState("loading");
  const [errorMessage, setErrorMessage] = useState("");

  const fetchData = useCallback(async () => {
    setStatus("loading");
    try {
      const list = await getEvents({ simulateError });
      setEvents(list);
      setStatus("success");
    } catch (err) {
      setErrorMessage(err.message || "No pudimos cargar tus eventos");
      setStatus("error");
    }
  }, [simulateError]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { events, status, errorMessage, reload: fetchData };
}