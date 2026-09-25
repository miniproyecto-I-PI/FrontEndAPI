import { useCallback, useEffect, useState } from "react";
import { getEventsWithProgress } from "../services/api";

export function useEvents() {
  const [events, setEvents] = useState([]);
  const [status, setStatus] = useState("loading");
  const [errorMessage, setErrorMessage] = useState("");

  const fetchData = useCallback(async () => {
    setStatus("loading");
    try {
      const list = await getEventsWithProgress();
      setEvents(list);
      setStatus("success");
    } catch (err) {
      setErrorMessage(err.message || "No pudimos cargar tus eventos");
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    Promise.resolve().then(fetchData);
  }, [fetchData]);

  return { events, status, errorMessage, reload: fetchData };
}
