import { SkeletonProfileHeader, SkeletonTableRows } from "@/components/Skeleton";

export default function Loading() {
  return (
    <div className="flex flex-col gap-6">
      <SkeletonProfileHeader extraLines={1} />

      <section>
        <h2 className="section-label mb-3">Resultados na temporada</h2>
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-line text-left">
              <th className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-muted">Round</th>
              <th className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-muted">Corrida</th>
              <th className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-muted">Piloto</th>
              <th className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-muted">Pos.</th>
              <th className="px-3 py-2 text-right text-xs font-bold uppercase tracking-wider text-muted">Pontos</th>
            </tr>
          </thead>
          <tbody>
            <SkeletonTableRows rows={8} columns={5} />
          </tbody>
        </table>
      </section>
    </div>
  );
}
