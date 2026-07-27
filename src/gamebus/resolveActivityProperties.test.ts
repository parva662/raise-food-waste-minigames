import { describe, it, expect } from 'vitest';
import { buildActivityMessage } from './buildActivityMessage';
import { STUDENT_LUNCH_CHECKIN_REFS } from './mapStudentLunchCheckinLegacy';
import {
  assertStudentLunchCheckinActivity,
  propertyRefsForStudentLunchActivity,
  resolveLinkedPropertyRefs,
  resolvePropertyRefsForActivity,
  STUDENT_LUNCH_CHECKIN_REF,
} from './resolveActivityProperties';
import { pariStudentLunchTaskFixture } from './taskFixtures';
import type { TaskActivityTemplate, TaskData } from './types';
import type { ActiveDeclaration } from '../types/declaration';
import type { DailyMealSlots } from '../types/mealChoice';

const legacyOrder = [...STUDENT_LUNCH_CHECKIN_REFS];

function minimalStudentLunchTask(
  activityOverrides: Partial<TaskActivityTemplate> = {},
): TaskData {
  return {
    ...pariStudentLunchTaskFixture,
    activityTemplates: [
      {
        id: '019f9404-88ec-7f31-89d6-8b2cbfbcab4f',
        reference: STUDENT_LUNCH_CHECKIN_REF,
        name: 'Student lunch check-in',
        providers: [],
        ...activityOverrides,
      },
    ],
    propertyTemplates: [
      {
        id: 'partial-only-targetDate',
        reference: 'targetDate',
        name: 'Target date',
        schema: {},
        defaultVisibility: 'public',
      },
    ],
  };
}

describe('resolveActivityProperties', () => {
  it('reads property refs from linkedProperties[].ref', () => {
    const activity = pariStudentLunchTaskFixture.activityTemplates[0];
    expect(resolveLinkedPropertyRefs(activity)).toEqual(legacyOrder);
  });

  it('reads property refs from linkedProperties[].reference', () => {
    const activity: TaskActivityTemplate = {
      id: 'a1',
      reference: STUDENT_LUNCH_CHECKIN_REF,
      name: 'Check-in',
      providers: [],
      linkedProperties: legacyOrder.map((reference, index) => ({
        order: index + 1,
        reference,
      })),
    };
    expect(resolveLinkedPropertyRefs(activity)).toEqual(legacyOrder);
  });

  it('resolver may return partial TASK.data.propertyTemplates for diagnostics', () => {
    const task = minimalStudentLunchTask({ linkedProperties: undefined, properties: undefined });
    expect(resolvePropertyRefsForActivity(task, STUDENT_LUNCH_CHECKIN_REF)).toEqual(['targetDate']);
  });

  it('propertyRefsForStudentLunchActivity always returns all seven legacy refs', () => {
    const task = minimalStudentLunchTask({ linkedProperties: undefined, properties: undefined });
    expect(propertyRefsForStudentLunchActivity(task)).toEqual(legacyOrder);
  });

  it('keeps stable ACTIVITY property order for studentLunchCheckin', () => {
    const task = minimalStudentLunchTask({ linkedProperties: undefined, properties: undefined });
    const refs = propertyRefsForStudentLunchActivity(task);
    expect(refs.map(String)).toEqual([
      'targetDate',
      'comingStatus',
      'selectedMain',
      'selectedVegetarianOrNoVeg',
      'selectedSoupOrNoSoup',
      'selectedDessertOrNoDessert',
      'submittedAt',
    ]);
  });

  it('fails safely when studentLunchCheckin activity template is missing', () => {
    const task: TaskData = {
      ...pariStudentLunchTaskFixture,
      activityTemplates: [
        {
          id: 'other',
          reference: 'otherActivity',
          name: 'Other',
          providers: [],
        },
      ],
    };
    expect(() => assertStudentLunchCheckinActivity(task, STUDENT_LUNCH_CHECKIN_REF)).toThrow(
      /not found on TASK/,
    );
    expect(() => buildActivityMessage(task, {} as never, {} as never, {} as never)).toThrow();
  });
});

describe('buildActivityMessage sparse TASK.data.propertyTemplates', () => {
  it('does not truncate ACTIVITY properties when top-level list is sparse', () => {
    const task = minimalStudentLunchTask({ linkedProperties: undefined, properties: undefined });
    const draft = {
      mealChoice: 'regular' as const,
      mainQuantity: 1,
      vegetarianQuantity: 0,
      soupQuantity: 0,
      dessertQuantity: 0,
    };
    const declaration: ActiveDeclaration = {
      studentId: 's1',
      lunchDate: '2026-01-07',
      menuCycleWeek: 1,
      menuVersion: 'v1',
      mealChoice: 'regular' as const,
      regularMainSelected: true,
      regularVegetarianSelected: false,
      noLunch: false,
      selections: [],
      timingStatus: 'on-time' as const,
      basePoints: 20,
      timingAdjustment: 5 as const,
      totalPoints: 25,
      submittedAt: '2026-01-06T12:00:00.000Z',
      updatedAt: '2026-01-06T12:00:00.000Z',
      includeInForecast: true as const,
    };
    const slots = {
      main: {
        id: 'meatballs',
        name: 'Meatballs',
        category: 'classic',
        unit: 'pieces',
        maxQuantity: 6,
        image: '',
        dietaryTags: [],
      },
      vegetarian: {
        id: 'veg',
        name: 'Veg',
        category: 'vegetarian',
        unit: 'portion',
        maxQuantity: 3,
        image: '',
        dietaryTags: [],
      },
      soup: {
        id: 'soup',
        name: 'Soup',
        category: 'soup',
        unit: 'cups',
        maxQuantity: 2,
        image: '',
        dietaryTags: [],
      },
      dessert: {
        id: 'dessert',
        name: 'Dessert',
        category: 'dessert',
        unit: 'pieces',
        maxQuantity: 2,
        image: '',
        dietaryTags: [],
      },
    } as DailyMealSlots;
    const message = buildActivityMessage(task, declaration, draft, slots);

    expect(message.data.properties).toHaveLength(7);
    expect(message.data.properties.map((p) => p.template)).toEqual(legacyOrder);
  });
});
