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
  updateEvent as apiUpdateEvent,
  updateSubtask as apiUpdateSubtask,
  deleteSubtask as apiDeleteSubtask,
} from "../services/api";

export function useEventSubtasks(eventId) {
  const [event, setEvent] = useState(null);
  const [subtasks, setSubtasks] = useState([]);
  const [status, setStatus] = useState("loading");
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

  const addSubtask = useCallback(
    async (payload) => {
      const created = await apiAddSubtask(eventId, payload);
      await fetchData();
      return created;
    },
    [eventId, fetchData]
  );

  /** US-03 — actualiza el evento y refresca el estado local. */
  const updateEvent = useCallback(
    async (patch) => {
      const updated = await apiUpdateEvent(eventId, patch);
      setEvent(updated);
      return updated;
    },
    [eventId]
  );

  /** US-03 — actualiza una subtarea (edit). Lanza si falla para el modal. */
  const updateSubtask = useCallback(
    async (subtaskId, patch) => {
      const updated = await apiUpdateSubtask(subtaskId, patch);
      await fetchData();
      return updated;
    },
    [fetchData]
  );

  /** US-03 — elimina una subtarea. Lanza si falla para el modal. */
  const removeSubtask = useCallback(
    async (subtaskId) => {
      await apiDeleteSubtask(subtaskId);
      await fetchData();
    },
    [fetchData]
  );

  return {
    event,
    subtasks,
    status,
    errorMessage,
    addSubtask,
    updateEvent,
    updateSubtask,
    removeSubtask,
    reload: fetchData,
  };
}