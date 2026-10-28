import { describe, expect, it } from 'vitest';
import { buildStudentLunchHistory } from '@/products/student-journey/read/parseStudentLunchCheckin';
import { buildFixtureStudentLunchActivities } from '@/products/student-journey/fixtures/fixtureStudentLunchActivities';
import {
  describeStudentLunchEntry,
  summarizeStudentParticipation,
} from '@/products/student-journey/read/studentJourneyModel';

describe('studentJourneyModel', () => {
  it('summarises participation including no_lunch dates', () => {
    const history = buildStudentLunchHistory(buildFixtureStudentLunchActivities(), {
      actorId: 'fixture-student-a',
    });
    const summary = summarizeStudentParticipation(history);
    expect(summary.declarationCount).toBe(3);
    expect(summary.distinctServiceDates).toBe(3);
    expect(summary.mostRecentServiceDate).toBe('2026-10-28');
    expect(summary.mostRecentMealType).toBe('regular');
  });

  it('labels meal options for history rows', () => {
    const history = buildStudentLunchHistory(buildFixtureStudentLunchActivities(), {
      actorId: 'fixture-student-a',
    });
    const noLunch = history.find((entry) => entry.targetDate === '2026-10-24')!;
    const soup = history.find((entry) => entry.targetDate === '2026-10-22')!;
    expect(describeStudentLunchEntry(noLunch).optionLabel).toBe('No lunch');
    expect(describeStudentLunchEntry(soup)).toEqual({
      optionLabel: 'Soup + Dessert package',
      quantityDetail: 'Package × 1',
    });
  });
});
