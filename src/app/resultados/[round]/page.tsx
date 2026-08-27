import { getRaceResults } from "@/lib/jolpica";
import { findRaceSessionKey, getSessionExtras } from "@/lib/openf1";
import { getConstructorColor } from "@/lib/constructor-colors";

export default async function ResultadosPage({ params }: { params: Promise<{ round: string }> }) {
  const { round } = await params;

  let result: Awaited<ReturnType<typeof getRaceResults>> | null = null;
  let loadError = false;
  try {
    result = await getRaceResults("current", round);
  } catch {
    loadError = true;
  }

  if (loadError || !result) {
    return <p className="text-muted">Não foi possível carregar o resultado desta corrida agora.</p>;
  }

  // OpenF1 enrichment is optional — silently omitted if the session can't be found
  // or its data isn't available yet (e.g. still inside the live-only window).
  const sessionKey = await findRaceSessionKey(result.season, result.date);
  const extras = sessionKey ? await getSessionExtras(sessionKey) : null;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">
        Round {result.round} — {result.raceName}
      </h1>

      <table className="w-full border-collapse overflow-hidden rounded text-sm">
        <thead>
          <tr className="bg-surface text-left text-muted">
            <th className="px-3 py-2">Pos.</th>
            <th className="px-3 py-2">Piloto</th>
            <th className="px-3 py-2">Equipe</th>
            <th className="px-3 py-2">Status</th>
            <th className="px-3 py-2 text-right">Pontos</th>
          </tr>
        </thead>
        <tbody>
          {result.results.map((entry) => (
            <tr
              key={entry.driver.id}
              className="border-l-4"
              style={{ borderColor: getConstructorColor(entry.constructorId) }}
            >
              <td className="px-3 py-2">{entry.position}</td>
              <td className="px-3 py-2">
                {entry.driver.givenName} {entry.driver.familyName}
              </td>
              <td className="px-3 py-2 text-muted">{entry.constructorName}</td>
              <td className="px-3 py-2 text-muted">{entry.status}</td>
              <td className="px-3 py-2 text-right font-semibold">{entry.points}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {extras && extras.weather.length > 0 && (
        <section className="rounded bg-surface p-4 text-sm">
          <h2 className="mb-2 font-semibold">Clima na corrida</h2>
          <p className="text-muted">
            Ar: {extras.weather[0].airTemp}°C · Pista: {extras.weather[0].trackTemp}°C · Umidade:{" "}
            {extras.weather[0].humidity}% · Chuva: {extras.weather[0].rainfallMm}mm
          </p>
        </section>
      )}

      {extras && extras.pitStops.length > 0 && (
        <section className="rounded bg-surface p-4 text-sm">
          <h2 className="mb-2 font-semibold">Pit stops</h2>
          <ul className="flex flex-col gap-1 text-muted">
            {extras.pitStops.map((stop, index) => (
              <li key={index}>
                Carro #{stop.driverNumber} — volta {stop.lapNumber} — {stop.pitDurationSeconds.toFixed(1)}s
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
