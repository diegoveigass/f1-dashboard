# F1 Dashboard MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **Note for this environment:** if `superpowers:subagent-driven-development` / `superpowers:executing-plans` are not installed as skills here, execute tasks in order manually, one at a time, following the same discipline: write the test, watch it fail, implement, watch it pass, commit, then move to the next task.

**Goal:** Ship a publishable Next.js F1 dashboard (standings, calendar, race results, driver profiles) sourced from free APIs, with a "Ao Vivo" tab that is designed but intentionally locked in this phase.

**Architecture:** Next.js (App Router, TypeScript) with Server Components fetching data directly from `lib/jolpica.ts` (Jolpica-F1, primary source) and `lib/openf1.ts` (OpenF1 free/historical tier, optional enrichment + session schedule for the live-tab lock). No database, no internal API route layer — see "Architecture correction" below. Deployed to Vercel from a GitHub repo.

**Tech Stack:** Next.js 15+ (App Router), TypeScript, Tailwind CSS v4, Vitest for unit tests, `next/font/google` (Titillium Web).

## Architecture correction vs. the approved spec

The spec (`docs/superpowers/specs/2026-08-26-f1-dashboard-design.md`, §3) called for
Next.js API routes (`/app/api/...`) acting as a backend-for-frontend, specifically to
avoid a CORS risk. While verifying the APIs for this plan, that risk turned out not to
apply: Server Components fetch data on the server (Vercel's server, not the visitor's
browser), so CORS — a browser-only restriction — never comes into play on that path. Adding
a separate internal API layer would only be extra files with no benefit for this MVP
(there's no client-side polling to serve — the live tab is locked and the countdown timer
ticks client-side off data already fetched by the page).

**Simplification adopted:** pages call `lib/jolpica.ts` / `lib/openf1.ts` functions
directly. Caching still happens exactly as designed, via `fetch`'s `next.revalidate`
option, just invoked from the page instead of from a route handler. If phase 2 (real
live data) introduces client-side polling, that is the point to add a route handler —
not before. The spec's §3/§11 will be updated to reflect this as part of Task 1.

## Global Constraints

- No API keys / secrets required — both Jolpica and OpenF1 free tiers are unauthenticated. Do not add environment variables that aren't used.
- No database. Every data-fetching function hits the upstream API (through Next.js's fetch cache) — never invent a local persistence layer.
- OpenF1 usage must stay within the free tier: only endpoints/fields documented as historical/metadata (`/sessions`, `/laps`, `/pit`, `/weather`), never anything requiring the paid Sponsor tier. Do not pass a `limit` query param to OpenF1 — it is not a supported parameter and silently returns `{"detail":"No results found."}`.
- Every OpenF1-sourced enrichment must degrade gracefully to "not shown" on failure — never throw and break a page for optional data (spec §7).
- Season is hardcoded to `"current"` (Jolpica's built-in alias) throughout the MVP UI — no season switcher in scope.
- Portuguese (pt-BR) is the UI language for all user-facing strings, consistent with the spec and this conversation.
- Test scope per spec §10: unit tests cover `src/lib/*.ts` only (pure functions / data parsing). Pages and components are verified manually (`npm run dev` + `npm run build`), not unit tested.

---

## Task 1: Project scaffolding + spec correction

**Files:**
- Create: whole Next.js project (via `create-next-app`) at repo root
- Create: `vitest.config.ts`
- Modify: `docs/superpowers/specs/2026-08-26-f1-dashboard-design.md` (§3 and §11 — record the architecture correction above)
- Modify: `package.json` (add `test` script)

**Interfaces:**
- Produces: a working Next.js + TypeScript + Tailwind v4 project, an `npm test` command wired to Vitest, and `@/*` import alias pointing at `src/*`.

This is a scaffolding task — there is no failing test to write first.

- [ ] **Step 1: Scaffold the app**

Run from the repo root (the existing `.git` and `docs/` must survive — answer "no" if asked to overwrite):

```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --no-turbopack
```

- [ ] **Step 2: Install Vitest**

```bash
npm install -D vitest @vitest/coverage-v8
```

- [ ] **Step 3: Add Vitest config**

Create `vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

- [ ] **Step 4: Add the test script**

In `package.json`, inside `"scripts"`, add:

```json
"test": "vitest run"
```

- [ ] **Step 5: Verify the toolchain**

```bash
npm run build
```

Expected: build succeeds (default Next.js starter page).

```bash
npm test
```

Expected: `No test files found` (not an error — there are no `*.test.ts` files yet). This confirms Vitest is wired correctly before Task 3 adds real tests.

- [ ] **Step 6: Record the architecture correction in the spec**

In `docs/superpowers/specs/2026-08-26-f1-dashboard-design.md`, replace the bullet list under `## 3. Arquitetura` that starts with `- **Sem banco de dados.**` by inserting this note immediately after that section's existing content (do not delete the existing bullets — append):

```markdown
> **Nota de implementação (ver plano):** durante o planejamento, descobrimos que Server
> Components do Next.js buscam dados no servidor (não no navegador do visitante), então o
> risco de CORS que motivou a camada de rotas `/app/api/...` não se aplica a esse caminho.
> O MVP chama `lib/jolpica.ts`/`lib/openf1.ts` diretamente das páginas (Server Components),
> sem uma camada de API interna — o cache via `fetch`/`revalidate` continua exatamente como
> descrito acima. Uma camada de rota só voltará a fazer sentido se uma fase futura precisar
> de polling client-side (ex.: dado ao vivo real).
```

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "chore: scaffold Next.js app with Tailwind and Vitest

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 2: Dark theme tokens, Titillium Web font, base layout

**Files:**
- Modify: `src/app/globals.css`
- Modify: `src/app/layout.tsx`

**Interfaces:**
- Produces: Tailwind utility classes `bg-background`, `text-foreground`, `bg-surface`, `text-accent`, `border-accent`, `text-muted`, `border-surface` usable by every later page/component; the `font-sans` utility resolves to Titillium Web.

No unit test for this task (pure styling/config) — verified via build.

- [ ] **Step 1: Replace `src/app/globals.css`**

```css
@import "tailwindcss";

@theme {
  --font-sans: var(--font-titillium), system-ui, sans-serif;
  --color-background: #0a0a0a;
  --color-foreground: #f2f2f2;
  --color-surface: #17181c;
  --color-accent: #e10600;
  --color-muted: #9ca3af;
}

body {
  background-color: var(--color-background);
  color: var(--color-foreground);
}
```

- [ ] **Step 2: Replace `src/app/layout.tsx`**

```tsx
import type { Metadata } from "next";
import { Titillium_Web } from "next/font/google";
import "./globals.css";

const titillium = Titillium_Web({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-titillium",
});

export const metadata: Metadata = {
  title: "F1 Dashboard",
  description: "Classificação, calendário e resultados de Fórmula 1",
  manifest: "/manifest.webmanifest",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className={titillium.variable}>
      <body className="min-h-screen bg-background font-sans text-foreground">
        <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
```

- [ ] **Step 3: Verify**

```bash
npm run build
```

Expected: build succeeds with no CSS/theme errors.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: dark theme tokens and Titillium Web font

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 3: Constructor color map

**Files:**
- Create: `src/lib/constructor-colors.ts`
- Test: `src/lib/constructor-colors.test.ts`

**Interfaces:**
- Produces: `getConstructorColor(constructorId: string): string` — used by every page that renders a constructor/driver row (Tasks 11, 12, 14, 15).

- [ ] **Step 1: Write the failing test**

Create `src/lib/constructor-colors.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { getConstructorColor } from "./constructor-colors";

describe("getConstructorColor", () => {
  it("returns the known hex color for a current-grid constructor", () => {
    expect(getConstructorColor("ferrari")).toBe("#E8002D");
    expect(getConstructorColor("mercedes")).toBe("#27F4D2");
  });

  it("returns a neutral fallback color for an unknown constructorId", () => {
    expect(getConstructorColor("some_future_team")).toBe("#9CA3AF");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- constructor-colors
```

Expected: FAIL — `Cannot find module './constructor-colors'`.

- [ ] **Step 3: Implement**

Create `src/lib/constructor-colors.ts`. Constructor ids verified live against `https://api.jolpi.ca/ergast/f1/2026/constructors.json` (11 teams on the 2026 grid, including Audi and Cadillac as new entrants):

```ts
const CONSTRUCTOR_COLORS: Record<string, string> = {
  alpine: "#00A1E8",
  aston_martin: "#00665E",
  audi: "#00302B",
  cadillac: "#8B2635",
  ferrari: "#E8002D",
  haas: "#B6BABD",
  mclaren: "#FF8000",
  mercedes: "#27F4D2",
  rb: "#6692FF",
  red_bull: "#3671C6",
  williams: "#1868DB",
};

const FALLBACK_COLOR = "#9CA3AF";

export function getConstructorColor(constructorId: string): string {
  return CONSTRUCTOR_COLORS[constructorId] ?? FALLBACK_COLOR;
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm test -- constructor-colors
```

Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/constructor-colors.ts src/lib/constructor-colors.test.ts
git commit -m "feat: constructor color map for 2026 grid

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 4: Jolpica client — standings

**Files:**
- Create: `src/lib/jolpica.ts`
- Test: `src/lib/jolpica.test.ts`

**Interfaces:**
- Produces: `DriverStanding`, `ConstructorStanding` types; `getDriverStandings(season?: string): Promise<DriverStanding[]>`; `getConstructorStandings(season?: string): Promise<ConstructorStanding[]>`. Used by Tasks 11, 12, 15.
- Consumes: global `fetch` (mocked in tests via `vi.stubGlobal`).

- [ ] **Step 1: Write the failing test**

Create `src/lib/jolpica.test.ts`:

```ts
import { describe, it, expect, vi, afterEach } from "vitest";
import { getDriverStandings, getConstructorStandings } from "./jolpica";

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
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- jolpica
```

Expected: FAIL — `Cannot find module './jolpica'`.

- [ ] **Step 3: Implement**

Create `src/lib/jolpica.ts`:

```ts
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
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm test -- jolpica
```

Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/jolpica.ts src/lib/jolpica.test.ts
git commit -m "feat: Jolpica client for driver and constructor standings

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 5: Jolpica client — season schedule

**Files:**
- Modify: `src/lib/jolpica.ts` (append)
- Modify: `src/lib/jolpica.test.ts` (append)

**Interfaces:**
- Produces: `RaceScheduleEntry` type; `getSeasonSchedule(season?: string): Promise<RaceScheduleEntry[]>`. Used by Tasks 11, 13, 16.

- [ ] **Step 1: Write the failing test**

Append to `src/lib/jolpica.test.ts`:

```ts
import { getSeasonSchedule } from "./jolpica";

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
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- jolpica
```

Expected: FAIL — `getSeasonSchedule is not a function`.

- [ ] **Step 3: Implement**

Append to `src/lib/jolpica.ts`:

```ts
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
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm test -- jolpica
```

Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/jolpica.ts src/lib/jolpica.test.ts
git commit -m "feat: Jolpica client for season schedule

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 6: Jolpica client — race results and driver profile data

**Files:**
- Modify: `src/lib/jolpica.ts` (append)
- Modify: `src/lib/jolpica.test.ts` (append)

**Interfaces:**
- Produces: `RaceResult`, `RaceResultEntry`, `DriverInfo`, `DriverRaceSummary` types; `getRaceResults(season: string, round: string | number): Promise<RaceResult>`; `getDriverInfo(driverId: string): Promise<DriverInfo>`; `getDriverSeasonResults(season: string, driverId: string): Promise<DriverRaceSummary[]>`. Used by Tasks 14, 15.

- [ ] **Step 1: Write the failing test**

Append to `src/lib/jolpica.test.ts`:

```ts
import { getRaceResults, getDriverInfo, getDriverSeasonResults } from "./jolpica";

describe("getRaceResults", () => {
  it("maps raw race results into RaceResult", async () => {
    mockFetchOnce({
      MRData: {
        RaceTable: {
          season: "2026",
          round: "1",
          Races: [
            {
              raceName: "Australian Grand Prix",
              Results: [
                {
                  position: "1",
                  points: "25",
                  status: "Finished",
                  Driver: { driverId: "russell", code: "RUS", givenName: "George", familyName: "Russell" },
                  Constructor: { constructorId: "mercedes", name: "Mercedes" },
                  Time: { time: "1:23:06.801" },
                  FastestLap: { rank: "6" },
                },
              ],
            },
          ],
        },
      },
    });

    const result = await getRaceResults("2026", 1);

    expect(result).toEqual({
      season: "2026",
      round: 1,
      raceName: "Australian Grand Prix",
      results: [
        {
          position: 1,
          status: "Finished",
          points: 25,
          driver: { id: "russell", code: "RUS", givenName: "George", familyName: "Russell" },
          constructorId: "mercedes",
          constructorName: "Mercedes",
          time: "1:23:06.801",
          fastestLapRank: 6,
        },
      ],
    });
  });

  it("throws when the round has no race data", async () => {
    mockFetchOnce({ MRData: { RaceTable: { season: "2026", round: "99", Races: [] } } });
    await expect(getRaceResults("2026", 99)).rejects.toThrow("No results found for 2026 round 99");
  });
});

describe("getDriverInfo", () => {
  it("maps raw driver info into DriverInfo", async () => {
    mockFetchOnce({
      MRData: {
        DriverTable: {
          Drivers: [
            {
              driverId: "norris",
              permanentNumber: "4",
              code: "NOR",
              givenName: "Lando",
              familyName: "Norris",
              nationality: "British",
            },
          ],
        },
      },
    });

    const result = await getDriverInfo("norris");

    expect(result).toEqual({
      id: "norris",
      code: "NOR",
      number: 4,
      givenName: "Lando",
      familyName: "Norris",
      nationality: "British",
    });
  });

  it("throws when the driver id does not exist", async () => {
    mockFetchOnce({ MRData: { DriverTable: { Drivers: [] } } });
    await expect(getDriverInfo("nobody")).rejects.toThrow("Driver not found: nobody");
  });
});

describe("getDriverSeasonResults", () => {
  it("maps one result per round into DriverRaceSummary[]", async () => {
    mockFetchOnce({
      MRData: {
        RaceTable: {
          Races: [
            {
              round: "1",
              raceName: "Australian Grand Prix",
              Results: [
                {
                  position: "5",
                  points: "10",
                  status: "Finished",
                  Constructor: { constructorId: "mclaren", name: "McLaren" },
                },
              ],
            },
          ],
        },
      },
    });

    const result = await getDriverSeasonResults("2026", "norris");

    expect(result).toEqual([
      {
        round: 1,
        raceName: "Australian Grand Prix",
        position: 5,
        points: 10,
        status: "Finished",
        constructorId: "mclaren",
        constructorName: "McLaren",
      },
    ]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- jolpica
```

Expected: FAIL — `getRaceResults is not a function` (and similarly for the other two).

- [ ] **Step 3: Implement**

Append to `src/lib/jolpica.ts`:

```ts
export interface RaceResultEntry {
  position: number;
  status: string;
  points: number;
  driver: { id: string; code: string; givenName: string; familyName: string };
  constructorId: string;
  constructorName: string;
  time: string | null;
  fastestLapRank: number | null;
}

export interface RaceResult {
  season: string;
  round: number;
  raceName: string;
  results: RaceResultEntry[];
}

interface RawResult {
  position: string;
  points: string;
  status: string;
  Driver: JolpicaDriver;
  Constructor: JolpicaConstructor;
  Time?: { time: string };
  FastestLap?: { rank: string };
}

interface RawResultsResponse {
  MRData: {
    RaceTable: {
      season: string;
      round: string;
      Races: Array<{ raceName: string; Results: RawResult[] }>;
    };
  };
}

export async function getRaceResults(season: string, round: string | number): Promise<RaceResult> {
  const data = await fetchJolpica<RawResultsResponse>(`/${season}/${round}/results.json`);
  const race = data.MRData.RaceTable.Races[0];
  if (!race) {
    throw new Error(`No results found for ${season} round ${round}`);
  }
  return {
    season: data.MRData.RaceTable.season,
    round: Number(data.MRData.RaceTable.round),
    raceName: race.raceName,
    results: race.Results.map((r) => ({
      position: Number(r.position),
      status: r.status,
      points: Number(r.points),
      driver: {
        id: r.Driver.driverId,
        code: r.Driver.code,
        givenName: r.Driver.givenName,
        familyName: r.Driver.familyName,
      },
      constructorId: r.Constructor.constructorId,
      constructorName: r.Constructor.name,
      time: r.Time?.time ?? null,
      fastestLapRank: r.FastestLap ? Number(r.FastestLap.rank) : null,
    })),
  };
}

export interface DriverInfo {
  id: string;
  code: string;
  number: number | null;
  givenName: string;
  familyName: string;
  nationality: string;
}

interface RawDriverInfoResponse {
  MRData: { DriverTable: { Drivers: JolpicaDriver[] } };
}

export async function getDriverInfo(driverId: string): Promise<DriverInfo> {
  const data = await fetchJolpica<RawDriverInfoResponse>(`/drivers/${driverId}.json`);
  const driver = data.MRData.DriverTable.Drivers[0];
  if (!driver) {
    throw new Error(`Driver not found: ${driverId}`);
  }
  return {
    id: driver.driverId,
    code: driver.code,
    number: driver.permanentNumber ? Number(driver.permanentNumber) : null,
    givenName: driver.givenName,
    familyName: driver.familyName,
    nationality: driver.nationality,
  };
}

export interface DriverRaceSummary {
  round: number;
  raceName: string;
  position: number;
  points: number;
  status: string;
  constructorId: string;
  constructorName: string;
}

interface RawDriverResultsResponse {
  MRData: {
    RaceTable: {
      Races: Array<{ round: string; raceName: string; Results: RawResult[] }>;
    };
  };
}

export async function getDriverSeasonResults(season: string, driverId: string): Promise<DriverRaceSummary[]> {
  const data = await fetchJolpica<RawDriverResultsResponse>(`/${season}/drivers/${driverId}/results.json`);
  return data.MRData.RaceTable.Races.map((race) => {
    const result = race.Results[0];
    return {
      round: Number(race.round),
      raceName: race.raceName,
      position: Number(result.position),
      points: Number(result.points),
      status: result.status,
      constructorId: result.Constructor.constructorId,
      constructorName: result.Constructor.name,
    };
  });
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm test -- jolpica
```

Expected: PASS (9 tests total in this file).

- [ ] **Step 5: Commit**

```bash
git add src/lib/jolpica.ts src/lib/jolpica.test.ts
git commit -m "feat: Jolpica client for race results and driver profiles

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 7: OpenF1 client — session schedule

**Files:**
- Create: `src/lib/openf1.ts`
- Test: `src/lib/openf1.test.ts`

**Interfaces:**
- Produces: `SessionInfo` type; `getUpcomingSessions(): Promise<SessionInfo[]>`. Used by Tasks 9, 16.
- Consumes: global `fetch` (mocked in tests).

- [ ] **Step 1: Write the failing test**

Create `src/lib/openf1.test.ts`:

```ts
import { describe, it, expect, vi, afterEach } from "vitest";
import { getUpcomingSessions } from "./openf1";

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

describe("getUpcomingSessions", () => {
  it("maps raw OpenF1 sessions into SessionInfo[], sorted by start time", async () => {
    mockFetchOnce([
      {
        session_key: 11361,
        meeting_key: 1293,
        session_name: "Race",
        session_type: "Race",
        date_start: "2026-09-06T13:00:00+00:00",
        date_end: "2026-09-06T15:00:00+00:00",
        location: "Monza",
        country_name: "Italy",
      },
      {
        session_key: 11354,
        meeting_key: 1293,
        session_name: "Practice 1",
        session_type: "Practice",
        date_start: "2026-09-04T10:30:00+00:00",
        date_end: "2026-09-04T11:30:00+00:00",
        location: "Monza",
        country_name: "Italy",
      },
    ]);

    const result = await getUpcomingSessions();

    expect(result).toEqual([
      {
        sessionKey: 11354,
        meetingKey: 1293,
        sessionName: "Practice 1",
        sessionType: "Practice",
        dateStart: "2026-09-04T10:30:00+00:00",
        dateEnd: "2026-09-04T11:30:00+00:00",
        location: "Monza",
        countryName: "Italy",
      },
      {
        sessionKey: 11361,
        meetingKey: 1293,
        sessionName: "Race",
        sessionType: "Race",
        dateStart: "2026-09-06T13:00:00+00:00",
        dateEnd: "2026-09-06T15:00:00+00:00",
        location: "Monza",
        countryName: "Italy",
      },
    ]);
  });

  it("throws a descriptive error when the upstream request fails", async () => {
    mockFetchOnce(undefined, false, 503);
    await expect(getUpcomingSessions()).rejects.toThrow("OpenF1 request failed: 503");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- openf1
```

Expected: FAIL — `Cannot find module './openf1'`.

- [ ] **Step 3: Implement**

Create `src/lib/openf1.ts`:

```ts
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
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm test -- openf1
```

Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/openf1.ts src/lib/openf1.test.ts
git commit -m "feat: OpenF1 client for upcoming session schedule

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 8: OpenF1 client — race enrichment (laps, pit stops, weather)

**Files:**
- Modify: `src/lib/openf1.ts` (append)
- Modify: `src/lib/openf1.test.ts` (append)

**Interfaces:**
- Produces: `SessionExtras` type; `getSessionExtras(sessionKey: number): Promise<SessionExtras | null>`; `findRaceSessionKey(season: string, raceDateIso: string): Promise<number | null>`. Used by Task 14.
- Both functions catch all errors internally and resolve to `null` — they must never throw, per the Global Constraints graceful-degradation rule.

- [ ] **Step 1: Write the failing test**

Append to `src/lib/openf1.test.ts`:

```ts
import { getSessionExtras, findRaceSessionKey } from "./openf1";

describe("getSessionExtras", () => {
  it("maps laps, pit stops, and weather for a session", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [
          { driver_number: 1, lap_number: 1, lap_duration: 84.57, is_pit_out_lap: false },
        ],
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [
          { driver_number: 1, lap_number: 2, pit_duration: 22.4, stop_duration: 2.3 },
        ],
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [
          { air_temperature: 18.7, track_temperature: 32.9, humidity: 56.2, rainfall: 0, date: "2026-08-23T12:07:04Z" },
        ],
      });
    vi.stubGlobal("fetch", fetchMock);

    const result = await getSessionExtras(11353);

    expect(result).toEqual({
      laps: [{ driverNumber: 1, lapNumber: 1, lapDurationSeconds: 84.57, isPitOutLap: false }],
      pitStops: [{ driverNumber: 1, lapNumber: 2, pitDurationSeconds: 2.3 }],
      weather: [{ airTemp: 18.7, trackTemp: 32.9, humidity: 56.2, rainfallMm: 0, date: "2026-08-23T12:07:04Z" }],
    });
  });

  it("returns null instead of throwing when any upstream call fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 503, json: async () => undefined }));
    const result = await getSessionExtras(11353);
    expect(result).toBeNull();
  });
});

describe("findRaceSessionKey", () => {
  it("finds the Race session whose date_start matches the given date", async () => {
    mockFetchOnce([
      {
        session_key: 11353,
        meeting_key: 1292,
        session_name: "Race",
        session_type: "Race",
        date_start: "2026-08-23T13:00:00+00:00",
        date_end: "2026-08-23T15:00:00+00:00",
        location: "Zandvoort",
        country_name: "Netherlands",
      },
    ]);

    const result = await findRaceSessionKey("2026", "2026-08-23");
    expect(result).toBe(11353);
  });

  it("returns null when no session matches or the request fails", async () => {
    mockFetchOnce([]);
    expect(await findRaceSessionKey("2026", "2026-01-01")).toBeNull();

    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));
    expect(await findRaceSessionKey("2026", "2026-08-23")).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- openf1
```

Expected: FAIL — `getSessionExtras is not a function`.

- [ ] **Step 3: Implement**

Append to `src/lib/openf1.ts`:

```ts
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
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm test -- openf1
```

Expected: PASS (6 tests total in this file).

- [ ] **Step 5: Commit**

```bash
git add src/lib/openf1.ts src/lib/openf1.test.ts
git commit -m "feat: OpenF1 client for race enrichment (laps, pit stops, weather)

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 9: Live-session detection logic

**Files:**
- Create: `src/lib/session-status.ts`
- Test: `src/lib/session-status.test.ts`

**Interfaces:**
- Consumes: `SessionInfo` from `src/lib/openf1.ts` (Task 7).
- Produces: `LiveStatus` type; `getLiveStatus(sessions: SessionInfo[], now: Date): LiveStatus`. Used by Task 16.

- [ ] **Step 1: Write the failing test**

Create `src/lib/session-status.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { getLiveStatus } from "./session-status";
import type { SessionInfo } from "./openf1";

function session(overrides: Partial<SessionInfo>): SessionInfo {
  return {
    sessionKey: 1,
    meetingKey: 1,
    sessionName: "Race",
    sessionType: "Race",
    dateStart: "2026-09-06T13:00:00Z",
    dateEnd: "2026-09-06T15:00:00Z",
    location: "Monza",
    countryName: "Italy",
    ...overrides,
  };
}

describe("getLiveStatus", () => {
  it("reports active:true when now falls within a session window", () => {
    const now = new Date("2026-09-06T14:00:00Z");
    const race = session({});
    const result = getLiveStatus([race], now);
    expect(result).toEqual({ active: true, session: race });
  });

  it("reports the earliest upcoming session when nothing is active", () => {
    const now = new Date("2026-09-01T00:00:00Z");
    const fp1 = session({ sessionKey: 2, sessionName: "Practice 1", dateStart: "2026-09-04T10:30:00Z", dateEnd: "2026-09-04T11:30:00Z" });
    const race = session({ sessionKey: 1, dateStart: "2026-09-06T13:00:00Z", dateEnd: "2026-09-06T15:00:00Z" });
    const result = getLiveStatus([race, fp1], now);
    expect(result).toEqual({ active: false, nextSession: fp1 });
  });

  it("reports nextSession: null when there are no future sessions", () => {
    const now = new Date("2026-12-01T00:00:00Z");
    const race = session({ dateStart: "2026-09-06T13:00:00Z", dateEnd: "2026-09-06T15:00:00Z" });
    const result = getLiveStatus([race], now);
    expect(result).toEqual({ active: false, nextSession: null });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- session-status
```

Expected: FAIL — `Cannot find module './session-status'`.

- [ ] **Step 3: Implement**

Create `src/lib/session-status.ts`:

```ts
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
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm test -- session-status
```

Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/session-status.ts src/lib/session-status.test.ts
git commit -m "feat: pure logic for detecting an active or upcoming F1 session

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 10: Responsive navigation

**Files:**
- Create: `src/components/Navigation.tsx`
- Modify: `src/app/layout.tsx`

**Interfaces:**
- Produces: `<Navigation />` component, rendered once in the root layout.

No unit test (presentational component, out of test scope per Global Constraints) — verified manually.

- [ ] **Step 1: Create the component**

Create `src/components/Navigation.tsx`:

```tsx
import Link from "next/link";

const LINKS = [
  { href: "/", label: "Início" },
  { href: "/classificacao", label: "Classificação" },
  { href: "/calendario", label: "Calendário" },
  { href: "/ao-vivo", label: "Ao Vivo" },
];

export function Navigation() {
  return (
    <nav
      aria-label="Navegação principal"
      className="fixed bottom-0 left-0 right-0 z-10 flex justify-around border-t border-surface bg-surface/95 py-2 backdrop-blur md:static md:justify-start md:gap-6 md:border-b md:border-t-0 md:bg-transparent md:px-0 md:py-4"
    >
      {LINKS.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className="px-2 py-1 text-sm font-semibold text-foreground hover:text-accent"
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
```

- [ ] **Step 2: Wire it into the root layout**

In `src/app/layout.tsx`, add the import and render `<Navigation />` before `<main>`, and give `<main>` bottom padding so content isn't hidden behind the fixed mobile nav:

```tsx
import { Navigation } from "@/components/Navigation";
```

Replace the `<body>` block with:

```tsx
      <body className="min-h-screen bg-background font-sans text-foreground">
        <Navigation />
        <main className="mx-auto max-w-5xl px-4 pb-20 pt-6 md:pb-6">{children}</main>
      </body>
```

- [ ] **Step 3: Verify**

```bash
npm run dev
```

Open `http://localhost:3000` and confirm the nav renders at the bottom on a narrow viewport and at the top on a wide one. Stop the dev server when done.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: responsive navigation (bottom nav mobile, top nav desktop)

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 11: Dashboard page (`/`)

**Files:**
- Modify: `src/app/page.tsx` (replace the `create-next-app` starter content)

**Interfaces:**
- Consumes: `getDriverStandings`, `getConstructorStandings`, `getSeasonSchedule` (Tasks 4–5); `getConstructorColor` (Task 3).

No unit test (page-level, out of test scope) — verified manually.

- [ ] **Step 1: Replace `src/app/page.tsx`**

```tsx
import { getDriverStandings, getConstructorStandings, getSeasonSchedule, type RaceScheduleEntry } from "@/lib/jolpica";
import { getConstructorColor } from "@/lib/constructor-colors";

function findNextRace(schedule: RaceScheduleEntry[]): RaceScheduleEntry | null {
  const nowMs = Date.now();
  return schedule.find((race) => new Date(race.sessions.race).getTime() > nowMs) ?? null;
}

export default async function DashboardPage() {
  let drivers: Awaited<ReturnType<typeof getDriverStandings>> = [];
  let constructors: Awaited<ReturnType<typeof getConstructorStandings>> = [];
  let nextRace: RaceScheduleEntry | null = null;
  let loadError = false;

  try {
    const [driverStandings, constructorStandings, schedule] = await Promise.all([
      getDriverStandings(),
      getConstructorStandings(),
      getSeasonSchedule(),
    ]);
    drivers = driverStandings;
    constructors = constructorStandings;
    nextRace = findNextRace(schedule);
  } catch {
    loadError = true;
  }

  if (loadError) {
    return <p className="text-muted">Não foi possível carregar os dados do campeonato agora. Tente novamente em instantes.</p>;
  }

  return (
    <div className="flex flex-col gap-8">
      <section>
        <h1 className="text-2xl font-bold">Painel do Campeonato</h1>
        {nextRace ? (
          <p className="mt-1 text-muted">
            Próxima corrida: <strong>{nextRace.raceName}</strong> em{" "}
            {new Date(nextRace.sessions.race).toLocaleString("pt-BR", { dateStyle: "long", timeStyle: "short" })}
          </p>
        ) : (
          <p className="mt-1 text-muted">Nenhuma corrida futura agendada nesta temporada.</p>
        )}
      </section>

      <section>
        <h2 className="mb-2 text-lg font-semibold">Top 5 — Pilotos</h2>
        <ol className="flex flex-col gap-1">
          {drivers.slice(0, 5).map((standing) => (
            <li
              key={standing.driver.id}
              className="flex items-center justify-between rounded border-l-4 bg-surface px-3 py-2"
              style={{ borderColor: getConstructorColor(standing.constructorId) }}
            >
              <span>
                {standing.position}. {standing.driver.givenName} {standing.driver.familyName}
              </span>
              <span className="font-semibold">{standing.points} pts</span>
            </li>
          ))}
        </ol>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-semibold">Top 5 — Construtores</h2>
        <ol className="flex flex-col gap-1">
          {constructors.slice(0, 5).map((standing) => (
            <li
              key={standing.constructorId}
              className="flex items-center justify-between rounded border-l-4 bg-surface px-3 py-2"
              style={{ borderColor: getConstructorColor(standing.constructorId) }}
            >
              <span>
                {standing.position}. {standing.name}
              </span>
              <span className="font-semibold">{standing.points} pts</span>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
```

- [ ] **Step 2: Verify**

```bash
npm run dev
```

Open `http://localhost:3000` and confirm the dashboard renders real standings and a next-race line. Stop the dev server when done.

- [ ] **Step 3: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: dashboard page with standings summary and next race

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 12: Classificação page (`/classificacao`)

**Files:**
- Create: `src/app/classificacao/page.tsx`

**Interfaces:**
- Consumes: `getDriverStandings`, `getConstructorStandings` (Task 4); `getConstructorColor` (Task 3).

No unit test — verified manually.

- [ ] **Step 1: Create the page**

```tsx
import { getDriverStandings, getConstructorStandings } from "@/lib/jolpica";
import { getConstructorColor } from "@/lib/constructor-colors";

export default async function ClassificacaoPage() {
  let drivers: Awaited<ReturnType<typeof getDriverStandings>> = [];
  let constructors: Awaited<ReturnType<typeof getConstructorStandings>> = [];
  let loadError = false;

  try {
    [drivers, constructors] = await Promise.all([getDriverStandings(), getConstructorStandings()]);
  } catch {
    loadError = true;
  }

  if (loadError) {
    return <p className="text-muted">Não foi possível carregar a classificação agora.</p>;
  }

  return (
    <div className="flex flex-col gap-10">
      <h1 className="text-2xl font-bold">Classificação</h1>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Pilotos</h2>
        <table className="w-full border-collapse overflow-hidden rounded text-sm">
          <thead>
            <tr className="bg-surface text-left text-muted">
              <th className="px-3 py-2">#</th>
              <th className="px-3 py-2">Piloto</th>
              <th className="px-3 py-2">Equipe</th>
              <th className="px-3 py-2 text-right">Vitórias</th>
              <th className="px-3 py-2 text-right">Pontos</th>
            </tr>
          </thead>
          <tbody>
            {drivers.map((standing) => (
              <tr
                key={standing.driver.id}
                className="border-l-4"
                style={{ borderColor: getConstructorColor(standing.constructorId) }}
              >
                <td className="px-3 py-2">{standing.position}</td>
                <td className="px-3 py-2">
                  {standing.driver.givenName} {standing.driver.familyName}
                </td>
                <td className="px-3 py-2 text-muted">{standing.constructorName}</td>
                <td className="px-3 py-2 text-right">{standing.wins}</td>
                <td className="px-3 py-2 text-right font-semibold">{standing.points}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Construtores</h2>
        <table className="w-full border-collapse overflow-hidden rounded text-sm">
          <thead>
            <tr className="bg-surface text-left text-muted">
              <th className="px-3 py-2">#</th>
              <th className="px-3 py-2">Equipe</th>
              <th className="px-3 py-2 text-right">Vitórias</th>
              <th className="px-3 py-2 text-right">Pontos</th>
            </tr>
          </thead>
          <tbody>
            {constructors.map((standing) => (
              <tr
                key={standing.constructorId}
                className="border-l-4"
                style={{ borderColor: getConstructorColor(standing.constructorId) }}
              >
                <td className="px-3 py-2">{standing.position}</td>
                <td className="px-3 py-2">{standing.name}</td>
                <td className="px-3 py-2 text-right">{standing.wins}</td>
                <td className="px-3 py-2 text-right font-semibold">{standing.points}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
```

- [ ] **Step 2: Verify**

```bash
npm run dev
```

Open `http://localhost:3000/classificacao` and confirm both tables render with colored left borders per team. Stop the dev server when done.

- [ ] **Step 3: Commit**

```bash
git add src/app/classificacao/page.tsx
git commit -m "feat: classificação page with full driver and constructor tables

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 13: Calendário page (`/calendario`)

**Files:**
- Create: `src/app/calendario/page.tsx`

**Interfaces:**
- Consumes: `getSeasonSchedule` (Task 5).

No unit test — verified manually.

- [ ] **Step 1: Create the page**

```tsx
import { getSeasonSchedule } from "@/lib/jolpica";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR", { dateStyle: "long", timeStyle: "short" });
}

export default async function CalendarioPage() {
  let schedule: Awaited<ReturnType<typeof getSeasonSchedule>> = [];
  let loadError = false;

  try {
    schedule = await getSeasonSchedule();
  } catch {
    loadError = true;
  }

  if (loadError) {
    return <p className="text-muted">Não foi possível carregar o calendário agora.</p>;
  }

  const nowMs = Date.now();

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">Calendário</h1>
      <ol className="flex flex-col gap-3">
        {schedule.map((race) => {
          const isPast = new Date(race.sessions.race).getTime() < nowMs;
          return (
            <li key={race.round} className={`rounded bg-surface p-4 ${isPast ? "opacity-60" : ""}`}>
              <p className="font-semibold">
                Round {race.round} — {race.raceName}
              </p>
              <p className="text-sm text-muted">
                {race.locality}, {race.country}
              </p>
              <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-sm sm:grid-cols-3">
                {race.sessions.fp1 && (
                  <div>
                    <dt className="text-muted">TL1</dt>
                    <dd>{formatDate(race.sessions.fp1)}</dd>
                  </div>
                )}
                {race.sessions.fp2 && (
                  <div>
                    <dt className="text-muted">TL2</dt>
                    <dd>{formatDate(race.sessions.fp2)}</dd>
                  </div>
                )}
                {race.sessions.fp3 && (
                  <div>
                    <dt className="text-muted">TL3</dt>
                    <dd>{formatDate(race.sessions.fp3)}</dd>
                  </div>
                )}
                {race.sessions.sprintQualifying && (
                  <div>
                    <dt className="text-muted">Class. Sprint</dt>
                    <dd>{formatDate(race.sessions.sprintQualifying)}</dd>
                  </div>
                )}
                {race.sessions.sprint && (
                  <div>
                    <dt className="text-muted">Sprint</dt>
                    <dd>{formatDate(race.sessions.sprint)}</dd>
                  </div>
                )}
                {race.sessions.qualifying && (
                  <div>
                    <dt className="text-muted">Classificação</dt>
                    <dd>{formatDate(race.sessions.qualifying)}</dd>
                  </div>
                )}
                <div>
                  <dt className="text-muted">Corrida</dt>
                  <dd className="font-semibold">{formatDate(race.sessions.race)}</dd>
                </div>
              </dl>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
```

- [ ] **Step 2: Verify**

```bash
npm run dev
```

Open `http://localhost:3000/calendario` and confirm every round renders, with past rounds dimmed. Stop the dev server when done.

- [ ] **Step 3: Commit**

```bash
git add src/app/calendario/page.tsx
git commit -m "feat: calendário page with full season schedule

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 14: Resultados page (`/resultados/[round]`)

**Files:**
- Modify: `src/lib/jolpica.ts` (add a `date` field to `RaceResult`)
- Modify: `src/lib/jolpica.test.ts` (update the two `getRaceResults` tests)
- Create: `src/app/resultados/[round]/page.tsx`

**Interfaces:**
- Consumes: `getRaceResults` (Task 6, extended here with a `date` field); `findRaceSessionKey`, `getSessionExtras` (Task 8); `getConstructorColor` (Task 3).
- Links here come from Task 13's calendar page — add the link in this task since the calendar page already lists every round.

No unit test for the page itself — verified manually. The `jolpica.ts` change below does
get a test update, since it touches already-tested logic.

- [ ] **Step 1: Add `date` to `RaceResult` (needed to look up the matching OpenF1 session)**

In `src/lib/jolpica.test.ts`, update the `getRaceResults` mock and expectation to include
`date`. Replace the `Races: [ { raceName: "Australian Grand Prix", Results: [...] } ]`
mock object in the `"maps raw race results into RaceResult"` test with:

```ts
Races: [
  {
    raceName: "Australian Grand Prix",
    date: "2026-03-08",
    Results: [
```

(keep the rest of that mock array unchanged), and update the corresponding expectation:

```ts
    expect(result).toEqual({
      season: "2026",
      round: 1,
      raceName: "Australian Grand Prix",
      date: "2026-03-08",
      results: [
```

In `src/lib/jolpica.ts`, add `date: string;` to the `RaceResult` interface, add
`date: string;` to the inner `Races` array type inside `RawResultsResponse`, and set
`date: race.date` when building the return value of `getRaceResults`:

```ts
export interface RaceResult {
  season: string;
  round: number;
  raceName: string;
  date: string;
  results: RaceResultEntry[];
}
```

```ts
interface RawResultsResponse {
  MRData: {
    RaceTable: {
      season: string;
      round: string;
      Races: Array<{ raceName: string; date: string; Results: RawResult[] }>;
    };
  };
}
```

```ts
  return {
    season: data.MRData.RaceTable.season,
    round: Number(data.MRData.RaceTable.round),
    raceName: race.raceName,
    date: race.date,
    results: race.Results.map((r) => ({
```

- [ ] **Step 2: Run tests to confirm the change is correct**

```bash
npm test -- jolpica
```

Expected: PASS (still 9 tests — the two `getRaceResults` tests now assert `date` too).

- [ ] **Step 3: Create the results page**

```tsx
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
```

- [ ] **Step 4: Add links from the calendar page**

In `src/app/calendario/page.tsx`, add the `Link` import and wrap each race's heading so
every round links to its results page:

```tsx
import Link from "next/link";
```

Replace:

```tsx
              <p className="font-semibold">
                Round {race.round} — {race.raceName}
              </p>
```

with:

```tsx
              <Link href={`/resultados/${race.round}`} className="font-semibold hover:text-accent">
                Round {race.round} — {race.raceName}
              </Link>
```

- [ ] **Step 5: Verify**

```bash
npm run build
```

Expected: build succeeds (dynamic route compiles).

```bash
npm run dev
```

Open `http://localhost:3000/calendario`, click into a past round, and confirm the results
table renders; confirm weather/pit sections either render real data or are silently
absent (never an error) depending on OpenF1 availability for that round.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: race results page with optional OpenF1 enrichment

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 15: Perfil do piloto page (`/pilotos/[id]`)

**Files:**
- Create: `src/app/pilotos/[id]/page.tsx`
- Modify: `src/app/classificacao/page.tsx` (link driver names to their profile)

**Interfaces:**
- Consumes: `getDriverInfo`, `getDriverStandings`, `getDriverSeasonResults` (Task 6); `getConstructorColor` (Task 3).

No unit test — verified manually.

- [ ] **Step 1: Create the page**

```tsx
import { getDriverInfo, getDriverStandings, getDriverSeasonResults } from "@/lib/jolpica";
import { getConstructorColor } from "@/lib/constructor-colors";

export default async function PilotoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let loadError = false;
  let driver: Awaited<ReturnType<typeof getDriverInfo>> | null = null;
  let seasonResults: Awaited<ReturnType<typeof getDriverSeasonResults>> = [];
  let currentStanding: Awaited<ReturnType<typeof getDriverStandings>>[number] | null = null;

  try {
    const [driverInfo, standings, results] = await Promise.all([
      getDriverInfo(id),
      getDriverStandings(),
      getDriverSeasonResults("current", id),
    ]);
    driver = driverInfo;
    seasonResults = results;
    currentStanding = standings.find((s) => s.driver.id === id) ?? null;
  } catch {
    loadError = true;
  }

  if (loadError || !driver) {
    return <p className="text-muted">Não foi possível carregar o perfil deste piloto agora.</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      <section>
        <h1 className="text-2xl font-bold">
          {driver.givenName} {driver.familyName}
        </h1>
        <p className="text-muted">
          {driver.code}
          {driver.number ? ` · #${driver.number}` : ""} · {driver.nationality}
        </p>
        {currentStanding && (
          <p
            className="mt-2 inline-block rounded border-l-4 bg-surface px-3 py-1 text-sm"
            style={{ borderColor: getConstructorColor(currentStanding.constructorId) }}
          >
            {currentStanding.constructorName} · P{currentStanding.position} · {currentStanding.points} pts
          </p>
        )}
      </section>

      <section>
        <h2 className="mb-2 text-lg font-semibold">Resultados na temporada</h2>
        <table className="w-full border-collapse overflow-hidden rounded text-sm">
          <thead>
            <tr className="bg-surface text-left text-muted">
              <th className="px-3 py-2">Round</th>
              <th className="px-3 py-2">Corrida</th>
              <th className="px-3 py-2">Equipe</th>
              <th className="px-3 py-2">Pos.</th>
              <th className="px-3 py-2 text-right">Pontos</th>
            </tr>
          </thead>
          <tbody>
            {seasonResults.map((race) => (
              <tr key={race.round} className="border-l-4" style={{ borderColor: getConstructorColor(race.constructorId) }}>
                <td className="px-3 py-2">{race.round}</td>
                <td className="px-3 py-2">{race.raceName}</td>
                <td className="px-3 py-2 text-muted">{race.constructorName}</td>
                <td className="px-3 py-2">{race.position}</td>
                <td className="px-3 py-2 text-right font-semibold">{race.points}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
```

- [ ] **Step 2: Link driver names from the classificação page**

In `src/app/classificacao/page.tsx`, add the import:

```tsx
import Link from "next/link";
```

Replace the driver-name cell:

```tsx
                <td className="px-3 py-2">
                  {standing.driver.givenName} {standing.driver.familyName}
                </td>
```

with:

```tsx
                <td className="px-3 py-2">
                  <Link href={`/pilotos/${standing.driver.id}`} className="hover:text-accent">
                    {standing.driver.givenName} {standing.driver.familyName}
                  </Link>
                </td>
```

- [ ] **Step 3: Verify**

```bash
npm run build && npm run dev
```

Open `http://localhost:3000/classificacao`, click a driver, and confirm their profile
page renders info, current standing, and a season results table. Stop the dev server
when done.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: driver profile page linked from classificação

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 16: Ao Vivo page — locked live tab

**Files:**
- Create: `src/components/LiveStatusBanner.tsx`
- Create: `src/app/ao-vivo/page.tsx`

**Interfaces:**
- Consumes: `getUpcomingSessions` (Task 7); `getLiveStatus`, `LiveStatus` (Task 9).

No unit test for the component (client-side ticking UI, presentational) — the logic it
depends on (`getLiveStatus`) is already covered by Task 9's tests. Verified manually here.

- [ ] **Step 1: Create the client component**

```tsx
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
```

- [ ] **Step 2: Create the page**

```tsx
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
```

- [ ] **Step 3: Verify**

```bash
npm run dev
```

Open `http://localhost:3000/ao-vivo`. Confirm it shows either "em andamento agora" (if a
session happens to be live) or the next scheduled session with a countdown, and that the
countdown updates every 30 seconds without a page reload. Stop the dev server when done.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: locked Ao Vivo tab with live-session detection

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 17: PWA manifest

**Files:**
- Create: `public/manifest.webmanifest`
- Create: `public/icons/icon.svg`

**Interfaces:** none — static assets referenced by `metadata.manifest` in `src/app/layout.tsx` (already set in Task 2).

- [ ] **Step 1: Create a simple monogram icon**

Create `public/icons/icon.svg`:

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
  <rect width="128" height="128" rx="24" fill="#0a0a0a"/>
  <rect x="8" y="8" width="112" height="112" rx="18" fill="#17181c"/>
  <text x="64" y="82" font-family="Arial, sans-serif" font-size="56" font-weight="700" fill="#e10600" text-anchor="middle">F1</text>
</svg>
```

- [ ] **Step 2: Create the manifest**

Create `public/manifest.webmanifest`:

```json
{
  "name": "F1 Dashboard",
  "short_name": "F1 Dash",
  "description": "Classificação, calendário e resultados de Fórmula 1",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0a0a0a",
  "theme_color": "#e10600",
  "icons": [
    { "src": "/icons/icon.svg", "sizes": "any", "type": "image/svg+xml", "purpose": "any" }
  ]
}
```

- [ ] **Step 3: Verify**

```bash
npm run build
```

Expected: build succeeds. Then run `npm run dev`, open devtools → Application →
Manifest, and confirm it loads without errors.

- [ ] **Step 4: Commit**

```bash
git add public/manifest.webmanifest public/icons/icon.svg
git commit -m "feat: add PWA manifest and app icon

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 18: Visual design pass (frontend-design skill)

**Files:** all files under `src/app/` and `src/components/` created in Tasks 2, 10–16 (styling refinement only — no data-fetching logic changes).

**Interfaces:** unchanged — this task only touches JSX class names / CSS tokens, never
function signatures from earlier tasks.

This task has no TDD steps — it is a visual refinement pass using an existing design
skill instead of code-first iteration.

- [ ] **Step 1: Invoke the `frontend-design` skill**

Run it against this brief: "Refine the F1 Dashboard MVP's visual design. Dark theme
inspired by F1 broadcast/telemetry graphics (not a clone of any single team). Constructor
team colors should appear as contextual accents (standings rows, driver profile badge,
results table) — the color map already exists in `src/lib/constructor-colors.ts`, do not
change its values. Typography is Titillium Web (already wired in `src/app/layout.tsx`) —
lean into its condensed, technical feel; use a tabular/monospace treatment for lap times,
points, and positions so they align in tables. Keep the existing responsive nav (bottom
on mobile, top on desktop) and the locked-state messaging on `/ao-vivo` exactly as
written. Apply the result across `src/app/globals.css`, `src/app/layout.tsx`,
`src/components/Navigation.tsx`, `src/components/LiveStatusBanner.tsx`, and every page
under `src/app/`."

- [ ] **Step 2: Verify nothing broke**

```bash
npm test
npm run build
```

Expected: all Vitest suites still pass (they don't touch styling) and the build succeeds.

- [ ] **Step 3: Manual check on mobile and desktop widths**

```bash
npm run dev
```

Resize the browser (or use devtools device emulation) to confirm the dark theme,
constructor colors, and Titillium Web read well at both a phone width (~375px) and a
desktop width. Stop the dev server when done.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "style: visual design pass via frontend-design skill

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 19: Deploy to Vercel

**Files:**
- Create: `README.md`

**Interfaces:** none.

- [ ] **Step 1: Write the README**

Create `README.md`:

```markdown
# F1 Dashboard

Dashboard pessoal de Fórmula 1: classificação, calendário e resultados da temporada
atual, com uma aba "Ao Vivo" que detecta sessões em andamento (dado ao vivo real fica
para uma fase futura — ver `docs/superpowers/specs/2026-08-26-f1-dashboard-design.md`).

## Rodando localmente

\`\`\`bash
npm install
npm run dev
\`\`\`

Abra http://localhost:3000.

## Testes

\`\`\`bash
npm test
\`\`\`

## Deploy

1. Suba este repositório para o GitHub (branch principal: `main`).
2. Em https://vercel.com, "Add New Project" → importe o repositório.
3. Nenhuma variável de ambiente é necessária — as APIs (Jolpica, OpenF1) são públicas.
4. Cada push na branch principal gera um novo deploy automático.

## Fontes de dados

- [Jolpica-F1](https://github.com/jolpica/jolpica-f1) — classificação, calendário, resultados.
- [OpenF1](https://openf1.org/) — enriquecimento opcional (clima, pit stops) e agenda de sessões para a aba Ao Vivo.
```

- [ ] **Step 2: Merge onto the main branch**

```bash
git branch -m docs/f1-dashboard-design main
git log --oneline
```

Expected: a linear history of every commit made across Tasks 1–19, ending on `main`.

- [ ] **Step 3: Push to GitHub**

Create an empty repository on GitHub first (via the GitHub website — do not use `gh repo create` without confirming the repo name/visibility with the user first), then:

```bash
git remote add origin <URL_DO_REPOSITORIO_GITHUB>
git push -u origin main
```

- [ ] **Step 4: Deploy on Vercel**

Go to https://vercel.com, sign in with GitHub, "Add New Project", select this
repository, keep the default Next.js build settings, and click Deploy.

- [ ] **Step 5: Verify the live deployment**

Open the `*.vercel.app` URL Vercel gives you, on both a desktop browser and a phone, and
confirm the Dashboard, Classificação, Calendário, Resultados, Piloto, and Ao Vivo pages
all load real data.

- [ ] **Step 6: Commit the README**

```bash
git add README.md
git commit -m "docs: add README with local setup and deploy instructions

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
git push
```

---

## Self-review notes

- **Spec coverage:** §2 (data sources) → Tasks 4–8. §3 (architecture) → Task 1 (with the
  documented correction) plus Tasks 4–9 (no DB, cache via `revalidate`). §4 (pages) →
  Tasks 11–16. §5 (visual identity) → Tasks 2, 3, 18. §6 (Ao Vivo lock) → Tasks 9, 16. §7
  (errors/empty states) → try/catch + friendly message in every page task (11–16); OpenF1
  enrichment failures degrade silently per Task 8/14. §8 (mobile) → Task 10 (responsive
  nav) + Task 2 (mobile-first base). §9 (deploy) → Task 19. §10 (tests) → Tasks 3–9 (lib
  unit tests only, per the spec's own test-scope decision).
- **Type consistency:** `DriverStanding`, `ConstructorStanding`, `RaceScheduleEntry`,
  `RaceResult`/`RaceResultEntry`, `DriverInfo`, `DriverRaceSummary` (from `jolpica.ts`) and
  `SessionInfo`/`SessionExtras` (from `openf1.ts`) are defined once in Tasks 4–8 and
  imported by exact name everywhere else (Tasks 9, 11–16) — no renaming across tasks.
- **Placeholder scan:** none found. (An earlier draft of Task 14 introduced a throwaway
  `raceDate` variable to sequence the `RaceResult.date` field addition before using it —
  that was restructured so Step 1 adds the field for real and Step 3 uses it directly,
  with no dead code in between.)
