import { getDriverStandings, getConstructorStandings, getSeasonSchedule, type RaceScheduleEntry } from "@/lib/jolpica";
import { getConstructorColor } from "@/lib/constructor-colors";

function findNextRace(schedule: RaceScheduleEntry[]): RaceScheduleEntry | null {
  const nowMs = Date.now();
  return schedule.find((race) => new Date(race.sessions.race).getTime() > nowMs) ?? null;
}

export default async function DashboardPage() {
  let drivers: Awaited<ReturnType<typeof getDriverStandings>> = [];
  let constructors: Awaited<ReturnType<typeof getConstructorStandings>> = [];
  let nextRace: RaceScheduleEntry | null = null;
  let loadError = false;

  try {
    const [driverStandings, constructorStandings, schedule] = await Promise.all([
      getDriverStandings(),
      getConstructorStandings(),
      getSeasonSchedule(),
    ]);
    drivers = driverStandings;
    constructors = constructorStandings;
    nextRace = findNextRace(schedule);
  } catch {
    loadError = true;
  }

  if (loadError) {
    return <p className="text-muted">Não foi possível carregar os dados do campeonato agora. Tente novamente em instantes.</p>;
  }

  return (
    <div className="flex flex-col gap-8">
      <section>
        <h1 className="text-2xl font-bold">Painel do Campeonato</h1>
        {nextRace ? (
          <p className="mt-1 text-muted">
            Próxima corrida: <strong>{nextRace.raceName}</strong> em{" "}
            {new Date(nextRace.sessions.race).toLocaleString("pt-BR", { dateStyle: "long", timeStyle: "short" })}
          </p>
        ) : (
          <p className="mt-1 text-muted">Nenhuma corrida futura agendada nesta temporada.</p>
        )}
      </section>

      <section>
        <h2 className="mb-2 text-lg font-semibold">Top 5 — Pilotos</h2>
        <ol className="flex flex-col gap-1">
          {drivers.slice(0, 5).map((standing) => (
            <li
              key={standing.driver.id}
              className="flex items-center justify-between rounded border-l-4 bg-surface px-3 py-2"
              style={{ borderColor: getConstructorColor(standing.constructorId) }}
            >
              <span>
                {standing.position}. {standing.driver.givenName} {standing.driver.familyName}
              </span>
              <span className="font-semibold">{standing.points} pts</span>
            </li>
          ))}
        </ol>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-semibold">Top 5 — Construtores</h2>
        <ol className="flex flex-col gap-1">
          {constructors.slice(0, 5).map((standing) => (
            <li
              key={standing.constructorId}
              className="flex items-center justify-between rounded border-l-4 bg-surface px-3 py-2"
              style={{ borderColor: getConstructorColor(standing.constructorId) }}
            >
              <span>
                {standing.position}. {standing.name}
              </span>
              <span className="font-semibold">{standing.points} pts</span>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
