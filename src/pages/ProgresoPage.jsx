import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getEvents } from "../services/api";
import PageContainer from "../components/layout/PageContainer";
import PageHeader from "../components/layout/PageHeader";

export default function ProgresoPage() {
  const [events, setEvents] = useState([]);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");

  useEffect(() => {
    getEvents().then((data) => { setEvents(data); setStatus("success"); })
      .catch((err) => { setError(err.message); setStatus("error"); });
  }, []);

  return (
    <PageContainer>
      <PageHeader eyebrow="Resumen" title="Progreso" description="Avance de las gestiones logísticas de cada evento." />
      {status === "loading" && <p role="status">Cargando progreso…</p>}
      {status === "error" && <p role="alert" className="text-crimson-urgent">{error}</p>}
      {status === "success" && events.length === 0 && <p className="text-ink-muted">Aún no tienes eventos registrados.</p>}
      {status === "success" && <ul className="space-y-3">{events.map((event) => {
        const { done, total } = event.progress ?? { done: 0, total: 0 };
        const percent = total ? Math.round((done / total) * 100) : 0;
        return <li key={event.id} className="rounded-sharp border border-sepia-border bg-paper-card p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Link className="font-semibold text-ink-charcoal hover:text-terracotta-dark" to={`/evento/${event.id}`}>{event.name}</Link>
            <span className="text-sm text-ink-muted">{done} de {total} gestiones · {percent}%</span>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-paper-linen" role="progressbar" aria-valuenow={percent} aria-valuemin="0" aria-valuemax="100" aria-label={`Progreso de ${event.name}`}>
            <div className="h-full bg-terracotta" style={{ width: `${percent}%` }} />
          </div>
        </li>;
      })}</ul>}
    </PageContainer>
  );
}
