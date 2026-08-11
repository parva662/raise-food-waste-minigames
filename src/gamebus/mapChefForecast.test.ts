/** @vitest-environment jsdom */
import { describe, it, expect, vi } from 'vitest';
import { buildChefActivityMessage } from './buildChefActivityMessage';
import { selectActivityTemplate } from './selectActivityTemplate';
import {
  CHEF_FORECAST_REQUIRED_REFS,
  mapChefForecast,
  mapChefForecastOptional,
  optionalChefForecastPropertyRefsForDraft,
} from './mapChefForecast';
import { propertyRefsForChefForecastActivity } from './resolveChefForecastProperties';
import {
  legacyChefForecastTaskFixture,
  pariChefForecastTaskFixture,
  pariChefForecastRequiredOnlyTaskFixture,
} from './chefTaskFixtures';
import type { DailyMealSlots } from '../types/mealChoice';
import type { ChefForecastCompleteDraft, ChefForecastSubmission } from '../chef/types';
import { resolveMealSlotsForDate } from '../services/mealSlots';
import { MENU_DATES } from '../test/fixtures/dates';
import { validateChefInteger, CHEF_INTEGER_RANGE_ERROR } from '../chef/validation';
import { CHEF_CONFIG } from '../config/chef';
import {
  ingestTaskForTests,
  resetGameBusBridgeForTests,
  tryPostChefActivity,
} from './bridge';
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

const submission: ChefForecastSubmission = {
  targetDate: '2026-07-29',
  timingStatus: 'on-time',
  submittedAt: '2026-07-28T12:00:00.000Z',
};

const draft: ChefForecastCompleteDraft = {
  expectedCustomers: 120,
  mainQuantity: 50,
  vegetarianQuantity: 30,
  soupQuantity: 40,
  dessertQuantity: 25,
  confidence: null,
  notes: '',
};

const draftWithOptional: ChefForecastCompleteDraft = {
  ...draft,
  confidence: 0.75,
  notes: '  Field trip expected  ',
};

function propertyMap(message: ReturnType<typeof buildChefActivityMessage>) {
  return Object.fromEntries(message.data.properties.map((p) => [p.template, p.obj]));
}

const taskFixture = pariChefForecastTaskFixture;

describe('mapChefForecast / buildChefActivityMessage', () => {
  it('builds chefForecast ACTIVITY with all required properties', () => {
    const msg = buildChefActivityMessage(taskFixture, submission, draft, slots);
    expect(msg.data.template).toBe('chefForecast');
    expect(msg.data.properties.map((p) => p.template)).toEqual([
      'targetDate',
      'forecastTotalCustomers',
      'mainItemId',
      'forecastMeat',
      'vegetarianItemId',
      'forecastVegetarian',
      'soupItemId',
      'forecastSoup',
      'dessertItemId',
      'forecastDessert',
      'timingStatus',
      'submittedAt',
    ]);
  });

  it('includes all four item IDs for available menu', () => {
    const msg = buildChefActivityMessage(taskFixture, submission, draft, slots);
    const props = propertyMap(msg);
    expect(props.mainItemId).toEqual({ value: 'meatballs' });
    expect(props.vegetarianItemId).toEqual({ value: 'pasta-primavera' });
    expect(props.soupItemId).toEqual({ value: 'tomato-soup' });
    expect(props.dessertItemId).toEqual({ value: 'yogurt-berries' });
  });

  it('includes zero forecast quantities', () => {
    const zeroDraft: ChefForecastCompleteDraft = {
      expectedCustomers: 0,
      mainQuantity: 0,
      vegetarianQuantity: 0,
      soupQuantity: 0,
      dessertQuantity: 0,
      confidence: null,
      notes: '',
    };
    const msg = buildChefActivityMessage(taskFixture, submission, zeroDraft, slots);
    const props = propertyMap(msg);
    expect(props.forecastMeat).toEqual({ value: 0 });
    expect(props.forecastVegetarian).toEqual({ value: 0 });
    expect(props.forecastSoup).toEqual({ value: 0 });
    expect(props.forecastDessert).toEqual({ value: 0 });
  });

  it('submits correct targetDate, timingStatus and submittedAt', () => {
    const msg = buildChefActivityMessage(taskFixture, submission, draft, slots);
    const props = propertyMap(msg);
    expect(props.targetDate).toEqual({ value: '2026-07-29' });
    expect(props.timingStatus).toEqual({ value: 'on-time' });
    expect(props.submittedAt).toEqual({ value: '2026-07-28T12:00:00.000Z' });
  });

  it('submits main, vegetarian, soup and dessert quantities', () => {
    const values = mapChefForecast(submission, draft, slots);
    expect(values.forecastMeat).toEqual({ value: 50 });
    expect(values.forecastVegetarian).toEqual({ value: 30 });
    expect(values.forecastSoup).toEqual({ value: 40 });
    expect(values.forecastDessert).toEqual({ value: 25 });
    expect(values.forecastTotalCustomers).toEqual({ value: 120 });
  });

  it('uses generated catalogue IDs for known date', () => {
    const runtimeSlots = resolveMealSlotsForDate(MENU_DATES.runtimeWednesday)!;
    const msg = buildChefActivityMessage(
      taskFixture,
      { ...submission, targetDate: MENU_DATES.runtimeWednesday },
      draft,
      runtimeSlots,
    );
    const mainProp = msg.data.properties.find((p) => p.template === 'mainItemId');
    expect(mainProp?.obj).toEqual({ value: runtimeSlots.main.id });
  });

  it('only accepts chefForecast', () => {
    expect(selectActivityTemplate(taskFixture, 'chefForecast').reference).toBe('chefForecast');
  });

  it('missing chefForecast TASK fails clearly', () => {
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
    expect(() => selectActivityTemplate(task, 'chefForecast')).toThrow(/expected chefForecast/);
  });

  it('does not select unrelated activity template', () => {
    const task = {
      ...taskFixture,
      activityTemplates: [
        {
          id: 'student',
          reference: 'studentLunchCheckin',
          name: 'Student',
          providers: [],
        },
        {
          id: 'chef',
          reference: 'chefForecast',
          name: 'Chef',
          providers: [],
        },
      ],
    };
    expect(selectActivityTemplate(task, 'chefForecast').reference).toBe('chefForecast');
    expect(() => selectActivityTemplate(task, 'studentLunchCheckin')).not.toThrow();
  });

  it('omits confidence and notes when not answered', () => {
    const msg = buildChefActivityMessage(taskFixture, submission, draft, slots);
    expect(msg.data.actors).toBeUndefined();
    expect(msg.data.provider).toBeUndefined();
    const keys = msg.data.properties.map((p) => p.template);
    expect(keys).not.toContain('chefId');
    expect(keys).not.toContain('confidence');
    expect(keys).not.toContain('notes');
    expect(keys).not.toContain('result');
    expect(keys).not.toContain('points');
    expect(keys).not.toContain('badge');
    expect(keys).not.toContain('waste');
  });

  it('uses GameBus JSON object shape { template, obj: { value } }', () => {
    const msg = buildChefActivityMessage(taskFixture, submission, draft, slots);
    expect(msg.data.properties[0]).toEqual({
      template: 'targetDate',
      obj: { value: '2026-07-29' },
    });
    expect(msg.data.properties.every((p) => 'obj' in p && 'value' in p.obj)).toBe(true);
  });

  it('message type is ACTIVITY not SILENT_ACTIVITY', () => {
    const msg = buildChefActivityMessage(taskFixture, submission, draft, slots);
    expect(msg.type).toBe('ACTIVITY');
    expect(msg.type).not.toBe('SILENT_ACTIVITY');
  });

  it('legacy TASK missing dessert/timing links still emits all twelve required ACTIVITY properties', () => {
    const msg = buildChefActivityMessage(legacyChefForecastTaskFixture, submission, draft, slots);
    expect(msg.data.properties.map((property) => property.template)).toEqual([
      ...CHEF_FORECAST_REQUIRED_REFS,
    ]);
    const props = propertyMap(msg);
    expect(props.dessertItemId).toEqual({ value: 'yogurt-berries' });
    expect(props.forecastDessert).toEqual({ value: 25 });
    expect(props.timingStatus).toEqual({ value: 'on-time' });
  });

  it('tryPostChefActivity final ACTIVITY contains all twelve required properties', () => {
    resetGameBusBridgeForTests();
    window.location.hash = '#/chef';
    ingestTaskForTests(legacyChefForecastTaskFixture);
    const parentPostMessage = vi.fn();
    const originalParent = window.parent;
    Object.defineProperty(window, 'parent', {
      configurable: true,
      value: { postMessage: parentPostMessage },
    });

    const result = tryPostChefActivity(submission, draft, slots);

    Object.defineProperty(window, 'parent', {
      configurable: true,
      value: originalParent,
    });
    resetGameBusBridgeForTests();
    window.location.hash = '';

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const templates = result.message.data.properties.map((property) => property.template);
    expect(templates).toEqual([...CHEF_FORECAST_REQUIRED_REFS]);
    expect(templates).toContain('dessertItemId');
    expect(templates).toContain('forecastDessert');
    expect(templates).toContain('timingStatus');
    const posted = parentPostMessage.mock.calls[0]?.[0];
    expect(posted.data.properties.map((property: { template: string }) => property.template)).toEqual(
      [...CHEF_FORECAST_REQUIRED_REFS],
    );
  });

  it('double-click does not send two ACTIVITY messages', () => {
    resetGameBusBridgeForTests();
    window.location.hash = '#/chef';
    ingestTaskForTests(taskFixture);
    const parentPostMessage = vi.fn();
    const originalParent = window.parent;
    Object.defineProperty(window, 'parent', {
      configurable: true,
      value: { postMessage: parentPostMessage },
    });

    const first = tryPostChefActivity(submission, draft, slots);
    const second = tryPostChefActivity(submission, draft, slots);

    Object.defineProperty(window, 'parent', {
      configurable: true,
      value: originalParent,
    });
    resetGameBusBridgeForTests();
    window.location.hash = '';

    expect(first.ok).toBe(true);
    expect(second.ok).toBe(false);
    expect(parentPostMessage).toHaveBeenCalledTimes(1);
    expect(parentPostMessage.mock.calls[0][0].type).toBe('ACTIVITY');
  });
});

describe('chefForecast optional properties', () => {
  it('submits without confidence and notes when unanswered', () => {
    const msg = buildChefActivityMessage(taskFixture, submission, draft, slots);
    expect(msg.data.properties.length).toBe(12);
    const props = propertyMap(msg);
    expect(props.confidence).toBeUndefined();
    expect(props.notes).toBeUndefined();
  });

  it('omits unanswered confidence', () => {
    expect(optionalChefForecastPropertyRefsForDraft(draft)).toEqual([]);
    expect(mapChefForecastOptional(draft)).toEqual({});
  });

  it('omits empty notes', () => {
    const emptyNotesDraft: ChefForecastCompleteDraft = { ...draft, notes: '   ' };
    expect(optionalChefForecastPropertyRefsForDraft(emptyNotesDraft)).toEqual([]);
    expect(mapChefForecastOptional(emptyNotesDraft)).toEqual({});
  });

  it('includes confidence with number type from schema', () => {
    const values = mapChefForecastOptional(draftWithOptional);
    expect(values.confidence).toEqual({ value: 0.75 });
    const msg = buildChefActivityMessage(taskFixture, submission, draftWithOptional, slots);
    const props = propertyMap(msg);
    expect(props.confidence).toEqual({ value: 0.75 });
    expect(typeof props.confidence.value).toBe('number');
  });

  it('includes trimmed notes', () => {
    const values = mapChefForecastOptional(draftWithOptional);
    expect(values.notes).toEqual({ value: 'Field trip expected' });
    const msg = buildChefActivityMessage(taskFixture, submission, draftWithOptional, slots);
    const props = propertyMap(msg);
    expect(props.notes).toEqual({ value: 'Field trip expected' });
  });

  it('fails clearly when confidence entered but link missing', () => {
    expect(() =>
      propertyRefsForChefForecastActivity(pariChefForecastRequiredOnlyTaskFixture, {
        ...draft,
        confidence: 0.5,
      }),
    ).toThrow(/missing linked property ref "confidence"/);
  });

  it('fails clearly when notes entered but link missing', () => {
    expect(() =>
      propertyRefsForChefForecastActivity(pariChefForecastRequiredOnlyTaskFixture, {
        ...draft,
        notes: 'Staff shortage',
      }),
    ).toThrow(/missing linked property ref "notes"/);
  });

  it('allows optional templates absent when no optional values entered', () => {
    expect(
      propertyRefsForChefForecastActivity(pariChefForecastRequiredOnlyTaskFixture, draft),
    ).toEqual([
      'targetDate',
      'forecastTotalCustomers',
      'mainItemId',
      'forecastMeat',
      'vegetarianItemId',
      'forecastVegetarian',
      'soupItemId',
      'forecastSoup',
      'dessertItemId',
      'forecastDessert',
      'timingStatus',
      'submittedAt',
    ]);
  });

  it('appends optional refs after required when values present', () => {
    expect(propertyRefsForChefForecastActivity(taskFixture, draftWithOptional)).toEqual([
      'targetDate',
      'forecastTotalCustomers',
      'mainItemId',
      'forecastMeat',
      'vegetarianItemId',
      'forecastVegetarian',
      'soupItemId',
      'forecastSoup',
      'dessertItemId',
      'forecastDessert',
      'timingStatus',
      'submittedAt',
      'confidence',
      'notes',
    ]);
  });

  it('keeps twelve required properties unchanged', () => {
    const msg = buildChefActivityMessage(taskFixture, submission, draftWithOptional, slots);
    const requiredTemplates = msg.data.properties.slice(0, 12).map((p) => p.template);
    expect(requiredTemplates).toEqual([
      'targetDate',
      'forecastTotalCustomers',
      'mainItemId',
      'forecastMeat',
      'vegetarianItemId',
      'forecastVegetarian',
      'soupItemId',
      'forecastSoup',
      'dessertItemId',
      'forecastDessert',
      'timingStatus',
      'submittedAt',
    ]);
  });
});

describe('chef integer validation', () => {
  it('accepts valid integers for expected customers and quantities', () => {
    expect(validateChefInteger(0, 'Expected customers')).toEqual({ ok: true, value: 0 });
    expect(validateChefInteger(500, 'Main portions')).toEqual({ ok: true, value: 500 });
    expect(validateChefInteger('120', 'Expected customers')).toEqual({ ok: true, value: 120 });
  });

  it('rejects negative values', () => {
    const result = validateChefInteger(-1, 'Main portions');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe(CHEF_INTEGER_RANGE_ERROR);
  });

  it('rejects decimal values', () => {
    const result = validateChefInteger('12.5', 'Main portions');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe(CHEF_INTEGER_RANGE_ERROR);
  });

  it('rejects values above configured maximum', () => {
    const result = validateChefInteger(CHEF_CONFIG.maxForecastQuantity + 1, 'Main portions');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe(CHEF_INTEGER_RANGE_ERROR);
  });
});

describe('student tests remain independent', () => {
  it('student fixture still maps studentLunchCheckin only', () => {
    expect(selectActivityTemplate(pariStudentLunchTaskFixture).reference).toBe(
      'studentLunchCheckin',
    );
  });
});
