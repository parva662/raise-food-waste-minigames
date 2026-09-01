// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import {
  CHEF_GAMEBUS_DEBUG_LOG_PREFIX,
  logChefTryPostActivityResult,
  summarizeChefActivityMessage,
} from './chefGameBusSubmissionDebug';
import {
  ingestTaskForTests,
  resetGameBusBridgeForTests,
  tryPostChefActivity,
} from '../bridge';
import { pariChefForecastTaskFixture } from '../chefTaskFixtures';
import { buildChefActivityMessage } from '../buildChefActivityMessage';
import type { ChefForecastDraft, ChefForecastSubmission } from '../../chef/types';
import type { DailyMealSlots } from '../../types/mealChoice';

const submission: ChefForecastSubmission = {
  targetDate: '2026-07-29',
  timingStatus: 'on-time',
  submittedAt: '2026-07-28T12:00:00.000Z',
};

const draft: ChefForecastDraft = {
  expectedCustomers: 150,
  mainQuantity: 100,
  vegetarianQuantity: 50,
  soupQuantity: 40,
  dessertQuantity: 25,
  confidence: null,
  notes: '',
};

const slots: DailyMealSlots = {
  main: {
    id: 'chicken-steak-with-pesto-sauce-and-pasta',
    name: 'Chicken steak',
    category: 'classic',
    unit: 'portions',
    maxQuantity: 1000,
    image: '/images/menu/placeholders/classic.webp',
    dietaryTags: [],
  },
  vegetarian: {
    id: 'chickpea-and-apricot-stew-with-pasta',
    name: 'Chickpea stew',
    category: 'vegetarian',
    unit: 'portions',
    maxQuantity: 1000,
    image: '/images/menu/placeholders/vegetarian.webp',
    dietaryTags: [],
  },
  soup: {
    id: 'pike-fish-ball-soup',
    name: 'Pike soup',
    category: 'soup',
    unit: 'portions',
    maxQuantity: 1000,
    image: '/images/menu/placeholders/soup.webp',
    dietaryTags: [],
  },
  dessert: {
    id: 'mango-and-pear-lassi',
    name: 'Mango lassi',
    category: 'dessert',
    unit: 'portions',
    maxQuantity: 1000,
    image: '/images/menu/placeholders/dessert.webp',
    dietaryTags: [],
  },
};

describe('chefGameBusSubmissionDebug', () => {
  beforeEach(() => {
    resetGameBusBridgeForTests();
    window.location.hash = '#/chef';
    ingestTaskForTests(pariChefForecastTaskFixture);
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    resetGameBusBridgeForTests();
    window.location.hash = '';
    vi.restoreAllMocks();
  });

  it('summarizes chef ACTIVITY properties for production logging', () => {
    const message = buildChefActivityMessage(
      pariChefForecastTaskFixture,
      submission,
      draft,
      slots,
    );
    const summary = summarizeChefActivityMessage(message);

    expect(summary.activityTemplate).toBe('chefForecast');
    expect(summary.propertyCount).toBe(12);
    expect(summary.propertyTemplateRefs).toContain('forecastDessert');
    expect(summary.propertyValues.find((entry) => entry.template === 'targetDate')?.obj).toEqual({
      value: '2026-07-29',
    });
  });

  it('logs chef submission diagnostics around postMessage without changing behavior', () => {
    const parentPostMessage = vi.fn();
    const originalParent = window.parent;
    Object.defineProperty(window, 'parent', {
      configurable: true,
      value: { postMessage: parentPostMessage },
    });

    const result = tryPostChefActivity(submission, draft, slots);
    logChefTryPostActivityResult(result);

    Object.defineProperty(window, 'parent', {
      configurable: true,
      value: originalParent,
    });

    expect(result.ok).toBe(true);
    expect(parentPostMessage).toHaveBeenCalledTimes(1);

    const logCalls = vi.mocked(console.log).mock.calls.map((call) => call[0]);
    expect(logCalls.some((line) => String(line).includes(`${CHEF_GAMEBUS_DEBUG_LOG_PREFIX} task`))).toBe(
      true,
    );
    expect(
      logCalls.some((line) => String(line).includes(`${CHEF_GAMEBUS_DEBUG_LOG_PREFIX} sending ACTIVITY`)),
    ).toBe(true);
    expect(
      logCalls.some((line) =>
        String(line).includes(`${CHEF_GAMEBUS_DEBUG_LOG_PREFIX} postMessage returned`),
      ),
    ).toBe(true);
    expect(
      logCalls.some((line) =>
        String(line).includes(`${CHEF_GAMEBUS_DEBUG_LOG_PREFIX} tryPostChefActivity result`),
      ),
    ).toBe(true);
  });
});
