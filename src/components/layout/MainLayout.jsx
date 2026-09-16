import { Outlet } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";

/**
 * MainLayout.jsx
 * ---------------------------------------------------------------------------
 * Shared shell for every route defined in the Arquitectura de Información
 * (C5): /hoy, /crear, /evento/:id, /progreso. `/login` intentionally does
 * NOT use this layout (see App.jsx) since a login screen shouldn't show the
 * app's main navigation before the user is authenticated.
 *
 * `<Outlet />` is React Router's placeholder for whichever page component
 * matched the current route — this is what makes the layout reusable across
 * all of them without duplicating the Header/Footer per page.
 */
export default function MainLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-paper-base font-body text-ink-charcoal antialiased selection:bg-terracotta-light selection:text-terracotta-dark">
      <Header />
      <main className="w-full pt-16 flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
