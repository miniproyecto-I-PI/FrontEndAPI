/**
 * useTodayGestiones.js
 * ---------------------------------------------------------------------------
 * All the state and business logic behind the "/hoy" page lives here, kept
 * separate from the JSX so pages/HoyPage.jsx stays focused on layout.
 *
 * Responsibilities:
 *  - Fetch gestiones through services/api.js (loading / success / error).
 *  - Apply search + event-type filters.
 *  - Group + sort using utils/sortGestiones.js (the US-04 priority rule).
 *  - Apply OPTIMISTIC local updates for actions (mark done, postpone,
 *    reschedule) so the UI reacts instantly, with an `undo` escape hatch
 *    that the Toast component wires up to its "Deshacer" button.
 *
 * Optimistic-update pattern: each action stores a partial override keyed by
 * gestión id in `localOverrides`, merged on top of the last server response
 * (`rawGestiones`). `undo(id)` simply discards that override. If the backend
 * call fails, the override is discarded automatically as well, so the UI
 * self-corrects instead of silently drifting from server state.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getToday,
  markGestionAsDone,
  postponeGestion,
  rescheduleGestion,
} from "../services/api";
import { computeHoyStats, groupAndSortGestiones } from "../utils/sortGestiones";

export function useTodayGestiones({ simulateError = false, simulateEmpty = false } = {}) {
  const [rawGestiones, setRawGestiones] = useState([]);
  const [status, setStatus] = useState("loading"); // 'loading' | 'success' | 'error'
  const [errorMessage, setErrorMessage] = useState("");
  const [localOverrides, setLocalOverrides] = useState({}); // { [id]: Partial<Gestion> }

  const [query, setQuery] = useState("");
  const [eventTypeFilter, setEventTypeFilter] = useState("todos");

  const fetchData = useCallback(async () => {
    setStatus("loading");
    try {
      const data = await getToday({ simulateError });
      setRawGestiones(simulateEmpty ? [] : data);
      setLocalOverrides({});
      setStatus("success");
    } catch (err) {
      setErrorMessage(err.message || "No pudimos cargar tus gestiones");
      setStatus("error");
    }
  }, [simulateError, simulateEmpty]);

  useEffect(() => {
    Promise.resolve().then(fetchData);
  }, [fetchData]);

  const clearOverride = (id) =>
    setLocalOverrides((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });

  const setOverride = (id, patch) =>
    setLocalOverrides((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));

  // Server data + optimistic overrides merged together.
  const effectiveGestiones = useMemo(
    () => rawGestiones.map((g) => (localOverrides[g.id] ? { ...g, ...localOverrides[g.id] } : g)),
    [rawGestiones, localOverrides]
  );

  const filteredGestiones = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return effectiveGestiones.filter((g) => {
      const matchesType = eventTypeFilter === "todos" || g.eventType === eventTypeFilter;
      const matchesQuery =
        normalizedQuery === "" ||
        `${g.eventName} ${g.title}`.toLowerCase().includes(normalizedQuery);
      return matchesType && matchesQuery;
    });
  }, [effectiveGestiones, eventTypeFilter, query]);

  const grouped = useMemo(() => groupAndSortGestiones(filteredGestiones), [filteredGestiones]);
  const stats = useMemo(() => computeHoyStats(grouped), [grouped]);

  /** US-09 — Marcar gestión como ejecutada. Returns the previous status for Undo. */
  const markAsDone = useCallback(async (id) => {
    setOverride(id, { status: "EJECUTADA" });
    try {
      await markGestionAsDone(id);
    } catch {
      clearOverride(id); // revert optimistic change if the backend call fails
    }
  }, []);

  /** US-09 — Posponer con nota opcional. */
  const postpone = useCallback(async (id, note) => {
    setOverride(id, { status: "POSPUESTA", postponeNote: note });
    try {
      await postponeGestion(id, note);
    } catch {
      clearOverride(id);
    }
  }, []);

  /** US-06 — Reprogramar una gestión a una nueva fecha/hora. */
  const reschedule = useCallback(async (id, newTargetDateISO) => {
    const previous = rawGestiones.find((g) => g.id === id)?.targetDate;
    setOverride(id, { targetDate: newTargetDateISO });
    try {
      await rescheduleGestion(id, newTargetDateISO);
    } catch {
      if (previous) setOverride(id, { targetDate: previous });
    }
  }, [rawGestiones]);

  /** Bulk version used by "Reprogramar todas" on the Vencidas section. */
  const rescheduleMany = useCallback(
    async (ids, newTargetDateISO) => {
      await Promise.all(ids.map((id) => reschedule(id, newTargetDateISO)));
    },
    [reschedule]
  );

  /** Discards any optimistic override, restoring the last known server state ("Deshacer"). */
  const undo = useCallback((id) => clearOverride(id), []);

  return {
    status,
    errorMessage,
    grouped,
    stats,
    query,
    setQuery,
    eventTypeFilter,
    setEventTypeFilter,
    actions: { markAsDone, postpone, reschedule, rescheduleMany, undo },
    reload: fetchData,
  };
}
