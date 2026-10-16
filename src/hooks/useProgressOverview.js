import { useCallback, useEffect, useState } from "react";
import { getProgressOverview } from "../services/api";

export function useProgressOverview() {
  const [overview, setOverview] = useState({ summary: null, events: [] });
  const [status, setStatus] = useState("loading");
  const [errorMessage, setErrorMessage] = useState("");

  const reload = useCallback(async () => {
    setStatus("loading");
    setErrorMessage("");
    try {
      const data = await getProgressOverview();
      setOverview(data);
      setStatus("success");
    } catch (error) {
      setErrorMessage(error.message || "No pudimos cargar el progreso.");
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    Promise.resolve().then(reload);
  }, [reload]);

  return { ...overview, status, errorMessage, reload };
}
