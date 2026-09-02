// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import {
  STUDENT_GAMEBUS_DEBUG_LOG_PREFIX,
  logStudentSubmissionException,
  logStudentTryPostActivityResult,
  summarizeStudentActivityMessage,
} from './studentGameBusSubmissionDebug';
import {
  ingestTaskForTests,
  resetGameBusBridgeForTests,
  tryPostActivity,
} from '../bridge';
import { buildActivityMessage } from '../buildActivityMessage';
import { pariStudentLunchTaskFixture } from '../taskFixtures';
import { CANTEEN_CONFIG } from '../../config/canteen';
import type { ActiveDeclaration } from '../../types/declaration';
import type { DailyMealSlots, MealDraft } from '../../types/mealChoice';

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

const draft: MealDraft = {
  mealChoice: 'regular',
  mainQuantity: 1,
  vegetarianQuantity: 0,
  soupQuantity: 0,
  dessertQuantity: 0,
};

const declaration: ActiveDeclaration = {
  studentId: CANTEEN_CONFIG.studentId,
  lunchDate: '2026-07-29',
  menuCycleWeek: 2,
  menuVersion: 'excel-dated-menu',
  mealChoice: 'regular',
  regularMainSelected: true,
  regularVegetarianSelected: false,
  noLunch: false,
  selections: [],
  submittedAt: '2026-07-28T12:00:00.000Z',
  updatedAt: '2026-07-28T12:00:00.000Z',
  includeInForecast: true,
};

describe('studentGameBusSubmissionDebug', () => {
  beforeEach(() => {
    resetGameBusBridgeForTests();
    ingestTaskForTests(pariStudentLunchTaskFixture);
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    resetGameBusBridgeForTests();
    vi.restoreAllMocks();
  });

  it('summarizes student ACTIVITY properties for production logging', () => {
    const message = buildActivityMessage(pariStudentLunchTaskFixture, declaration, draft, slots);
    const summary = summarizeStudentActivityMessage(message);

    expect(summary.activityTemplate).toBe('studentLunchCheckin');
    expect(summary.propertyCount).toBeGreaterThan(0);
    expect(summary.propertyTemplateRefs).toContain('mainItemId');
    expect(summary.propertyValues.find((entry) => entry.template === 'mealType')?.obj).toEqual({
      value: 'regular',
    });
  });

  it('logs student submission diagnostics around postMessage without changing behavior', () => {
    const parentPostMessage = vi.fn();
    const originalParent = window.parent;
    Object.defineProperty(window, 'parent', {
      configurable: true,
      value: { postMessage: parentPostMessage },
    });

    const result = tryPostActivity(declaration, draft, slots);
    logStudentTryPostActivityResult(result);

    Object.defineProperty(window, 'parent', {
      configurable: true,
      value: originalParent,
    });

    expect(result.ok).toBe(true);
    expect(parentPostMessage).toHaveBeenCalledTimes(1);

    const logCalls = vi.mocked(console.log).mock.calls.map((call) => call[0]);
    expect(
      logCalls.some((line) => String(line).includes(`${STUDENT_GAMEBUS_DEBUG_LOG_PREFIX} task`)),
    ).toBe(true);
    expect(
      logCalls.some((line) =>
        String(line).includes(`${STUDENT_GAMEBUS_DEBUG_LOG_PREFIX} expected property refs`),
      ),
    ).toBe(true);
    expect(
      logCalls.some((line) =>
        String(line).includes(`${STUDENT_GAMEBUS_DEBUG_LOG_PREFIX} sending ACTIVITY`),
      ),
    ).toBe(true);
    expect(
      logCalls.some((line) =>
        String(line).includes(`${STUDENT_GAMEBUS_DEBUG_LOG_PREFIX} postMessage returned`),
      ),
    ).toBe(true);
    expect(
      logCalls.some((line) =>
        String(line).includes(`${STUDENT_GAMEBUS_DEBUG_LOG_PREFIX} tryPostActivity result`),
      ),
    ).toBe(true);
  });

  it('logs build/submission exception with the error message', () => {
    const error = new Error(
      'Activity template "studentLunchCheckin" missing linked property refs: mealType',
    );
    logStudentSubmissionException(error);

    expect(console.error).toHaveBeenCalledWith(
      `${STUDENT_GAMEBUS_DEBUG_LOG_PREFIX} build/submission exception`,
      error.message,
      error,
    );
  });
});
