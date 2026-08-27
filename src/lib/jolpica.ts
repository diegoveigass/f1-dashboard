const JOLPICA_BASE_URL = "https://api.jolpi.ca/ergast/f1";

async function fetchJolpica<T>(path: string): Promise<T> {
  const res = await fetch(`${JOLPICA_BASE_URL}${path}`, {
    next: { revalidate: 3600 },
  });
  if (!res.ok) {
    throw new Error(`Jolpica request failed: ${res.status} ${path}`);
  }
  return res.json() as Promise<T>;
}

interface JolpicaDriver {
  driverId: string;
  permanentNumber?: string;
  code: string;
  givenName: string;
  familyName: string;
  nationality: string;
}

interface JolpicaConstructor {
  constructorId: string;
  name: string;
  nationality: string;
}

export interface DriverStanding {
  position: number;
  points: number;
  wins: number;
  driver: {
    id: string;
    code: string;
    number: number | null;
    givenName: string;
    familyName: string;
    nationality: string;
  };
  constructorId: string;
  constructorName: string;
}

interface RawDriverStandingsResponse {
  MRData: {
    StandingsTable: {
      StandingsLists: Array<{
        DriverStandings: Array<{
          position: string;
          points: string;
          wins: string;
          Driver: JolpicaDriver;
          Constructors: JolpicaConstructor[];
        }>;
      }>;
    };
  };
}

export async function getDriverStandings(season: string = "current"): Promise<DriverStanding[]> {
  const data = await fetchJolpica<RawDriverStandingsResponse>(`/${season}/driverStandings.json`);
  const list = data.MRData.StandingsTable.StandingsLists[0]?.DriverStandings ?? [];
  return list.map((entry) => ({
    position: Number(entry.position),
    points: Number(entry.points),
    wins: Number(entry.wins),
    driver: {
      id: entry.Driver.driverId,
      code: entry.Driver.code,
      number: entry.Driver.permanentNumber ? Number(entry.Driver.permanentNumber) : null,
      givenName: entry.Driver.givenName,
      familyName: entry.Driver.familyName,
      nationality: entry.Driver.nationality,
    },
    constructorId: entry.Constructors[0]?.constructorId ?? "",
    constructorName: entry.Constructors[0]?.name ?? "",
  }));
}

export interface ConstructorStanding {
  position: number;
  points: number;
  wins: number;
  constructorId: string;
  name: string;
  nationality: string;
}

interface RawConstructorStandingsResponse {
  MRData: {
    StandingsTable: {
      StandingsLists: Array<{
        ConstructorStandings: Array<{
          position: string;
          points: string;
          wins: string;
          Constructor: JolpicaConstructor;
        }>;
      }>;
    };
  };
}

export async function getConstructorStandings(season: string = "current"): Promise<ConstructorStanding[]> {
  const data = await fetchJolpica<RawConstructorStandingsResponse>(`/${season}/constructorStandings.json`);
  const list = data.MRData.StandingsTable.StandingsLists[0]?.ConstructorStandings ?? [];
  return list.map((entry) => ({
    position: Number(entry.position),
    points: Number(entry.points),
    wins: Number(entry.wins),
    constructorId: entry.Constructor.constructorId,
    name: entry.Constructor.name,
    nationality: entry.Constructor.nationality,
  }));
}

export interface RaceScheduleEntry {
  season: string;
  round: number;
  raceName: string;
  circuitName: string;
  locality: string;
  country: string;
  sessions: {
    fp1?: string;
    fp2?: string;
    fp3?: string;
    sprintQualifying?: string;
    sprint?: string;
    qualifying?: string;
    race: string;
  };
}

interface RawSessionTime {
  date: string;
  time: string;
}

interface RawRace {
  season: string;
  round: string;
  raceName: string;
  Circuit: {
    circuitName: string;
    Location: { locality: string; country: string };
  };
  date: string;
  time?: string;
  FirstPractice?: RawSessionTime;
  SecondPractice?: RawSessionTime;
  ThirdPractice?: RawSessionTime;
  Qualifying?: RawSessionTime;
  Sprint?: RawSessionTime;
  SprintQualifying?: RawSessionTime;
}

interface RawScheduleResponse {
  MRData: { RaceTable: { Races: RawRace[] } };
}

function toIso(session?: RawSessionTime): string | undefined {
  if (!session) return undefined;
  return `${session.date}T${session.time}`;
}

export async function getSeasonSchedule(season: string = "current"): Promise<RaceScheduleEntry[]> {
  const data = await fetchJolpica<RawScheduleResponse>(`/${season}.json`);
  return data.MRData.RaceTable.Races.map((race) => ({
    season: race.season,
    round: Number(race.round),
    raceName: race.raceName,
    circuitName: race.Circuit.circuitName,
    locality: race.Circuit.Location.locality,
    country: race.Circuit.Location.country,
    sessions: {
      fp1: toIso(race.FirstPractice),
      fp2: toIso(race.SecondPractice),
      fp3: toIso(race.ThirdPractice),
      sprintQualifying: toIso(race.SprintQualifying),
      sprint: toIso(race.Sprint),
      qualifying: toIso(race.Qualifying),
      race: race.time ? `${race.date}T${race.time}` : `${race.date}T00:00:00Z`,
    },
  }));
}
