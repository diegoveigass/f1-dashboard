import Link from "next/link";
import { getCircuitInfo, getSeasonSchedule } from "@/lib/jolpica";

export default async function CircuitoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let loadError = false;
  let circuit: Awaited<ReturnType<typeof getCircuitInfo>> | null = null;
  let schedule: Awaited<ReturnType<typeof getSeasonSchedule>> = [];

  try {
    const [circuitInfo, seasonSchedule] = await Promise.all([getCircuitInfo(id), getSeasonSchedule()]);
    circuit = circuitInfo;
    schedule = seasonSchedule;
  } catch {
    loadError = true;
  }

  if (loadError || !circuit) {
    return <p className="text-muted">Não foi possível carregar este circuito agora.</p>;
  }

  const raceThisSeason = schedule.find((race) => race.circuitId === circuit.id);
  const mapsUrl = `https://www.google.com/maps?q=${circuit.lat},${circuit.long}`;

  return (
    <div className="flex flex-col gap-6">
      <section className="border-b-2 border-accent pb-5">
        <p className="section-label mb-1">
          {circuit.locality}, {circuit.country}
        </p>
        <h1 className="text-3xl font-bold uppercase tracking-tight text-foreground">{circuit.name}</h1>
      </section>

      <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {raceThisSeason && (
          <div className="border-l-4 border-accent bg-surface p-4 text-sm">
            <dt className="section-label mb-1">Nesta temporada</dt>
            <dd>
              <Link
                href={`/resultados/${raceThisSeason.round}`}
                className="font-semibold hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
              >
                Round {String(raceThisSeason.round).padStart(2, "0")} — {raceThisSeason.raceName}
              </Link>
            </dd>
          </div>
        )}
        <div className="border-l-4 border-line bg-surface p-4 text-sm">
          <dt className="section-label mb-1">Localização</dt>
          <dd className="tabular-nums text-muted">
            {circuit.lat.toFixed(4)}, {circuit.long.toFixed(4)}
          </dd>
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-block font-semibold hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
          >
            Ver no mapa ↗
          </a>
        </div>
        <div className="border-l-4 border-line bg-surface p-4 text-sm sm:col-span-2">
          <dt className="section-label mb-1">Wikipedia</dt>
          <dd>
            <a
              href={circuit.wikipediaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
            >
              {circuit.name} ↗
            </a>
          </dd>
        </div>
      </dl>
    </div>
  );
}
