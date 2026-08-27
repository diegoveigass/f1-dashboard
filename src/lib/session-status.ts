import type { SessionInfo } from "./openf1";

export type LiveStatus = { active: true; session: SessionInfo } | { active: false; nextSession: SessionInfo | null };

export function getLiveStatus(sessions: SessionInfo[], now: Date): LiveStatus {
  const nowMs = now.getTime();

  const active = sessions.find((session) => {
    const start = new Date(session.dateStart).getTime();
    const end = new Date(session.dateEnd).getTime();
    return nowMs >= start && nowMs <= end;
  });

  if (active) {
    return { active: true, session: active };
  }

  const upcoming = sessions
    .filter((session) => new Date(session.dateStart).getTime() > nowMs)
    .sort((a, b) => new Date(a.dateStart).getTime() - new Date(b.dateStart).getTime());

  return { active: false, nextSession: upcoming[0] ?? null };
}
