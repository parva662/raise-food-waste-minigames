/**
 * DEVELOPMENT FIXTURES ONLY — fictional chefForecast records for future daily-result calculation tests.
 * Isolated from production UI. Not used by the closeout form in this phase.
 */

export type FixtureChefForecastRecord = {
  userId: string;
  targetDate: string;
  expectedCustomers: number;
  mainQuantity: number;
  vegetarianQuantity: number;
  soupQuantity: number;
  dessertQuantity: number;
};

export const FIXTURE_CHEF_FORECASTS: readonly FixtureChefForecastRecord[] = [
  // Monday 2026-07-27 — A, B, C participate; head chef A
  {
    userId: 'fixture-user-a',
    targetDate: '2026-07-27',
    expectedCustomers: 180,
    mainQuantity: 120,
    vegetarianQuantity: 55,
    soupQuantity: 40,
    dessertQuantity: 35,
  },
  {
    userId: 'fixture-user-b',
    targetDate: '2026-07-27',
    expectedCustomers: 200,
    mainQuantity: 140,
    vegetarianQuantity: 60,
    soupQuantity: 50,
    dessertQuantity: 45,
  },
  {
    userId: 'fixture-user-c',
    targetDate: '2026-07-27',
    expectedCustomers: 170,
    mainQuantity: 100,
    vegetarianQuantity: 50,
    soupQuantity: 35,
    dessertQuantity: 30,
  },
  // Tuesday — B, C, D; head chef C
  {
    userId: 'fixture-user-b',
    targetDate: '2026-07-28',
    expectedCustomers: 190,
    mainQuantity: 130,
    vegetarianQuantity: 58,
    soupQuantity: 42,
    dessertQuantity: 38,
  },
  {
    userId: 'fixture-user-c',
    targetDate: '2026-07-28',
    expectedCustomers: 185,
    mainQuantity: 125,
    vegetarianQuantity: 52,
    soupQuantity: 45,
    dessertQuantity: 40,
  },
  {
    userId: 'fixture-user-d',
    targetDate: '2026-07-28',
    expectedCustomers: 210,
    mainQuantity: 150,
    vegetarianQuantity: 65,
    soupQuantity: 55,
    dessertQuantity: 50,
  },
  // Wednesday — A, C, E; head chef E
  {
    userId: 'fixture-user-a',
    targetDate: '2026-07-29',
    expectedCustomers: 175,
    mainQuantity: 110,
    vegetarianQuantity: 48,
    soupQuantity: 38,
    dessertQuantity: 32,
  },
  {
    userId: 'fixture-user-c',
    targetDate: '2026-07-29',
    expectedCustomers: 165,
    mainQuantity: 95,
    vegetarianQuantity: 45,
    soupQuantity: 30,
    dessertQuantity: 28,
  },
  {
    userId: 'fixture-user-e',
    targetDate: '2026-07-29',
    expectedCustomers: 195,
    mainQuantity: 135,
    vegetarianQuantity: 60,
    soupQuantity: 48,
    dessertQuantity: 42,
  },
  // Thursday — A, B, D, E; head chef B
  {
    userId: 'fixture-user-a',
    targetDate: '2026-07-30',
    expectedCustomers: 188,
    mainQuantity: 128,
    vegetarianQuantity: 54,
    soupQuantity: 44,
    dessertQuantity: 36,
  },
  {
    userId: 'fixture-user-b',
    targetDate: '2026-07-30',
    expectedCustomers: 192,
    mainQuantity: 132,
    vegetarianQuantity: 56,
    soupQuantity: 46,
    dessertQuantity: 38,
  },
  {
    userId: 'fixture-user-d',
    targetDate: '2026-07-30',
    expectedCustomers: 205,
    mainQuantity: 145,
    vegetarianQuantity: 62,
    soupQuantity: 52,
    dessertQuantity: 48,
  },
  {
    userId: 'fixture-user-e',
    targetDate: '2026-07-30',
    expectedCustomers: 178,
    mainQuantity: 118,
    vegetarianQuantity: 50,
    soupQuantity: 40,
    dessertQuantity: 34,
  },
  // Friday — B, C, D; head chef D
  {
    userId: 'fixture-user-b',
    targetDate: '2026-07-31',
    expectedCustomers: 182,
    mainQuantity: 122,
    vegetarianQuantity: 53,
    soupQuantity: 41,
    dessertQuantity: 37,
  },
  {
    userId: 'fixture-user-c',
    targetDate: '2026-07-31',
    expectedCustomers: 168,
    mainQuantity: 98,
    vegetarianQuantity: 46,
    soupQuantity: 32,
    dessertQuantity: 29,
  },
  {
    userId: 'fixture-user-d',
    targetDate: '2026-07-31',
    expectedCustomers: 198,
    mainQuantity: 138,
    vegetarianQuantity: 59,
    soupQuantity: 47,
    dessertQuantity: 41,
  },
] as const;

export function getFixtureChefForecastsForDate(targetDate: string): FixtureChefForecastRecord[] {
  return FIXTURE_CHEF_FORECASTS.filter((record) => record.targetDate === targetDate);
}

export function getFixtureChefForecastsForUser(userId: string): FixtureChefForecastRecord[] {
  return FIXTURE_CHEF_FORECASTS.filter((record) => record.userId === userId);
}
