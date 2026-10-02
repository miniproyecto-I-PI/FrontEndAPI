import { Navigate, Route, Routes } from "react-router-dom";

import MainLayout from "./components/layout/MainLayout";
import HoyPage from "./pages/HoyPage";
import EventosPage from "./pages/EventosPage";
import CrearPage from "./pages/CrearPage";
import EventoDetallePage from "./pages/EventoDetallePage";
import ProgresoPage from "./pages/ProgresoPage";
import LoginPage from "./pages/LoginPage";
import NotFoundPage from "./pages/NotFoundPage";
import CrearGestionPage from "./pages/CrearGestionPage";

/**
 * App.jsx
 * ---------------------------------------------------------------------------
 * Routing table. Every path here comes straight from the Arquitectura de
 * Información document (C5, §3) — this file is the single place where that
 * document becomes real navigation, so keep the two in sync.
 *
 *   /hoy                        → HoyPage           (T2)
 *   /crear                      → CrearPage         (T1)
 *   /eventos                    → EventosPage       (listado)
 *   /evento/:id                 → EventoDetallePage (T3/T1/T4)
 *   /evento/:id/gestiones/crear → CrearGestionPage  (US-02)
 *   /progreso                   → ProgresoPage      (T4)
 *   /login                      → LoginPage         (US-11)
 *
 * Todas las rutas de la app comparten <MainLayout> (Header/Footer únicos,
 * buscador vía useOutletContext). `/login` queda fuera: por las reglas de
 * navegación de C5, la pantalla de acceso no muestra la navegación principal.
 */
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/hoy" replace />} />
      <Route path="/login" element={<LoginPage />} />

      <Route element={<MainLayout />}>
        <Route path="/hoy" element={<HoyPage />} />
        <Route path="/eventos" element={<EventosPage />} />
        <Route path="/crear" element={<CrearPage />} />
        <Route path="/evento/:id" element={<EventoDetallePage />} />
        <Route path="/evento/:id/gestiones/crear" element={<CrearGestionPage />} />
        <Route path="/progreso" element={<ProgresoPage />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
