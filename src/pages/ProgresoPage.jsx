import { Link, useNavigate } from "react-router-dom";
import { useEvents } from "../hooks/useEvents";
import PageContainer from "../components/layout/PageContainer";
import PageHeader from "../components/layout/PageHeader";
import StateCard from "../components/common/StateCard";

/**
 * ProgresoPage.jsx — ruta "/progreso" (T4). No tiene diseño propio en Stitch:
 * usa los mismos componentes y estados que el resto de la app.
 */
export default function ProgresoPage() {
  const navigate = useNavigate();
  const { events, status, reload } = useEvents();

  return (
    <PageContainer>
      <PageHeader eyebrow="Resumen" title="Progreso" accent="de eventos" description="Avance de las gestiones logísticas de cada evento." />

      {status === "loading" && (
        <ul className="space-y-3" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <li key={i} className="bg-paper-card border border-sepia-border rounded-sharp p-5 warm-card-shadow space-y-3">
              <div className="flex justify-between">
                <div className="h-5 w-56 animate-warm-pulse rounded-sharp" />
                <div className="h-4 w-32 animate-warm-pulse rounded-sharp" />
              </div>
              <div className="h-2 w-full animate-warm-pulse rounded-full" />
            </li>
          ))}
        </ul>
      )}

      {status === "error" && (
        <StateCard
          tone="error"
          icon="sync_problem"
          stamp="Incidencia de sincronización"
          title="No pudimos cargar el progreso"
          description="Hubo una incidencia al conectar con el servidor. Tus datos guardados están a salvo."
          primaryAction={{ label: "Reintentar carga", icon: "refresh", onClick: reload }}
          compact
        />
      )}

      {status === "success" && events.length === 0 && (
        <StateCard
          icon="monitoring"
          title="Aún no tienes eventos registrados"
          description="Crea tu primer evento para seguir el avance de sus gestiones."
          primaryAction={{ label: "Crear evento", icon: "add", onClick: () => navigate("/crear") }}
          compact
        />
      )}

      {status === "success" && events.length > 0 && (
        <ul className="space-y-3">
          {events.map((event) => {
            const { done, total } = event.progress ?? { done: 0, total: 0 };
            const percent = total ? Math.round((done / total) * 100) : 0;
            return (
              <li key={event.id} className="bg-paper-card border border-sepia-border rounded-sharp p-5 warm-card-shadow">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <Link className="font-heading text-lg font-semibold text-ink-charcoal hover:text-terracotta-dark transition-colors" to={`/evento/${event.id}`}>
                    {event.name}
                  </Link>
                  <span className="font-mono-stamp text-xs text-ink-muted">
                    {done} de {total} gestiones · <strong className="text-terracotta-dark">{percent}%</strong>
                  </span>
                </div>
                <div
                  className="mt-3 h-2 overflow-hidden rounded-full bg-paper-linen"
                  role="progressbar"
                  aria-valuenow={percent}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`Progreso de ${event.name}`}
                >
                  <div className="h-full bg-terracotta rounded-full" style={{ width: `${percent}%` }} />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </PageContainer>
  );
}
