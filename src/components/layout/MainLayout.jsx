import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";

/** Rutas cuyo contenido filtra con el buscador del Header. */
const SEARCHABLE_ROUTES = ["/hoy", "/eventos"];

/**
 * MainLayout.jsx
 * ---------------------------------------------------------------------------
 * Estructura compartida de todas las rutas autenticadas (C5): Header fijo,
 * contenido y Footer. `/login` y `/registro` NO lo usan: una pantalla de
 * acceso no debe mostrar la navegación principal.
 *
 * El texto del buscador vive aquí y se entrega a la página activa con
 * `useOutletContext()` → `{ search, setSearch }`. Se limpia al cambiar de ruta.
 */
export default function MainLayout() {
  const { pathname } = useLocation();
  const [searchState, setSearchState] = useState({ path: pathname, value: "" });

  // Reiniciar el buscador al navegar sin un efecto adicional.
  const search = searchState.path === pathname ? searchState.value : "";
  const setSearch = (value) => setSearchState({ path: pathname, value });
  const isSearchable = SEARCHABLE_ROUTES.includes(pathname);

  return (
    <div className="min-h-screen flex flex-col bg-paper-base dot-grid-pattern font-body text-ink-charcoal antialiased selection:bg-terracotta-light selection:text-terracotta-dark">
      <Header
        searchValue={isSearchable ? search : undefined}
        onSearchChange={isSearchable ? setSearch : undefined}
      />
      <main className="w-full pt-16 flex-1">
        <Outlet context={{ search, setSearch }} />
      </main>
      <Footer />
    </div>
  );
}
