import { getUpcomingSessions } from "@/lib/openf1";
import { LiveStatusBanner } from "@/components/LiveStatusBanner";

export default async function AoVivoPage() {
  let sessions: Awaited<ReturnType<typeof getUpcomingSessions>> = [];
  let loadError = false;
  try {
    sessions = await getUpcomingSessions();
  } catch {
    loadError = true;
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">Ao Vivo</h1>
      {loadError ? (
        <p className="text-muted">Não foi possível carregar a agenda de sessões agora.</p>
      ) : (
        <LiveStatusBanner sessions={sessions} />
      )}
    </div>
  );
}
