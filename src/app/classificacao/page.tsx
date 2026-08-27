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
      <h1 className="text-2xl font-bold">Classificação</h1>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Pilotos</h2>
        <table className="w-full border-collapse overflow-hidden rounded text-sm">
          <thead>
            <tr className="bg-surface text-left text-muted">
              <th className="px-3 py-2">#</th>
              <th className="px-3 py-2">Piloto</th>
              <th className="px-3 py-2">Equipe</th>
              <th className="px-3 py-2 text-right">Vitórias</th>
              <th className="px-3 py-2 text-right">Pontos</th>
            </tr>
          </thead>
          <tbody>
            {drivers.map((standing) => (
              <tr
                key={standing.driver.id}
                className="border-l-4"
                style={{ borderColor: getConstructorColor(standing.constructorId) }}
              >
                <td className="px-3 py-2">{standing.position}</td>
                <td className="px-3 py-2">
                  <Link href={`/pilotos/${standing.driver.id}`} className="hover:text-accent">
                    {standing.driver.givenName} {standing.driver.familyName}
                  </Link>
                </td>
                <td className="px-3 py-2 text-muted">{standing.constructorName}</td>
                <td className="px-3 py-2 text-right">{standing.wins}</td>
                <td className="px-3 py-2 text-right font-semibold">{standing.points}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Construtores</h2>
        <table className="w-full border-collapse overflow-hidden rounded text-sm">
          <thead>
            <tr className="bg-surface text-left text-muted">
              <th className="px-3 py-2">#</th>
              <th className="px-3 py-2">Equipe</th>
              <th className="px-3 py-2 text-right">Vitórias</th>
              <th className="px-3 py-2 text-right">Pontos</th>
            </tr>
          </thead>
          <tbody>
            {constructors.map((standing) => (
              <tr
                key={standing.constructorId}
                className="border-l-4"
                style={{ borderColor: getConstructorColor(standing.constructorId) }}
              >
                <td className="px-3 py-2">{standing.position}</td>
                <td className="px-3 py-2">{standing.name}</td>
                <td className="px-3 py-2 text-right">{standing.wins}</td>
                <td className="px-3 py-2 text-right font-semibold">{standing.points}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
