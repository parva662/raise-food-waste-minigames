import { describe, expect, it } from 'vitest';
import { helsinki } from '../test/fixtures/dates';
import { resolveChefForecastServiceDate } from '../services/operationalServiceCalendar';
import { resolveMealSlotsForDate } from '../services/mealSlots';
import { createChefForecastSubmission } from './chefSubmissionWindow';

const SERVICE_DATES = {
  fridayAug14: '2026-08-14',
  mondayAug17: '2026-08-17',
  tuesdayAug11: '2026-08-11',
  tuesdayAug18: '2026-08-18',
} as const;

describe('chef forecast service date', () => {
  it('targets Monday when the Helsinki operational day is Friday', () => {
    const fridayNoon = helsinki(SERVICE_DATES.fridayAug14, '12:00:00');
    expect(resolveChefForecastServiceDate(fridayNoon)).toBe(SERVICE_DATES.mondayAug17);
  });

  it('loads Monday menu items for a Friday forecast session', () => {
    const slots = resolveMealSlotsForDate(SERVICE_DATES.mondayAug17);
    expect(slots).not.toBeNull();
    expect(slots!.main.id).toBe('coq-au-vin-with-rice');
    expect(slots!.vegetarian.id).toBe('cajun-soy-strip-stew-with-rice');
    expect(slots!.soup.id).toBe('creamy-sweet-potato-soup');
    expect(slots!.dessert.id).toBe('blueberry-soup');
  });

  it('keeps ordinary weekday behavior as the next service date', () => {
    const mondayNoon = helsinki(SERVICE_DATES.mondayAug17, '12:00:00');
    expect(resolveChefForecastServiceDate(mondayNoon)).toBe(SERVICE_DATES.tuesdayAug18);
  });

  it('submits chefForecast targetDate as the resolved service date', () => {
    const clock = () => helsinki(SERVICE_DATES.fridayAug14, '12:00:00');
    const submission = createChefForecastSubmission(SERVICE_DATES.mondayAug17, clock);
    expect(submission?.targetDate).toBe(SERVICE_DATES.mondayAug17);
  });
});
