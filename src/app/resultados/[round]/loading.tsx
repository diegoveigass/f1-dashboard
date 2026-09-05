import { SkeletonBlock, SkeletonTableRows } from "@/components/Skeleton";

export default function Loading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="border-b-2 border-accent pb-4">
        <SkeletonBlock className="h-3 w-24" />
        <SkeletonBlock className="mt-2 h-8 w-96 max-w-full" />
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="section-label">Resultado da corrida</h2>
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-line text-left">
              <th className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-muted">Pos.</th>
              <th className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-muted">Piloto</th>
              <th className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-muted">Equipe</th>
              <th className="px-3 py-2 text-center text-xs font-bold uppercase tracking-wider text-muted">Grid</th>
              <th className="px-3 py-2 text-center text-xs font-bold uppercase tracking-wider text-muted">+/-</th>
              <th className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-muted">Status</th>
              <th className="px-3 py-2 text-right text-xs font-bold uppercase tracking-wider text-muted">Pontos</th>
            </tr>
          </thead>
          <tbody>
            <SkeletonTableRows rows={20} columns={7} />
          </tbody>
        </table>
      </div>
    </div>
  );
}
