/**
 * useEventSubtasks.js
 * ---------------------------------------------------------------------------
 * Estado y lógica del detalle de un evento (route /evento/:id).
 * Espeja el patrón de useTodayGestiones: status / errorMessage / actions /
 * reload, para que las páginas se vean y comporten igual.
 *
 * Sprint 1 (US-02): carga el evento + sus subtareas y expone `addSubtask`.
 * Sprint 3–4 (US-06/07/08/09) agregarán reschedule, conflicto y estado aquí.
 */
import { useCallback, useEffect, useState } from "react";
import {
  getEventById,
  getEventSubtasks,
  addSubtask as apiAddSubtask,
} from "../services/api";

export function useEventSubtasks(eventId) {
  const [event, setEvent] = useState(null);
  const [subtasks, setSubtasks] = useState([]);
  const [status, setStatus] = useState("loading"); // 'loading' | 'success' | 'error'
  const [errorMessage, setErrorMessage] = useState("");

  const fetchData = useCallback(async () => {
    if (!eventId) return;
    setStatus("loading");
    try {
      const [evt, subs] = await Promise.all([
        getEventById(eventId),
        getEventSubtasks(eventId),
      ]);
      setEvent(evt);
      setSubtasks(subs);
      setStatus("success");
    } catch (err) {
      setErrorMessage(err.message || "No pudimos cargar este evento");
      setStatus("error");
    }
  }, [eventId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /**
   * Llama al POST y refresca desde "servidor". Lanza si falla para que el
   * modal muestre el error sin cerrarse (patrón de CrearPage).
   */
  const addSubtask = useCallback(
    async (payload) => {
      const created = await apiAddSubtask(eventId, payload);
      // Refetch en vez de append local: garantiza orden y forma consistentes
      // con lo que devolvería el backend real.
      await fetchData();
      return created;
    },
    [eventId, fetchData]
  );

  return {
    event,
    subtasks,
    status,
    errorMessage,
    addSubtask,
    reload: fetchData,
  };
}