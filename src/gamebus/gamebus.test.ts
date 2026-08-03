/** @vitest-environment jsdom */
import { describe, it, expect, vi } from 'vitest';
import { buildActivityMessage } from './buildActivityMessage';
import {
  ingestTaskForTests,
  resetGameBusBridgeForTests,
  tryPostActivity,
} from './bridge';
import { pariStudentLunchTaskFixture } from './taskFixtures';
import type { ActiveDeclaration } from '../types/declaration';
import type { DailyMealSlots, MealDraft } from '../types/mealChoice';
import { CANTEEN_CONFIG } from '../config/canteen';

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
    lunchDate: '2026-07-29',
    menuCycleWeek: 2,
    menuVersion: 'excel-dated-menu',
    mealChoice: 'regular',
    regularMainSelected: true,
    regularVegetarianSelected: false,
    noLunch: false,
    selections: [],
    timingStatus: 'on-time',
    basePoints: 20,
    timingAdjustment: 5,
    totalPoints: 25,
    submittedAt: '2026-07-28T12:00:00.000Z',
    updatedAt: '2026-07-28T12:00:00.000Z',
    includeInForecast: true,
    ...overrides,
  };
}

describe('buildActivityMessage integration', () => {
  it('builds studentLunchCheckin ACTIVITY from TASK linkedProperties', () => {
    const draft: MealDraft = {
      mealChoice: 'regular',
      mainQuantity: 1,
      vegetarianQuantity: 0,
      soupQuantity: 0,
      dessertQuantity: 0,
    };
    const message = buildActivityMessage(pariStudentLunchTaskFixture, baseDeclaration(), draft, slots);
    expect(message.type).toBe('ACTIVITY');
    expect(message.data.template).toBe('studentLunchCheckin');
    expect(message.data.properties[0]).toEqual({
      template: 'targetDate',
      obj: { value: '2026-07-29' },
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
    expect(message.data.properties.map((p) => p.template)).toContain('mealType');
  });

  it('blocks duplicate ACTIVITY submission via bridge guard', () => {
    resetGameBusBridgeForTests();
    const parentPostMessage = vi.fn();
    const originalParent = window.parent;
    Object.defineProperty(window, 'parent', {
      configurable: true,
      value: { postMessage: parentPostMessage },
    });

    ingestTaskForTests(pariStudentLunchTaskFixture);
    const draft: MealDraft = {
      mealChoice: 'regular',
      mainQuantity: 1,
      vegetarianQuantity: 0,
      soupQuantity: 0,
      dessertQuantity: 0,
    };
    const declaration = baseDeclaration();
    const first = tryPostActivity(declaration, draft, slots);
    expect(first.ok).toBe(true);
    const second = tryPostActivity(declaration, draft, slots);
    expect(second.ok).toBe(false);
    if (!second.ok) expect(second.reason).toBe('duplicate');

    Object.defineProperty(window, 'parent', { configurable: true, value: originalParent });
    resetGameBusBridgeForTests();
  });
});
