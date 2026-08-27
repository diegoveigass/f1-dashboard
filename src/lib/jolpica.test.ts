import { describe, it, expect, vi, afterEach } from "vitest";
import { getDriverStandings, getConstructorStandings } from "./jolpica";
import { getSeasonSchedule } from "./jolpica";

function mockFetchOnce(body: unknown, ok = true, status = 200) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok,
      status,
      json: async () => body,
    })
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("getDriverStandings", () => {
  it("maps raw Jolpica driver standings into DriverStanding[]", async () => {
    mockFetchOnce({
      MRData: {
        StandingsTable: {
          StandingsLists: [
            {
              DriverStandings: [
                {
                  position: "1",
                  points: "242",
                  wins: "6",
                  Driver: {
                    driverId: "antonelli",
                    permanentNumber: "12",
                    code: "ANT",
                    givenName: "Andrea Kimi",
                    familyName: "Antonelli",
                    nationality: "Italian",
                  },
                  Constructors: [
                    { constructorId: "mercedes", name: "Mercedes", nationality: "German" },
                  ],
                },
              ],
            },
          ],
        },
      },
    });

    const result = await getDriverStandings("2026");

    expect(result).toEqual([
      {
        position: 1,
        points: 242,
        wins: 6,
        driver: {
          id: "antonelli",
          code: "ANT",
          number: 12,
          givenName: "Andrea Kimi",
          familyName: "Antonelli",
          nationality: "Italian",
        },
        constructorId: "mercedes",
        constructorName: "Mercedes",
      },
    ]);
  });

  it("throws a descriptive error when the upstream request fails", async () => {
    mockFetchOnce(undefined, false, 503);
    await expect(getDriverStandings("2026")).rejects.toThrow("Jolpica request failed: 503");
  });
});

describe("getConstructorStandings", () => {
  it("maps raw Jolpica constructor standings into ConstructorStanding[]", async () => {
    mockFetchOnce({
      MRData: {
        StandingsTable: {
          StandingsLists: [
            {
              ConstructorStandings: [
                {
                  position: "1",
                  points: "425",
                  wins: "8",
                  Constructor: { constructorId: "mercedes", name: "Mercedes", nationality: "German" },
                },
              ],
            },
          ],
        },
      },
    });

    const result = await getConstructorStandings("2026");

    expect(result).toEqual([
      { position: 1, points: 425, wins: 8, constructorId: "mercedes", name: "Mercedes", nationality: "German" },
    ]);
  });
});

describe("getSeasonSchedule", () => {
  it("maps raw races into RaceScheduleEntry[], combining date+time into ISO strings", async () => {
    mockFetchOnce({
      MRData: {
        RaceTable: {
          Races: [
            {
              season: "2026",
              round: "2",
              raceName: "Chinese Grand Prix",
              Circuit: {
                circuitName: "Shanghai International Circuit",
                Location: { locality: "Shanghai", country: "China" },
              },
              date: "2026-03-15",
              time: "07:00:00Z",
              FirstPractice: { date: "2026-03-13", time: "03:30:00Z" },
              Qualifying: { date: "2026-03-14", time: "07:00:00Z" },
              Sprint: { date: "2026-03-14", time: "03:00:00Z" },
              SprintQualifying: { date: "2026-03-13", time: "07:30:00Z" },
            },
          ],
        },
      },
    });

    const result = await getSeasonSchedule("2026");

    expect(result).toEqual([
      {
        season: "2026",
        round: 2,
        raceName: "Chinese Grand Prix",
        circuitName: "Shanghai International Circuit",
        locality: "Shanghai",
        country: "China",
        sessions: {
          fp1: "2026-03-13T03:30:00Z",
          fp2: undefined,
          fp3: undefined,
          sprintQualifying: "2026-03-13T07:30:00Z",
          sprint: "2026-03-14T03:00:00Z",
          qualifying: "2026-03-14T07:00:00Z",
          race: "2026-03-15T07:00:00Z",
        },
      },
    ]);
  });
});
