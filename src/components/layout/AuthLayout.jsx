import { Link, Outlet } from "react-router-dom";
import Footer from "./Footer";
import logo from "../../assets/logo.png";

/**
 * AuthLayout.jsx — estructura de /login y /registro (diseño Stitch):
 * header mínimo con el logo (sin navegación principal, C5), tarjeta centrada
 * y el mismo Footer de la app.
 */
export default function AuthLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-paper-base dot-grid-pattern font-body text-ink-charcoal antialiased selection:bg-terracotta-light selection:text-terracotta-dark">
      <header className="w-full bg-[#FAF6F0]/95 backdrop-blur-md border-b border-sepia-border">
        <div className="h-16 max-w-[1440px] mx-auto px-4 md:px-8 lg:px-12 flex items-center">
          <Link to="/login" aria-label="Convoka — iniciar sesión" className="rounded-sharp focus:outline-none focus-visible:ring-2 focus-visible:ring-terracotta">
            <img src={logo} alt="Convoka Events" className="h-8 w-auto" />
          </Link>
        </div>
      </header>
      <main className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-[460px]">
          <Outlet />
        </div>
      </main>
      <Footer />
    </div>
  );
}
