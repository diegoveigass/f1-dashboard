import { SkeletonBlock, SkeletonListRows } from "@/components/Skeleton";

export default function Loading() {
  return (
    <div className="flex flex-col gap-10">
      <section className="border-b-2 border-accent pb-5">
        <div className="mb-3 flex gap-1.5" aria-hidden="true">
          {Array.from({ length: 5 }).map((_, i) => (
            <span key={i} className="h-2.5 w-2.5 rounded-full bg-accent" />
          ))}
        </div>
        <h1 className="text-3xl font-bold uppercase tracking-tight text-foreground">Painel do Campeonato</h1>
        <SkeletonBlock className="mt-2 h-5 w-80 max-w-full" />
      </section>

      <section>
        <h2 className="section-label mb-3">Top 5 — Pilotos</h2>
        <ol className="flex flex-col gap-1">
          <SkeletonListRows count={5} />
        </ol>
      </section>

      <section>
        <h2 className="section-label mb-3">Top 5 — Construtores</h2>
        <ol className="flex flex-col gap-1">
          <SkeletonListRows count={5} />
        </ol>
      </section>
    </div>
  );
}
