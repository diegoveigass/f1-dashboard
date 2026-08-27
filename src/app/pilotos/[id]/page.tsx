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

  const accent = currentStanding ? getConstructorColor(currentStanding.constructorId) : "var(--color-accent)";

  return (
    <div className="flex flex-col gap-6">
      <section className="border-b-2 pb-5" style={{ borderColor: accent }}>
        <p className="section-label mb-1">
          {driver.code}
          {driver.number ? ` · #${driver.number}` : ""}
        </p>
        <h1 className="text-3xl font-bold uppercase tracking-tight text-foreground">
          {driver.givenName} {driver.familyName}
        </h1>
        <p className="mt-1 text-muted">{driver.nationality}</p>
        {currentStanding && (
          <p
            className="mt-3 inline-flex items-center gap-2 border-l-4 bg-surface px-3 py-1.5 text-sm"
            style={{ borderColor: accent }}
          >
            <span className="font-semibold">{currentStanding.constructorName}</span>
            <span className="text-muted">·</span>
            <span className="tabular-nums">P{currentStanding.position}</span>
            <span className="text-muted">·</span>
            <span className="tabular-nums font-semibold">{currentStanding.points} pts</span>
          </p>
        )}
      </section>

      <section>
        <h2 className="section-label mb-3">Resultados na temporada</h2>
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-line text-left">
              <th className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-muted">Round</th>
              <th className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-muted">Corrida</th>
              <th className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-muted">Equipe</th>
              <th className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-muted">Pos.</th>
              <th className="px-3 py-2 text-right text-xs font-bold uppercase tracking-wider text-muted">Pontos</th>
            </tr>
          </thead>
          <tbody>
            {seasonResults.map((race) => (
              <tr
                key={race.round}
                className="border-l-4 bg-surface transition-colors hover:bg-surface-raised"
                style={{ borderColor: getConstructorColor(race.constructorId) }}
              >
                <td className="px-3 py-2.5 tabular-nums text-muted">{race.round}</td>
                <td className="px-3 py-2.5">{race.raceName}</td>
                <td className="px-3 py-2.5 text-muted">{race.constructorName}</td>
                <td className="px-3 py-2.5 tabular-nums">{race.position}</td>
                <td className="px-3 py-2.5 text-right tabular-nums font-semibold">{race.points}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
