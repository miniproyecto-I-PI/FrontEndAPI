import ComingSoonPlaceholder from "../components/common/ComingSoonPlaceholder";

/**
 * CrearPage.jsx — route "/crear" (Arquitectura de Información C5, §3; T1).
 *
 * Implements US-01 ("Crear evento") and US-02 ("Agregar gestiones logísticas
 * iniciales") from the Backlog Refinado (C4), planned for Sprint 1.
 *
 * INTEGRATION NOTE for whoever builds this next: the form should call
 * `createEvent()` from services/api.js — that function already documents
 * the expected payload shape and the real `POST /events` endpoint it will
 * call once the backend exists.
 */
export default function CrearPage() {
  return (
    <ComingSoonPlaceholder
      title="Crear evento"
      description="Aquí vivirá el formulario para crear un evento y su plan inicial de gestiones logísticas (US-01, US-02)."
      plannedSprint="Sprint 1"
    />
  );
}
