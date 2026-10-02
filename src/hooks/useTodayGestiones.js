/**
 * useTodayGestiones.js
 * ---------------------------------------------------------------------------
 * Estado y lógica de la vista "/hoy" (US-04 + US-05), separada del JSX.
 *
 *  - Carga GET /today. Los filtros por evento y estado (US-05) se envían al
 *    backend como query params; el texto del buscador se filtra en memoria.
 *  - Agrupa y ordena con utils/sortGestiones.js (regla de priorización).
 *  - Estados: "loading" (primera carga), "success", "error". `isRefreshing`
 *    indica una recarga con datos ya visibles (chip "Sincronizando…").
 *    `errorKind` distingue un fallo de carga de un fallo al aplicar filtros.
 *  - Acciones optimistas (marcar hecha / reprogramar) con "Deshacer", que
 *    también revierte el cambio en el servidor.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { getEvents, getToday, markGestionAsDone, rescheduleGestion, updateSubtask } from "../services/api";
import { computeHoyStats, groupAndSortGestiones } from "../utils/sortGestiones";

export const STATUS_FILTERS = [
  { value: "", label: "Todas" },
  { value: "PENDIENTE", label: "Pendientes" },
  { value: "POSPUESTA", label: "Pospuestas" },
];

export function useTodayGestiones({ query = "", simulateError = false, simulateEmpty = false } = {}) {
  const [rawGestiones, setRawGestiones] = useState([]);
  const [status, setStatus] = useState("loading"); // 'loading' | 'success' | 'error'
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorKind, setErrorKind] = useState(null); // 'load' | 'filter'
  const [localOverrides, setLocalOverrides] = useState({}); // { [id]: Partial<Gestion> }

  const [eventFilter, setEventFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [eventOptions, setEventOptions] = useState([]);

  const hasServerFilters = Boolean(eventFilter || statusFilter);

  const fetchData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const data = await getToday({ eventId: eventFilter, status: statusFilter, simulateError });
      setRawGestiones(simulateEmpty ? [] : data);
      setLocalOverrides({});
      setErrorKind(null);
      setStatus("success");
    } catch {
      setErrorKind(eventFilter || statusFilter ? "filter" : "load");
      setStatus("error");
    } finally {
      setIsRefreshing(false);
    }
  }, [eventFilter, statusFilter, simulateError, simulateEmpty]);

  useEffect(() => {
    Promise.resolve().then(fetchData);
  }, [fetchData]);

  // Opciones del selector de evento: todos los eventos del organizador.
  useEffect(() => {
    let cancelled = false;
    getEvents()
      .then((events) => {
        if (!cancelled) setEventOptions(events.map((e) => ({ value: e.id, label: e.name })));
      })
      .catch(() => {
        // Sin la lista, el selector solo ofrece "Todos los eventos".
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const clearOverride = (id) =>
    setLocalOverrides((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });

  const setOverride = (id, patch) =>
    setLocalOverrides((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));

  // Datos del servidor + cambios optimistas.
  const effectiveGestiones = useMemo(
    () => rawGestiones.map((g) => (localOverrides[g.id] ? { ...g, ...localOverrides[g.id] } : g)),
    [rawGestiones, localOverrides]
  );

  const searchedGestiones = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return effectiveGestiones;
    return effectiveGestiones.filter((g) =>
      `${g.eventName} ${g.title} ${g.provider ?? ""}`.toLowerCase().includes(normalizedQuery)
    );
  }, [effectiveGestiones, query]);

  const grouped = useMemo(() => groupAndSortGestiones(searchedGestiones), [searchedGestiones]);
  const stats = useMemo(() => computeHoyStats(grouped), [grouped]);

  /** US-09 — Marcar como ejecutada (sale de /hoy). */
  const markAsDone = useCallback(async (id) => {
    setOverride(id, { status: "EJECUTADA" });
    try {
      await markGestionAsDone(id);
      return true;
    } catch {
      clearOverride(id);
      return false;
    }
  }, []);

  /** Deshacer "marcar como hecha": vuelve al estado previo también en el servidor. */
  const undoMarkAsDone = useCallback(
    async (id) => {
      const previousStatus = rawGestiones.find((g) => g.id === id)?.status ?? "PENDIENTE";
      clearOverride(id);
      try {
        await updateSubtask(id, { status: previousStatus });
        return true;
      } catch {
        setOverride(id, { status: "EJECUTADA" });
        return false;
      }
    },
    [rawGestiones]
  );

  /** US-06 — Reprogramar a una nueva fecha. */
  const reschedule = useCallback(
    async (id, newTargetDate) => {
      const previous = rawGestiones.find((g) => g.id === id)?.targetDate;
      setOverride(id, { targetDate: newTargetDate.split("T")[0] });
      try {
        await rescheduleGestion(id, newTargetDate);
        return true;
      } catch {
        if (previous) setOverride(id, { targetDate: previous });
        return false;
      }
    },
    [rawGestiones]
  );

  const clearFilters = useCallback(() => {
    setEventFilter("");
    setStatusFilter("");
  }, []);

  return {
    status,
    isRefreshing,
    errorKind,
    grouped,
    stats,
    totalUnfiltered: rawGestiones.filter((g) => g.status !== "EJECUTADA").length,
    filters: { eventFilter, setEventFilter, statusFilter, setStatusFilter, hasServerFilters, clearFilters },
    eventOptions,
    actions: { markAsDone, undoMarkAsDone, reschedule },
    reload: fetchData,
  };
}
