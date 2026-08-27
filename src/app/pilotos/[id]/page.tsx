import { getDriverInfo, getDriverStandings, getDriverSeasonResults } from "@/lib/jolpica";
import { getConstructorColor } from "@/lib/constructor-colors";

export default async function PilotoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let loadError = false;
  let driver: Awaited<ReturnType<typeof getDriverInfo>> | null = null;
  let seasonResults: Awaited<ReturnType<typeof getDriverSeasonResults>> = [];
  let currentStanding: Awaited<ReturnType<typeof getDriverStandings>>[number] | null = null;

  try {
    const [driverInfo, standings, results] = await Promise.all([
      getDriverInfo(id),
      getDriverStandings(),
      getDriverSeasonResults("current", id),
    ]);
    driver = driverInfo;
    seasonResults = results;
    currentStanding = standings.find((s) => s.driver.id === id) ?? null;
  } catch {
    loadError = true;
  }

  if (loadError || !driver) {
    return <p className="text-muted">Não foi possível carregar o perfil deste piloto agora.</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      <section>
        <h1 className="text-2xl font-bold">
          {driver.givenName} {driver.familyName}
        </h1>
        <p className="text-muted">
          {driver.code}
          {driver.number ? ` · #${driver.number}` : ""} · {driver.nationality}
        </p>
        {currentStanding && (
          <p
            className="mt-2 inline-block rounded border-l-4 bg-surface px-3 py-1 text-sm"
            style={{ borderColor: getConstructorColor(currentStanding.constructorId) }}
          >
            {currentStanding.constructorName} · P{currentStanding.position} · {currentStanding.points} pts
          </p>
        )}
      </section>

      <section>
        <h2 className="mb-2 text-lg font-semibold">Resultados na temporada</h2>
        <table className="w-full border-collapse overflow-hidden rounded text-sm">
          <thead>
            <tr className="bg-surface text-left text-muted">
              <th className="px-3 py-2">Round</th>
              <th className="px-3 py-2">Corrida</th>
              <th className="px-3 py-2">Equipe</th>
              <th className="px-3 py-2">Pos.</th>
              <th className="px-3 py-2 text-right">Pontos</th>
            </tr>
          </thead>
          <tbody>
            {seasonResults.map((race) => (
              <tr key={race.round} className="border-l-4" style={{ borderColor: getConstructorColor(race.constructorId) }}>
                <td className="px-3 py-2">{race.round}</td>
                <td className="px-3 py-2">{race.raceName}</td>
                <td className="px-3 py-2 text-muted">{race.constructorName}</td>
                <td className="px-3 py-2">{race.position}</td>
                <td className="px-3 py-2 text-right font-semibold">{race.points}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
