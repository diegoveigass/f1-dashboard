import Link from "next/link";
import { getConstructorInfo, getConstructorStandings, getConstructorSeasonResults } from "@/lib/jolpica";
import { getConstructorColor } from "@/lib/constructor-colors";

export default async function ConstrutorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let loadError = false;
  let constructor: Awaited<ReturnType<typeof getConstructorInfo>> | null = null;
  let seasonResults: Awaited<ReturnType<typeof getConstructorSeasonResults>> = [];
  let currentStanding: Awaited<ReturnType<typeof getConstructorStandings>>[number] | null = null;

  try {
    const [constructorInfo, standings, results] = await Promise.all([
      getConstructorInfo(id),
      getConstructorStandings(),
      getConstructorSeasonResults("current", id),
    ]);
    constructor = constructorInfo;
    seasonResults = results;
    currentStanding = standings.find((s) => s.constructorId === id) ?? null;
  } catch {
    loadError = true;
  }

  if (loadError || !constructor) {
    return <p className="text-muted">Não foi possível carregar o perfil desta equipe agora.</p>;
  }

  const accent = getConstructorColor(constructor.id);

  return (
    <div className="flex flex-col gap-6">
      <section className="border-b-2 pb-5" style={{ borderColor: accent }}>
        <p className="section-label mb-1">{constructor.nationality}</p>
        <h1 className="text-3xl font-bold uppercase tracking-tight text-foreground">{constructor.name}</h1>
        {currentStanding && (
          <p
            className="mt-3 inline-flex items-center gap-2 border-l-4 bg-surface px-3 py-1.5 text-sm"
            style={{ borderColor: accent }}
          >
            <span className="tabular-nums">P{currentStanding.position}</span>
            <span className="text-muted">·</span>
            <span className="tabular-nums font-semibold">{currentStanding.points} pts</span>
            <span className="text-muted">·</span>
            <span className="tabular-nums">{currentStanding.wins} vitórias</span>
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
              <th className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-muted">Piloto</th>
              <th className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-muted">Pos.</th>
              <th className="px-3 py-2 text-right text-xs font-bold uppercase tracking-wider text-muted">Pontos</th>
            </tr>
          </thead>
          <tbody>
            {seasonResults.flatMap((race) =>
              race.drivers.map((driver) => (
                <tr
                  key={`${race.round}-${driver.driverId}`}
                  className="border-l-4 bg-surface transition-colors hover:bg-surface-raised"
                  style={{ borderColor: accent }}
                >
                  <td className="px-3 py-2.5 tabular-nums text-muted">{race.round}</td>
                  <td className="px-3 py-2.5">{race.raceName}</td>
                  <td className="px-3 py-2.5">
                    <Link
                      href={`/pilotos/${driver.driverId}`}
                      className="font-semibold hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
                    >
                      {driver.givenName} {driver.familyName}
                    </Link>
                  </td>
                  <td className="px-3 py-2.5 tabular-nums">{driver.position}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums font-semibold">{driver.points}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
