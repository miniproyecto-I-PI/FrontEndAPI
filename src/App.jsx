import { Navigate, Route, Routes } from "react-router-dom";

import MainLayout from "./components/layout/MainLayout";
import HoyPage from "./pages/HoyPage";
import CrearPage from "./pages/CrearPage";
import EventoDetallePage from "./pages/EventoDetallePage";
import ProgresoPage from "./pages/ProgresoPage";
import LoginPage from "./pages/LoginPage";
import NotFoundPage from "./pages/NotFoundPage";

/**
 * App.jsx
 * ---------------------------------------------------------------------------
 * Routing table. Every path here comes straight from the Arquitectura de
 * Información document (C5, §3) — this file is the single place where that
 * document becomes real navigation, so keep the two in sync.
 *
 *   /hoy          → HoyPage          (T2 — fully built, Sprint 0 prototype)
 *   /crear        → CrearPage        (T1 — stub, Sprint 1)
 *   /evento/:id   → EventoDetallePage(T3/T1/T4 — stub, Sprint 1–3)
 *   /progreso     → ProgresoPage     (T4 — stub, Sprint 4)
 *   /login        → LoginPage        (US-11 — working form, Sprint 2 wiring)
 *
 * `/hoy` renders standalone (it owns its Header so the search box can be
 * wired up — see pages/HoyPage.jsx) while `/crear`, `/evento/:id` and
 * `/progreso` are nested under <MainLayout>, which provides the shared
 * Header/Footer shell via <Outlet /> (components/layout/MainLayout.jsx).
 * `/login` also renders standalone: per C5's own navigation rules, a login
 * screen should not show the app's main nav before the user is authenticated.
 */
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/hoy" replace />} />
      <Route path="/hoy" element={<HoyPage />} />
      <Route path="/login" element={<LoginPage />} />

      <Route element={<MainLayout />}>
        <Route path="/crear" element={<CrearPage />} />
        <Route path="/evento/:id" element={<EventoDetallePage />} />
        <Route path="/progreso" element={<ProgresoPage />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
