import { SkeletonTableRows } from "@/components/Skeleton";

export default function Loading() {
  return (
    <div className="flex flex-col gap-10">
      <h1 className="border-b-2 border-accent pb-4 text-3xl font-bold uppercase tracking-tight text-foreground">
        Classificação
      </h1>

      <section>
        <h2 className="section-label mb-3">Pilotos</h2>
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-line text-left">
              <th className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-muted">#</th>
              <th className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-muted">Piloto</th>
              <th className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-muted">Equipe</th>
              <th className="px-3 py-2 text-right text-xs font-bold uppercase tracking-wider text-muted">Vitórias</th>
              <th className="px-3 py-2 text-right text-xs font-bold uppercase tracking-wider text-muted">Pontos</th>
            </tr>
          </thead>
          <tbody>
            <SkeletonTableRows rows={20} columns={5} />
          </tbody>
        </table>
      </section>

      <section>
        <h2 className="section-label mb-3">Construtores</h2>
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-line text-left">
              <th className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-muted">#</th>
              <th className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-muted">Equipe</th>
              <th className="px-3 py-2 text-right text-xs font-bold uppercase tracking-wider text-muted">Vitórias</th>
              <th className="px-3 py-2 text-right text-xs font-bold uppercase tracking-wider text-muted">Pontos</th>
            </tr>
          </thead>
          <tbody>
            <SkeletonTableRows rows={10} columns={4} />
          </tbody>
        </table>
      </section>
    </div>
  );
}
