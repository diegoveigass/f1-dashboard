const OPENF1_BASE_URL = "https://api.openf1.org/v1";

async function fetchOpenF1<T>(path: string): Promise<T> {
  const res = await fetch(`${OPENF1_BASE_URL}${path}`, {
    next: { revalidate: 60 },
  });
  if (!res.ok) {
    throw new Error(`OpenF1 request failed: ${res.status} ${path}`);
  }
  return res.json() as Promise<T>;
}

export interface SessionInfo {
  sessionKey: number;
  meetingKey: number;
  sessionName: string;
  sessionType: string;
  dateStart: string;
  dateEnd: string;
  location: string;
  countryName: string;
}

interface RawSession {
  session_key: number;
  meeting_key: number;
  session_name: string;
  session_type: string;
  date_start: string;
  date_end: string;
  location: string;
  country_name: string;
}

function mapSession(session: RawSession): SessionInfo {
  return {
    sessionKey: session.session_key,
    meetingKey: session.meeting_key,
    sessionName: session.session_name,
    sessionType: session.session_type,
    dateStart: session.date_start,
    dateEnd: session.date_end,
    location: session.location,
    countryName: session.country_name,
  };
}

/**
 * Returns sessions from the last 6 hours (to catch one currently in progress)
 * through the rest of the season. OpenF1 does not support a `limit` param —
 * passing one returns `{"detail":"No results found."}` instead of an error.
 */
export async function getUpcomingSessions(): Promise<SessionInfo[]> {
  const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString().split(".")[0] + "Z";
  const raw = await fetchOpenF1<RawSession[]>(`/sessions?date_start%3E${encodeURIComponent(sixHoursAgo)}`);
  return raw.map(mapSession).sort((a, b) => a.dateStart.localeCompare(b.dateStart));
}
