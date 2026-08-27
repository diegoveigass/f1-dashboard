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

export interface SessionExtras {
  laps: Array<{ driverNumber: number; lapNumber: number; lapDurationSeconds: number | null; isPitOutLap: boolean }>;
  pitStops: Array<{ driverNumber: number; lapNumber: number; pitDurationSeconds: number }>;
  weather: Array<{ airTemp: number; trackTemp: number; humidity: number; rainfallMm: number; date: string }>;
}

interface RawLap {
  driver_number: number;
  lap_number: number;
  lap_duration: number | null;
  is_pit_out_lap: boolean;
}

interface RawPitStop {
  driver_number: number;
  lap_number: number;
  pit_duration: number;
  stop_duration: number | null;
}

interface RawWeather {
  air_temperature: number;
  track_temperature: number;
  humidity: number;
  rainfall: number;
  date: string;
}

export async function getSessionExtras(sessionKey: number): Promise<SessionExtras | null> {
  try {
    const [laps, pitStops, weather] = await Promise.all([
      fetchOpenF1<RawLap[]>(`/laps?session_key=${sessionKey}`),
      fetchOpenF1<RawPitStop[]>(`/pit?session_key=${sessionKey}`),
      fetchOpenF1<RawWeather[]>(`/weather?session_key=${sessionKey}`),
    ]);
    return {
      laps: laps.map((l) => ({
        driverNumber: l.driver_number,
        lapNumber: l.lap_number,
        lapDurationSeconds: l.lap_duration,
        isPitOutLap: l.is_pit_out_lap,
      })),
      pitStops: pitStops.map((p) => ({
        driverNumber: p.driver_number,
        lapNumber: p.lap_number,
        // stop_duration (stationary time) is the meaningful pit-stop number when
        // present; pit_duration (full pit-lane time) is the fallback.
        pitDurationSeconds: p.stop_duration ?? p.pit_duration,
      })),
      weather: weather.map((w) => ({
        airTemp: w.air_temperature,
        trackTemp: w.track_temperature,
        humidity: w.humidity,
        rainfallMm: w.rainfall,
        date: w.date,
      })),
    };
  } catch {
    return null;
  }
}

export async function findRaceSessionKey(season: string, raceDateIso: string): Promise<number | null> {
  try {
    const raw = await fetchOpenF1<RawSession[]>(`/sessions?year=${season}&session_name=Race`);
    const match = raw.find((session) => session.date_start.startsWith(raceDateIso));
    return match ? match.session_key : null;
  } catch {
    return null;
  }
}
