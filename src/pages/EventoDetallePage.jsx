import { useParams } from "react-router-dom";
import ComingSoonPlaceholder from "../components/common/ComingSoonPlaceholder";

/**
 * EventoDetallePage.jsx — route "/evento/:id" (Arquitectura de Información
 * C5, §3; T3 y parte de T1/T4).
 *
 * This is the busiest route in the whole app once fully built: edit event,
 * manage its gestiones logísticas, reschedule (US-06), resolve overload
 * conflicts (US-07/US-08), and mark gestiones as done/postponed (US-09).
 * Reading `id` via `useParams()` already works — wire it to
 * `GET /events/:id` (not yet in services/api.js; add it alongside
 * `createEvent` following the same pattern) when that endpoint exists.
 */
export default function EventoDetallePage() {
  const { id } = useParams();

  return (
    <ComingSoonPlaceholder
      title={`Detalle del evento`}
      description={`Aquí vivirá el detalle del evento "${id}": edición, gestiones logísticas, reprogramación y resolución de conflictos (US-03, US-06, US-07, US-08, US-09).`}
      plannedSprint="Sprint 1–3"
    />
  );
}
