import { describe, it, expect } from 'vitest';
import { mapStudentLunchCheckinLegacy, LEGACY_NO_VEG } from './mapStudentLunchCheckinLegacy';
import { buildActivityMessage } from './buildActivityMessage';
import type { ActiveDeclaration } from '../types/declaration';
import type { DailyMealSlots, MealDraft } from '../types/mealChoice';
import { CANTEEN_CONFIG } from '../config/canteen';
import { pariStudentLunchTaskFixture } from './taskFixtures';

const slots: DailyMealSlots = {
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
    id: 'pasta-primavera',
    name: 'Pasta',
    category: 'vegetarian',
    unit: 'portion',
    maxQuantity: 3,
    image: '',
    dietaryTags: [],
  },
  soup: {
    id: 'tomato-soup',
    name: 'Tomato Soup',
    category: 'soup',
    unit: 'cups',
    maxQuantity: 2,
    image: '',
    dietaryTags: [],
  },
  dessert: {
    id: 'yogurt-berries',
    name: 'Yogurt',
    category: 'dessert',
    unit: 'pieces',
    maxQuantity: 2,
    image: '',
    dietaryTags: [],
  },
};

function baseDeclaration(overrides: Partial<ActiveDeclaration> = {}): ActiveDeclaration {
  return {
    studentId: CANTEEN_CONFIG.studentId,
    lunchDate: '2026-01-07',
    menuCycleWeek: 1,
    menuVersion: '2026-v1',
    mealChoice: 'regular',
    regularMainSelected: true,
    regularVegetarianSelected: false,
    noLunch: false,
    selections: [],
    timingStatus: 'on-time',
    basePoints: 20,
    timingAdjustment: 5,
    totalPoints: 25,
    submittedAt: '2026-01-06T12:00:00.000Z',
    updatedAt: '2026-01-06T12:00:00.000Z',
    includeInForecast: true,
    ...overrides,
  };
}

const taskFixture = pariStudentLunchTaskFixture;

describe('mapStudentLunchCheckinLegacy', () => {
  it('maps regular main selection', () => {
    const draft: MealDraft = {
      mealChoice: 'regular',
      mainQuantity: 2,
      vegetarianQuantity: 0,
      soupQuantity: 0,
      dessertQuantity: 0,
    };
    const values = mapStudentLunchCheckinLegacy(baseDeclaration(), draft, slots);
    expect(values.selectedMain.value).toBe('meatballs');
    expect(values.selectedVegetarianOrNoVeg.value).toBe(LEGACY_NO_VEG);
    expect(values.comingStatus.value).toBe('coming');
  });

  it('maps no lunch', () => {
    const draft: MealDraft = {
      mealChoice: 'no_lunch',
      mainQuantity: 0,
      vegetarianQuantity: 0,
      soupQuantity: 0,
      dessertQuantity: 0,
    };
    const values = mapStudentLunchCheckinLegacy(
      baseDeclaration({ mealChoice: 'no_lunch', noLunch: true }),
      draft,
      slots,
    );
    expect(values.comingStatus.value).toBe('not_coming');
  });
});

describe('buildActivityMessage', () => {
  it('builds ACTIVITY with seven properties from activity linkedProperties', () => {
    const draft: MealDraft = {
      mealChoice: 'regular',
      mainQuantity: 1,
      vegetarianQuantity: 0,
      soupQuantity: 0,
      dessertQuantity: 0,
    };
    const message = buildActivityMessage(taskFixture, baseDeclaration(), draft, slots);
    expect(message.type).toBe('ACTIVITY');
    expect(message.data.template).toBe('studentLunchCheckin');
    expect(message.data.properties).toHaveLength(7);
    expect(message.data.properties[0]).toEqual({
      template: 'targetDate',
      obj: { value: '2026-01-07' },
    });
  });

  it('does not require TASK.data.propertyTemplates when activity defines linkedProperties', () => {
    const draft: MealDraft = {
      mealChoice: 'regular',
      mainQuantity: 1,
      vegetarianQuantity: 0,
      soupQuantity: 0,
      dessertQuantity: 0,
    };
    const taskWithPartialTopLevel = {
      ...pariStudentLunchTaskFixture,
      propertyTemplates: [{ id: 'x', reference: 'targetDate', name: 'x', schema: {}, defaultVisibility: 'public' }],
    };
    const message = buildActivityMessage(taskWithPartialTopLevel, baseDeclaration(), draft, slots);
    expect(message.data.properties).toHaveLength(7);
  });
});
