import Link from "next/link";
import { getDriverStandings, getConstructorStandings } from "@/lib/jolpica";
import { getConstructorColor } from "@/lib/constructor-colors";

export default async function ClassificacaoPage() {
  let drivers: Awaited<ReturnType<typeof getDriverStandings>> = [];
  let constructors: Awaited<ReturnType<typeof getConstructorStandings>> = [];
  let loadError = false;

  try {
    [drivers, constructors] = await Promise.all([getDriverStandings(), getConstructorStandings()]);
  } catch {
    loadError = true;
  }

  if (loadError) {
    return <p className="text-muted">Não foi possível carregar a classificação agora.</p>;
  }

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
            {drivers.map((standing) => (
              <tr
                key={standing.driver.id}
                className="border-l-4 bg-surface transition-colors hover:bg-surface-raised"
                style={{ borderColor: getConstructorColor(standing.constructorId) }}
              >
                <td className="px-3 py-2.5 tabular-nums text-muted">{standing.position}</td>
                <td className="px-3 py-2.5">
                  <Link
                    href={`/pilotos/${standing.driver.id}`}
                    className="font-semibold hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
                  >
                    {standing.driver.givenName} {standing.driver.familyName}
                  </Link>
                </td>
                <td className="px-3 py-2.5 text-muted">{standing.constructorName}</td>
                <td className="px-3 py-2.5 text-right tabular-nums">{standing.wins}</td>
                <td className="px-3 py-2.5 text-right tabular-nums font-semibold">{standing.points}</td>
              </tr>
            ))}
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
            {constructors.map((standing) => (
              <tr
                key={standing.constructorId}
                className="border-l-4 bg-surface transition-colors hover:bg-surface-raised"
                style={{ borderColor: getConstructorColor(standing.constructorId) }}
              >
                <td className="px-3 py-2.5 tabular-nums text-muted">{standing.position}</td>
                <td className="px-3 py-2.5 font-semibold">{standing.name}</td>
                <td className="px-3 py-2.5 text-right tabular-nums">{standing.wins}</td>
                <td className="px-3 py-2.5 text-right tabular-nums font-semibold">{standing.points}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
