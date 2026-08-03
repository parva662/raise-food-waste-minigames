import { describe, it, expect } from 'vitest';
import { buildActivityMessage, selectActivityTemplate } from './buildActivityMessage';
import { mapStudentLunchCheckin } from './mapStudentLunchCheckin';
import type { ActiveDeclaration } from '../types/declaration';
import type { DailyMealSlots, MealDraft } from '../types/mealChoice';
import { CANTEEN_CONFIG } from '../config/canteen';
import { pariStudentLunchTaskFixture } from './taskFixtures';
import { resolveMealSlotsForDate } from '../services/mealSlots';
import { MENU_DATES } from '../test/fixtures/dates';

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

function propertyMap(message: ReturnType<typeof buildActivityMessage>) {
  return Object.fromEntries(message.data.properties.map((p) => [p.template, p.obj]));
}

const taskFixture = pariStudentLunchTaskFixture;

describe('mapStudentLunchCheckin / buildActivityMessage', () => {
  it('regular main only', () => {
    const draft: MealDraft = {
      mealChoice: 'regular',
      mainQuantity: 2,
      vegetarianQuantity: 0,
      soupQuantity: 0,
      dessertQuantity: 0,
    };
    const values = mapStudentLunchCheckin(baseDeclaration(), draft, slots);
    expect(values.mainItemId).toEqual({ value: 'meatballs' });
    expect(values.vegetarianItemId).toBeUndefined();
    const msg = buildActivityMessage(taskFixture, baseDeclaration(), draft, slots);
    expect(msg.data.template).toBe('studentLunchCheckin');
    expect(msg.data.properties.map((p) => p.template)).toContain('mainItemId');
    expect(msg.data.properties.map((p) => p.template)).not.toContain('vegetarianItemId');
  });

  it('regular vegetarian only', () => {
    const draft: MealDraft = {
      mealChoice: 'regular',
      mainQuantity: 0,
      vegetarianQuantity: 1,
      soupQuantity: 0,
      dessertQuantity: 0,
    };
    const values = mapStudentLunchCheckin(baseDeclaration(), draft, slots);
    expect(values.mainItemId).toBeUndefined();
    expect(values.vegetarianItemId).toEqual({ value: 'pasta-primavera' });
  });

  it('regular main and vegetarian', () => {
    const draft: MealDraft = {
      mealChoice: 'regular',
      mainQuantity: 1,
      vegetarianQuantity: 2,
      soupQuantity: 0,
      dessertQuantity: 0,
    };
    const msg = buildActivityMessage(taskFixture, baseDeclaration(), draft, slots);
    expect(msg.data.properties.map((p) => p.template)).toEqual([
      'targetDate',
      'mealType',
      'mainItemId',
      'mainQuantity',
      'vegetarianItemId',
      'vegetarianQuantity',
      'soupQuantity',
      'dessertQuantity',
      'timingStatus',
      'submittedAt',
    ]);
  });

  it('soup only', () => {
    const draft: MealDraft = {
      mealChoice: 'soup',
      mainQuantity: 0,
      vegetarianQuantity: 0,
      soupQuantity: 1,
      dessertQuantity: 0,
    };
    const values = mapStudentLunchCheckin(baseDeclaration({ mealChoice: 'soup' }), draft, slots);
    expect(values.soupItemId).toEqual({ value: 'tomato-soup' });
    expect(values.dessertItemId).toBeUndefined();
  });

  it('dessert only on soup path', () => {
    const draft: MealDraft = {
      mealChoice: 'soup',
      mainQuantity: 0,
      vegetarianQuantity: 0,
      soupQuantity: 0,
      dessertQuantity: 2,
    };
    const values = mapStudentLunchCheckin(baseDeclaration({ mealChoice: 'soup' }), draft, slots);
    expect(values.dessertItemId).toEqual({ value: 'yogurt-berries' });
  });

  it('soup and dessert', () => {
    const draft: MealDraft = {
      mealChoice: 'soup',
      mainQuantity: 0,
      vegetarianQuantity: 0,
      soupQuantity: 1,
      dessertQuantity: 1,
    };
    const msg = buildActivityMessage(
      taskFixture,
      baseDeclaration({ mealChoice: 'soup' }),
      draft,
      slots,
    );
    const templates = msg.data.properties.map((p) => p.template);
    expect(templates).toContain('soupItemId');
    expect(templates).toContain('dessertItemId');
  });

  it('no lunch', () => {
    const draft: MealDraft = {
      mealChoice: 'no_lunch',
      mainQuantity: 0,
      vegetarianQuantity: 0,
      soupQuantity: 0,
      dessertQuantity: 0,
    };
    const msg = buildActivityMessage(
      taskFixture,
      baseDeclaration({ mealChoice: 'no_lunch', noLunch: true }),
      draft,
      slots,
    );
    const props = propertyMap(msg);
    expect(props.mealType).toEqual({ value: 'no_lunch' });
    expect(msg.data.properties.map((p) => p.template)).not.toContain('mainItemId');
  });

  it('always includes all four quantity properties', () => {
    const draft: MealDraft = {
      mealChoice: 'no_lunch',
      mainQuantity: 0,
      vegetarianQuantity: 0,
      soupQuantity: 0,
      dessertQuantity: 0,
    };
    const props = propertyMap(buildActivityMessage(taskFixture, baseDeclaration(), draft, slots));
    expect(props.mainQuantity).toEqual({ value: 0 });
    expect(props.vegetarianQuantity).toEqual({ value: 0 });
    expect(props.soupQuantity).toEqual({ value: 0 });
    expect(props.dessertQuantity).toEqual({ value: 0 });
  });

  it('omits unselected item IDs', () => {
    const draft: MealDraft = {
      mealChoice: 'regular',
      mainQuantity: 1,
      vegetarianQuantity: 0,
      soupQuantity: 0,
      dessertQuantity: 0,
    };
    const msg = buildActivityMessage(taskFixture, baseDeclaration(), draft, slots);
    expect(msg.data.properties.map((p) => p.template)).not.toContain('vegetarianItemId');
  });

  it('includes selected item IDs', () => {
    const draft: MealDraft = {
      mealChoice: 'regular',
      mainQuantity: 1,
      vegetarianQuantity: 0,
      soupQuantity: 0,
      dessertQuantity: 0,
    };
    expect(propertyMap(buildActivityMessage(taskFixture, baseDeclaration(), draft, slots)).mainItemId).toEqual({
      value: 'meatballs',
    });
  });

  it('missing selected item-ID property template fails clearly', () => {
    const draft: MealDraft = {
      mealChoice: 'regular',
      mainQuantity: 1,
      vegetarianQuantity: 0,
      soupQuantity: 0,
      dessertQuantity: 0,
    };
    const taskWithoutMainId = {
      ...taskFixture,
      activityTemplates: [
        {
          ...taskFixture.activityTemplates![0],
          linkedProperties: taskFixture.activityTemplates![0].linkedProperties!.filter(
            (p) => p.ref !== 'mainItemId',
          ),
        },
      ],
    };
    expect(() => buildActivityMessage(taskWithoutMainId, baseDeclaration(), draft, slots)).toThrow(
      /missing linked property ref "mainItemId"/,
    );
  });

  it('missing optional unselected item-ID property is accepted locally', () => {
    const draft: MealDraft = {
      mealChoice: 'regular',
      mainQuantity: 1,
      vegetarianQuantity: 0,
      soupQuantity: 0,
      dessertQuantity: 0,
    };
    const taskWithoutVegId = {
      ...taskFixture,
      activityTemplates: [
        {
          ...taskFixture.activityTemplates![0],
          linkedProperties: taskFixture.activityTemplates![0].linkedProperties!.filter(
            (p) => p.ref !== 'vegetarianItemId',
          ),
        },
      ],
    };
    expect(() =>
      buildActivityMessage(taskWithoutVegId, baseDeclaration(), draft, slots),
    ).not.toThrow();
  });

  it('only accepts studentLunchCheckin', () => {
    expect(selectActivityTemplate(taskFixture).reference).toBe('studentLunchCheckin');
  });

  it('does not support studentLunchCheckinV2', () => {
    const task = {
      ...taskFixture,
      activityTemplates: [
        {
          id: 'v2',
          reference: 'studentLunchCheckinV2',
          name: 'V2',
          providers: [],
        },
      ],
    };
    expect(() => selectActivityTemplate(task)).toThrow(/expected studentLunchCheckin/);
  });

  it('unsupported activity templates fail clearly', () => {
    const task = {
      ...taskFixture,
      activityTemplates: [
        {
          id: 'other',
          reference: 'otherActivity',
          name: 'Other',
          providers: [],
        },
      ],
    };
    expect(() =>
      buildActivityMessage(task, baseDeclaration(), {} as MealDraft, slots),
    ).toThrow(/expected studentLunchCheckin/);
  });

  it('does not emit old sentinel property names or values', () => {
    const draft: MealDraft = {
      mealChoice: 'regular',
      mainQuantity: 1,
      vegetarianQuantity: 0,
      soupQuantity: 0,
      dessertQuantity: 0,
    };
    const msg = buildActivityMessage(taskFixture, baseDeclaration(), draft, slots);
    const templates = msg.data.properties.map((p) => p.template);
    expect(templates).not.toContain('comingStatus');
    expect(templates).not.toContain('selectedMain');
    const serialized = JSON.stringify(msg);
    expect(serialized).not.toContain('noMain');
    expect(serialized).not.toContain('noVeg');
    expect(serialized).not.toContain('noSoup');
    expect(serialized).not.toContain('noDessert');
  });

  it('excludes studentId, actors, provider, and scoring properties', () => {
    const draft: MealDraft = {
      mealChoice: 'regular',
      mainQuantity: 1,
      vegetarianQuantity: 0,
      soupQuantity: 0,
      dessertQuantity: 0,
    };
    const msg = buildActivityMessage(taskFixture, baseDeclaration(), draft, slots);
    expect(msg.data.actors).toBeUndefined();
    expect(msg.data.provider).toBeUndefined();
    const keys = msg.data.properties.map((p) => p.template);
    expect(keys).not.toContain('studentId');
    expect(keys).not.toContain('basePoints');
    expect(keys).not.toContain('timingAdjustment');
    expect(keys).not.toContain('totalPoints');
  });

  it('uses GameBus JSON object shape { template, obj: { value } }', () => {
    const draft: MealDraft = {
      mealChoice: 'regular',
      mainQuantity: 2,
      vegetarianQuantity: 0,
      soupQuantity: 0,
      dessertQuantity: 0,
    };
    const msg = buildActivityMessage(taskFixture, baseDeclaration(), draft, slots);
    expect(msg.data.properties[0]).toEqual({
      template: 'targetDate',
      obj: { value: '2026-07-29' },
    });
    expect(msg.data.properties.find((p) => p.template === 'mainQuantity')).toEqual({
      template: 'mainQuantity',
      obj: { value: 2 },
    });
    expect(msg.data.properties.every((p) => 'obj' in p && 'value' in p.obj)).toBe(true);
    expect(msg.data.properties.some((p) => 'value' in p && !('obj' in p))).toBe(false);
  });

  it('message type remains ACTIVITY with valid timestamps', () => {
    const draft: MealDraft = {
      mealChoice: 'regular',
      mainQuantity: 1,
      vegetarianQuantity: 0,
      soupQuantity: 0,
      dessertQuantity: 0,
    };
    const msg = buildActivityMessage(taskFixture, baseDeclaration(), draft, slots);
    expect(msg.type).toBe('ACTIVITY');
    expect(new Date(msg.data.end).getTime()).toBeGreaterThan(new Date(msg.data.start).getTime());
  });

  it('uses generated menu catalogue IDs in submitted item IDs', () => {
    const runtimeSlots = resolveMealSlotsForDate(MENU_DATES.runtimeWednesday)!;
    const draft: MealDraft = {
      mealChoice: 'regular',
      mainQuantity: 1,
      vegetarianQuantity: 0,
      soupQuantity: 0,
      dessertQuantity: 0,
    };
    const msg = buildActivityMessage(
      taskFixture,
      baseDeclaration({ lunchDate: MENU_DATES.runtimeWednesday }),
      draft,
      runtimeSlots,
    );
    const mainProp = msg.data.properties.find((p) => p.template === 'mainItemId');
    expect(mainProp?.obj).toEqual({ value: runtimeSlots.main.id });
  });

  it('message type is ACTIVITY not SILENT_ACTIVITY', () => {
    const draft: MealDraft = {
      mealChoice: 'regular',
      mainQuantity: 1,
      vegetarianQuantity: 0,
      soupQuantity: 0,
      dessertQuantity: 0,
    };
    const msg = buildActivityMessage(taskFixture, baseDeclaration(), draft, slots);
    expect(msg.type).toBe('ACTIVITY');
    expect(msg.type).not.toBe('SILENT_ACTIVITY');
  });
});
