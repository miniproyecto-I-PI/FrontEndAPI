/**
 * LoadingSkeleton.jsx
 * ---------------------------------------------------------------------------
 * Esqueleto de "/hoy" mientras GET /today responde (diseño Stitch "cargando"):
 * resumen de actividad + las tres secciones con la misma forma que el
 * contenido real, para que la página no "salte" al cargar.
 */
const Bar = ({ className }) => <div className={`animate-warm-pulse rounded-sharp ${className}`} />;

function SectionTitle({ numeral, title, tone }) {
  return (
    <div className={`flex items-baseline justify-between gap-2.5 pb-2 border-b ${tone === "crimson" ? "border-crimson-urgent/30" : "border-sepia-border"}`}>
      <div className="flex items-baseline gap-2.5">
        <span className={`font-heading font-bold text-xl ${tone === "crimson" ? "text-crimson-urgent" : tone === "terracotta" ? "text-terracotta" : "text-sepia-dark"}`}>{numeral}</span>
        <span className="font-heading text-2xl md:text-3xl text-ink-charcoal font-semibold tracking-tight">{title}</span>
        <Bar className="h-4 w-32 hidden sm:block" />
      </div>
      <Bar className="h-4 w-28" />
    </div>
  );
}

function RowCard() {
  return (
    <div className="bg-paper-card border border-sepia-border border-l-[6px] border-l-crimson-urgent p-4 md:p-5 rounded-sharp warm-card-shadow flex flex-col lg:flex-row lg:items-center justify-between gap-4">
      <div className="space-y-2.5 flex-1">
        <div className="flex gap-3">
          <Bar className="h-4 w-28" />
          <Bar className="h-4 w-40" />
          <Bar className="h-4 w-20" />
        </div>
        <Bar className="h-6 w-3/4" />
        <Bar className="h-4 w-1/2" />
      </div>
      <div className="flex gap-2 shrink-0">
        <Bar className="h-8 w-32" />
        <Bar className="h-8 w-24" />
      </div>
    </div>
  );
}

function SmallCard({ accent = "border-l-terracotta" }) {
  return (
    <div className={`bg-paper-card border border-sepia-border border-l-4 ${accent} p-4 rounded-sharp warm-card-shadow space-y-2.5`}>
      <div className="flex justify-between pb-2 border-b border-sepia-border/50">
        <Bar className="h-4 w-24" />
        <Bar className="h-4 w-12" />
      </div>
      <Bar className="h-3 w-28" />
      <Bar className="h-5 w-4/5" />
      <Bar className="h-3 w-3/5" />
      <div className="flex justify-end gap-2 pt-2 border-t border-sepia-border/50">
        <Bar className="h-7 w-28" />
        <Bar className="h-7 w-20" />
      </div>
    </div>
  );
}

export function StatsSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="bg-paper-card border border-sepia-border p-3.5 px-4 rounded-sharp warm-card-shadow">
          <Bar className="h-3 w-20" />
          <div className="flex items-baseline gap-2 mt-2">
            <Bar className="h-8 w-10" />
            <Bar className="h-3 w-24" />
          </div>
          <Bar className="h-1 w-full mt-3" />
        </div>
      ))}
    </div>
  );
}

export default function LoadingSkeleton() {
  return (
    <div className="space-y-9" aria-hidden="true">
      <section className="space-y-3.5">
        <SectionTitle numeral="I." title="Vencidas" tone="crimson" />
        <div className="grid grid-cols-1 gap-3">
          <RowCard />
          <RowCard />
        </div>
      </section>
      <section className="space-y-3.5">
        <SectionTitle numeral="II." title="Agenda de Hoy" tone="terracotta" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-7"><SmallCard /></div>
          <div className="lg:col-span-5 space-y-3.5"><SmallCard /><SmallCard /></div>
        </div>
      </section>
      <section className="space-y-3.5">
        <SectionTitle numeral="III." title="Próximas Jornadas" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SmallCard accent="border-l-sepia-dark" />
          <SmallCard accent="border-l-sepia-dark" />
          <SmallCard accent="border-l-sepia-dark" />
        </div>
      </section>
    </div>
  );
}
