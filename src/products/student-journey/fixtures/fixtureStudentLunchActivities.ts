import { STUDENT_ACTIVITY_REF } from '@/app/routes';

const FIXTURE_ACTOR = { id: 'fixture-student-a', name: 'Aino Virtanen' };

function prop(slug: string, value: string | number) {
  return {
    template: { slug },
    value: { value },
  };
}

/** Standalone demo history for My Food Journey (not GameBus persistence). */
export function buildFixtureStudentLunchActivities(): unknown[] {
  return [
    {
      id: 'slc-fixture-003',
      actor: FIXTURE_ACTOR,
      createdAt: '2026-10-27T12:05:00.000Z',
      template: { slug: STUDENT_ACTIVITY_REF },
      properties: [
        prop('targetDate', '2026-10-28'),
        prop('mealType', 'regular'),
        prop('mainQuantity', 1),
        prop('vegetarianQuantity', 0),
        prop('soupQuantity', 0),
        prop('dessertQuantity', 0),
        prop('submittedAt', '2026-10-27T12:05:00.000Z'),
      ],
    },
    {
      id: 'slc-fixture-002b',
      actor: FIXTURE_ACTOR,
      createdAt: '2026-10-24T18:40:00.000Z',
      template: { slug: STUDENT_ACTIVITY_REF },
      properties: [
        prop('targetDate', '2026-10-24'),
        prop('mealType', 'no_lunch'),
        prop('mainQuantity', 0),
        prop('vegetarianQuantity', 0),
        prop('soupQuantity', 0),
        prop('dessertQuantity', 0),
        prop('submittedAt', '2026-10-24T18:40:00.000Z'),
      ],
    },
    {
      id: 'slc-fixture-002a',
      actor: FIXTURE_ACTOR,
      createdAt: '2026-10-23T11:00:00.000Z',
      template: { slug: STUDENT_ACTIVITY_REF },
      properties: [
        prop('targetDate', '2026-10-24'),
        prop('mealType', 'regular'),
        prop('mainQuantity', 0),
        prop('vegetarianQuantity', 1),
        prop('soupQuantity', 0),
        prop('dessertQuantity', 0),
        prop('submittedAt', '2026-10-23T11:00:00.000Z'),
      ],
    },
    {
      id: 'slc-fixture-001',
      actor: FIXTURE_ACTOR,
      createdAt: '2026-10-21T09:15:00.000Z',
      template: { slug: STUDENT_ACTIVITY_REF },
      properties: [
        prop('targetDate', '2026-10-22'),
        prop('mealType', 'soup'),
        prop('mainQuantity', 0),
        prop('vegetarianQuantity', 0),
        prop('soupQuantity', 1),
        prop('dessertQuantity', 1),
        prop('submittedAt', '2026-10-21T09:15:00.000Z'),
      ],
    },
  ];
}

export const FIXTURE_STUDENT_JOURNEY_USER = FIXTURE_ACTOR;
