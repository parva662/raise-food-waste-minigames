/** @vitest-environment jsdom */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getGameBusInputCollections,
  getGameBusTask,
  ingestInputCollectionsForTests,
  ingestTaskForTests,
  resetGameBusBridgeForTests,
  startGameBusHandshake,
  tryPostActivity,
} from './bridge';
import {
  getInputCollectionKeys,
  getRawChefForecastsInput,
  SERVICE_CLOSEOUT_CHEF_FORECASTS_REQUEST_KEY,
  SERVICE_CLOSEOUT_INPUT_COLLECTION_KEY,
  SERVICE_CLOSEOUT_INPUTS_COLLECTION_KEY_LEGACY,
} from './inputCollections';
import { pariStudentLunchTaskFixture } from './taskFixtures';
import type { GameBusInputCollectionsPayload } from './types';
import type { ActiveDeclaration } from '../types/declaration';
import type { DailyMealSlots, MealDraft } from '../types/mealChoice';
import { CANTEEN_CONFIG } from '../config/canteen';

const rawChefForecastsFixture = {
  docs: [{ id: 'forecast-1', template: 'chefForecast' }],
  totalDocs: 1,
};

const nestedInputCollections: GameBusInputCollectionsPayload = {
  [SERVICE_CLOSEOUT_INPUT_COLLECTION_KEY]: {
    [SERVICE_CLOSEOUT_CHEF_FORECASTS_REQUEST_KEY]: rawChefForecastsFixture,
  },
};

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

function baseDeclaration(): ActiveDeclaration {
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
  };
}

describe('GameBus INPUT_COLLECTIONS', () => {
  let parentPostMessage: ReturnType<typeof vi.fn>;
  let originalParent: Window;

  beforeEach(() => {
    resetGameBusBridgeForTests();
    parentPostMessage = vi.fn();
    originalParent = window.parent;
    Object.defineProperty(window, 'parent', {
      configurable: true,
      value: { postMessage: parentPostMessage },
    });
  });

  afterEach(() => {
    resetGameBusBridgeForTests();
    Object.defineProperty(window, 'parent', {
      configurable: true,
      value: originalParent,
    });
  });

  it('accepts INPUT_COLLECTIONS from parent and preserves raw payload', () => {
    const cleanup = startGameBusHandshake();

    window.dispatchEvent(
      new MessageEvent('message', {
        data: { type: 'INPUT_COLLECTIONS', data: nestedInputCollections },
        source: window.parent as Window,
      }),
    );

    expect(getGameBusInputCollections()).toEqual(nestedInputCollections);
    expect(getInputCollectionKeys(getGameBusInputCollections())).toEqual([
      SERVICE_CLOSEOUT_INPUT_COLLECTION_KEY,
    ]);
    expect(getRawChefForecastsInput(getGameBusInputCollections())).toEqual(
      rawChefForecastsFixture,
    );
    cleanup();
  });

  it('defaults missing data to an empty object', () => {
    const cleanup = startGameBusHandshake();

    window.dispatchEvent(
      new MessageEvent('message', {
        data: { type: 'INPUT_COLLECTIONS' },
        source: window.parent as Window,
      }),
    );

    expect(getGameBusInputCollections()).toEqual({});
    cleanup();
  });

  it('replaces prior INPUT_COLLECTIONS on each message', () => {
    const cleanup = startGameBusHandshake();
    ingestInputCollectionsForTests(nestedInputCollections);

    const replacement: GameBusInputCollectionsPayload = {
      [SERVICE_CLOSEOUT_INPUT_COLLECTION_KEY]: {
        [SERVICE_CLOSEOUT_CHEF_FORECASTS_REQUEST_KEY]: { docs: [], totalDocs: 0 },
      },
    };

    window.dispatchEvent(
      new MessageEvent('message', {
        data: { type: 'INPUT_COLLECTIONS', data: replacement },
        source: window.parent as Window,
      }),
    );

    expect(getGameBusInputCollections()).toEqual(replacement);
    expect(getRawChefForecastsInput(getGameBusInputCollections())).toEqual({
      docs: [],
      totalDocs: 0,
    });
    cleanup();
  });

  it('still accepts TASK after INPUT_COLLECTIONS', () => {
    const cleanup = startGameBusHandshake();

    window.dispatchEvent(
      new MessageEvent('message', {
        data: { type: 'INPUT_COLLECTIONS', data: nestedInputCollections },
        source: window.parent as Window,
      }),
    );

    window.dispatchEvent(
      new MessageEvent('message', {
        data: { type: 'TASK', data: pariStudentLunchTaskFixture },
        source: window.parent as Window,
      }),
    );

    expect(getGameBusInputCollections()).toEqual(nestedInputCollections);
    expect(getGameBusTask()).toEqual(pariStudentLunchTaskFixture);
    cleanup();
  });

  it('does not clear TASK when INPUT_COLLECTIONS arrives later', () => {
    const cleanup = startGameBusHandshake();
    ingestTaskForTests(pariStudentLunchTaskFixture);

    window.dispatchEvent(
      new MessageEvent('message', {
        data: { type: 'INPUT_COLLECTIONS', data: nestedInputCollections },
        source: window.parent as Window,
      }),
    );

    expect(getGameBusTask()).toEqual(pariStudentLunchTaskFixture);
    expect(getGameBusInputCollections()).toEqual(nestedInputCollections);
    cleanup();
  });

  it('keeps student ACTIVITY posting unchanged when INPUT_COLLECTIONS is present', () => {
    ingestTaskForTests(pariStudentLunchTaskFixture);
    ingestInputCollectionsForTests(nestedInputCollections);

    const draft: MealDraft = {
      mealChoice: 'regular',
      mainQuantity: 1,
      vegetarianQuantity: 0,
      soupQuantity: 0,
      dessertQuantity: 0,
    };

    const result = tryPostActivity(baseDeclaration(), draft, slots);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.message.type).toBe('ACTIVITY');
      expect(result.message.data.template).toBe('studentLunchCheckin');
    }
    expect(parentPostMessage).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'ACTIVITY' }),
      '*',
    );
  });

  it('ignores INPUT_COLLECTIONS messages not from parent', () => {
    window.dispatchEvent(
      new MessageEvent('message', {
        data: { type: 'INPUT_COLLECTIONS', data: nestedInputCollections },
        source: window,
      }),
    );

    expect(getGameBusInputCollections()).toBeNull();
  });
});

describe('inputCollections accessors', () => {
  it('returns empty keys for null payload', () => {
    expect(getInputCollectionKeys(null)).toEqual([]);
    expect(getRawChefForecastsInput(null)).toBeUndefined();
  });

  it('reads canonical serviceCloseoutInput.chefForecasts', () => {
    const payload: GameBusInputCollectionsPayload = {
      [SERVICE_CLOSEOUT_INPUT_COLLECTION_KEY]: {
        [SERVICE_CLOSEOUT_CHEF_FORECASTS_REQUEST_KEY]: rawChefForecastsFixture,
      },
    };
    expect(getRawChefForecastsInput(payload)).toEqual(rawChefForecastsFixture);
  });

  it('reads legacy serviceCloseoutInputs.chefForecasts for backwards compatibility', () => {
    const payload: GameBusInputCollectionsPayload = {
      [SERVICE_CLOSEOUT_INPUTS_COLLECTION_KEY_LEGACY]: {
        [SERVICE_CLOSEOUT_CHEF_FORECASTS_REQUEST_KEY]: rawChefForecastsFixture,
      },
    };
    expect(getRawChefForecastsInput(payload)).toEqual(rawChefForecastsFixture);
  });

  it('prefers canonical serviceCloseoutInput when both nested keys are present', () => {
    const canonical = { docs: [{ id: 'canonical' }], totalDocs: 1 };
    const legacy = { docs: [{ id: 'legacy' }], totalDocs: 1 };
    const payload: GameBusInputCollectionsPayload = {
      [SERVICE_CLOSEOUT_INPUT_COLLECTION_KEY]: {
        [SERVICE_CLOSEOUT_CHEF_FORECASTS_REQUEST_KEY]: canonical,
      },
      [SERVICE_CLOSEOUT_INPUTS_COLLECTION_KEY_LEGACY]: {
        [SERVICE_CLOSEOUT_CHEF_FORECASTS_REQUEST_KEY]: legacy,
      },
    };
    expect(getRawChefForecastsInput(payload)).toEqual(canonical);
  });

  it('reads flat chefForecasts when collection nesting is absent', () => {
    const flat: GameBusInputCollectionsPayload = {
      [SERVICE_CLOSEOUT_CHEF_FORECASTS_REQUEST_KEY]: rawChefForecastsFixture,
    };
    expect(getRawChefForecastsInput(flat)).toEqual(rawChefForecastsFixture);
  });
});
