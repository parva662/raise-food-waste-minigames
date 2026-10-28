import { describe, expect, it } from 'vitest';
import { STUDENT_ACTIVITY_REF } from '@/app/routes';
import {
  buildStudentLunchHistory,
  parseStudentLunchCheckinActivity,
} from '@/products/student-journey/read/parseStudentLunchCheckin';
import { buildFixtureStudentLunchActivities } from '@/products/student-journey/fixtures/fixtureStudentLunchActivities';

function activity(overrides: Record<string, unknown> = {}) {
  return {
    id: 'a1',
    actor: { id: 'student-1', name: 'Test Student' },
    createdAt: '2026-10-20T10:00:00.000Z',
    template: { slug: STUDENT_ACTIVITY_REF },
    properties: [
      { template: { slug: 'targetDate' }, value: { value: '2026-10-21' } },
      { template: { slug: 'mealType' }, value: { value: 'no_lunch' } },
      { template: { slug: 'mainQuantity' }, value: { value: 0 } },
      { template: { slug: 'vegetarianQuantity' }, value: { value: 0 } },
      { template: { slug: 'soupQuantity' }, value: { value: 0 } },
      { template: { slug: 'dessertQuantity' }, value: { value: 0 } },
      { template: { slug: 'submittedAt' }, value: { value: '2026-10-20T10:00:00.000Z' } },
    ],
    ...overrides,
  };
}

describe('parseStudentLunchCheckinActivity', () => {
  it('parses a valid no_lunch declaration', () => {
    const parsed = parseStudentLunchCheckinActivity(activity());
    expect(parsed).toMatchObject({
      activityId: 'a1',
      actorId: 'student-1',
      targetDate: '2026-10-21',
      mealType: 'no_lunch',
    });
  });

  it('rejects non-lunch templates', () => {
    expect(
      parseStudentLunchCheckinActivity(
        activity({ template: { slug: 'chefForecast' } }),
      ),
    ).toBeNull();
  });
});

describe('buildStudentLunchHistory', () => {
  it('keeps one entry per service date using the latest submission', () => {
    const history = buildStudentLunchHistory(buildFixtureStudentLunchActivities(), {
      actorId: 'fixture-student-a',
    });
    expect(history).toHaveLength(3);
    expect(history.map((entry) => entry.targetDate)).toEqual([
      '2026-10-28',
      '2026-10-24',
      '2026-10-22',
    ]);
    const october24 = history.find((entry) => entry.targetDate === '2026-10-24');
    expect(october24?.mealType).toBe('no_lunch');
  });

  it('excludes other actors', () => {
    const history = buildStudentLunchHistory(
      [
        activity(),
        activity({
          id: 'other',
          actor: { id: 'student-2', name: 'Other' },
        }),
      ],
      { actorId: 'student-1' },
    );
    expect(history).toHaveLength(1);
    expect(history[0]?.actorId).toBe('student-1');
  });
});
