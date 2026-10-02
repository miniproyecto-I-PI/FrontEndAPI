/**
 * PageContainer.jsx
 * ---------------------------------------------------------------------------
 * Contenedor único de contenido. Fija el ancho máximo, los márgenes
 * laterales y el espacio entre el Header y el título de la página, para que
 * sean idénticos en todas las rutas (diseños de Stitch unificados).
 *
 * `narrow` centra una columna más angosta (formularios de crear evento/gestión)
 * sin cambiar el margen superior.
 */
export default function PageContainer({ narrow = false, className = "", children }) {
  return (
    <div className="max-w-[1440px] mx-auto px-4 md:px-8 lg:px-12 pt-8 pb-4">
      <div className={[narrow ? "max-w-4xl mx-auto" : "", className].join(" ").trim() || undefined}>
        {children}
      </div>
    </div>
  );
}
