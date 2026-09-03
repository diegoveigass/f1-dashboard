import Link from "next/link";
import { getCircuits } from "@/lib/jolpica";

export default async function CircuitosPage() {
  let circuits: Awaited<ReturnType<typeof getCircuits>> = [];
  let loadError = false;

  try {
    circuits = await getCircuits();
  } catch {
    loadError = true;
  }

  if (loadError) {
    return <p className="text-muted">Não foi possível carregar os circuitos agora.</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="border-b-2 border-accent pb-4 text-3xl font-bold uppercase tracking-tight text-foreground">
        Circuitos
      </h1>
      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {circuits.map((circuit) => (
          <li key={circuit.id} className="border-l-4 border-line bg-surface p-4 transition-colors hover:bg-surface-raised">
            <Link
              href={`/circuitos/${circuit.id}`}
              className="text-lg font-bold hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
            >
              {circuit.name}
            </Link>
            <p className="text-sm text-muted">
              {circuit.locality}, {circuit.country}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
