"use client";

import { useEffect, useState } from "react";
import { getLiveStatus, type LiveStatus } from "@/lib/session-status";
import type { SessionInfo } from "@/lib/openf1";

const SESSION_LABELS: Record<string, string> = {
  Practice: "Treino Livre",
  Qualifying: "Classificação",
  Sprint: "Sprint",
  "Sprint Qualifying": "Classificação Sprint",
  Race: "Corrida",
};

function sessionLabel(session: SessionInfo): string {
  return SESSION_LABELS[session.sessionName] ?? SESSION_LABELS[session.sessionType] ?? session.sessionName;
}

function formatCountdown(targetIso: string, now: Date): string {
  const diffMs = new Date(targetIso).getTime() - now.getTime();
  if (diffMs <= 0) return "agora";
  const totalMinutes = Math.floor(diffMs / 60_000);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}min`;
  return `${minutes}min`;
}

export function LiveStatusBanner({ sessions }: { sessions: SessionInfo[] }) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(interval);
  }, []);

  const status: LiveStatus = getLiveStatus(sessions, now);

  if (status.active) {
    return (
      <div className="rounded border border-accent bg-surface p-4">
        <p className="font-semibold text-accent">{sessionLabel(status.session)} em andamento agora</p>
        <p className="mt-1 text-sm text-muted">
          Ao vivo indisponível nesta versão — dados chegam ~30min após o fim da sessão.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded border border-surface bg-surface p-4">
      <p className="font-semibold">Sem sessão ao vivo no momento</p>
      <p className="mt-1 text-sm text-muted">
        {status.nextSession
          ? `Próxima: ${sessionLabel(status.nextSession)} em ${formatCountdown(status.nextSession.dateStart, now)}`
          : "Nenhuma sessão futura agendada."}
      </p>
    </div>
  );
}
