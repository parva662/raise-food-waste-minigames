import { describe, it, expect } from 'vitest';
import { resolveMealSlotsForDate } from '../services/mealSlots';
import { MENU_DATES } from '../test/fixtures/dates';
import { normalizeServiceCloseout } from './normalize';
import { normalizeCloseoutKg } from './operationalRecord';
import { createDevelopmentPortionWeightProvider } from './portionWeight/developmentFixtures';
import { DEVELOPMENT_CATEGORY_PORTION_WEIGHT_GRAMS } from './portionWeight';
import {
  createEmptyCloseoutDraft,
  isCloseoutDraftComplete,
  type ServiceCloseoutDraft,
} from './types';
import {
  validateCloseoutQuantity,
  validateCloseoutWasteGrams,
  validateOverproductionAgainstPrepared,
  preparedWeightGrams,
  CLOSEOUT_OVERPRODUCTION_EXCEEDS_PREPARED_ERROR,
} from './validation';
import { gramsToKilograms } from './units';
import { FIXTURE_NORMALIZED_CLOSEOUTS } from './fixtures/closeoutFixtures';

const slots = resolveMealSlotsForDate(MENU_DATES.runtimeWednesday)!;
const portionWeights = createDevelopmentPortionWeightProvider();

function completeDraft(overrides: Partial<ServiceCloseoutDraft> = {}): ServiceCloseoutDraft {
  return {
    actualCustomers: 150,
    main: { preparedQuantity: 110, overproductionGrams: 850 },
    vegetarian: { preparedQuantity: 52, overproductionGrams: 360 },
    soup: { preparedQuantity: 40, overproductionGrams: 500 },
    dessert: { preparedQuantity: 35, overproductionGrams: 180 },
    ...overrides,
  };
}

describe('service closeout domain', () => {
  it('starts with blank draft fields', () => {
    const draft = createEmptyCloseoutDraft();
    expect(draft.actualCustomers).toBeNull();
    expect(draft.main.preparedQuantity).toBeNull();
    expect(draft.main.overproductionGrams).toBeNull();
    expect(isCloseoutDraftComplete(draft)).toBe(false);
  });

  it('treats explicit zero as distinct from blank', () => {
    const draft = createEmptyCloseoutDraft();
    draft.actualCustomers = 0;
    draft.main.preparedQuantity = 0;
    expect(draft.actualCustomers).toBe(0);
    expect(draft.main.preparedQuantity).toBe(0);
    expect(draft.vegetarian.preparedQuantity).toBeNull();
    expect(isCloseoutDraftComplete(draft)).toBe(false);
  });

  it('rejects negative and decimal prepared quantities', () => {
    expect(validateCloseoutQuantity(-1, 'Main prepared').ok).toBe(false);
    expect(validateCloseoutQuantity('12.5', 'Main prepared').ok).toBe(false);
  });

  it('rejects negative waste grams', () => {
    expect(validateCloseoutWasteGrams(-5, 'Main waste').ok).toBe(false);
  });

  it('rejects waste greater than prepared weight', () => {
    const result = validateOverproductionAgainstPrepared(10, 120, 1500);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe(CLOSEOUT_OVERPRODUCTION_EXCEEDS_PREPARED_ERROR);
    }
  });

  it('accepts valid overproduction within prepared weight', () => {
    expect(preparedWeightGrams(10, 120)).toBe(1200);
    const result = validateOverproductionAgainstPrepared(10, 120, 400);
    expect(result.ok).toBe(true);
  });

  it('requires zero waste when prepared quantity is zero', () => {
    expect(validateOverproductionAgainstPrepared(0, 120, 0).ok).toBe(true);
    expect(validateOverproductionAgainstPrepared(0, 120, 50).ok).toBe(false);
  });

  it('normalizes a complete draft into ServiceCloseout with grams', () => {
    const draft = completeDraft();
    const closeout = normalizeServiceCloseout(
      draft,
      MENU_DATES.runtimeWednesday,
      slots,
      portionWeights,
      '2026-07-29T14:00:00.000Z',
    );

    expect(closeout.targetDate).toBe(MENU_DATES.runtimeWednesday);
    expect(closeout.actualCustomers).toBe(150);
    expect(closeout.main.itemId).toBe(slots.main.id);
    expect(closeout.main.preparedQuantity).toBe(110);
    expect(closeout.main.overproductionGrams).toBe(850);
    expect(closeout.main.portionWeightGrams).toBe(
      portionWeights.getPortionWeightGrams(slots.main.id, 'main'),
    );
    expect(closeout.submittedAt).toBe('2026-07-29T14:00:00.000Z');
  });

  it('uses fixture portion weights from reference module not UI', () => {
    expect(DEVELOPMENT_CATEGORY_PORTION_WEIGHT_GRAMS.main).toBe(120);
    expect(DEVELOPMENT_CATEGORY_PORTION_WEIGHT_GRAMS.vegetarian).toBe(180);
    expect(DEVELOPMENT_CATEGORY_PORTION_WEIGHT_GRAMS.soup).toBe(250);
    expect(DEVELOPMENT_CATEGORY_PORTION_WEIGHT_GRAMS.dessert).toBe(90);
  });
});

describe('normalizeCloseoutKg', () => {
  it('keeps prepared quantities as integer counts', () => {
    const closeout = normalizeServiceCloseout(
      completeDraft(),
      MENU_DATES.runtimeWednesday,
      slots,
      portionWeights,
      '2026-07-29T14:00:00.000Z',
    );
    const normalized = normalizeCloseoutKg(closeout);
    expect(normalized.main.preparedQuantity).toBe(110);
    expect(Number.isInteger(normalized.vegetarian.preparedQuantity)).toBe(true);
  });

  it('keeps portion weight in grams', () => {
    const closeout = normalizeServiceCloseout(
      completeDraft(),
      MENU_DATES.runtimeWednesday,
      slots,
      portionWeights,
      '2026-07-29T14:00:00.000Z',
    );
    const normalized = normalizeCloseoutKg(closeout);
    expect(normalized.main.portionWeightGrams).toBe(120);
    expect(normalized.soup.portionWeightGrams).toBe(250);
  });

  it('normalizes 850 g UI overproduction to 0.85 kg', () => {
    const closeout = normalizeServiceCloseout(
      completeDraft(),
      MENU_DATES.runtimeWednesday,
      slots,
      portionWeights,
      '2026-07-29T14:00:00.000Z',
    );
    const normalized = normalizeCloseoutKg(closeout);
    expect(normalized.main.overproductionKg).toBe(0.85);
    expect(gramsToKilograms(850)).toBe(0.85);
  });

  it('normalizes 0 g overproduction to 0 kg', () => {
    const closeout = normalizeServiceCloseout(
      completeDraft({ main: { preparedQuantity: 10, overproductionGrams: 0 } }),
      MENU_DATES.runtimeWednesday,
      slots,
      portionWeights,
      '2026-07-29T14:00:00.000Z',
    );
    const normalized = normalizeCloseoutKg(closeout);
    expect(normalized.main.overproductionKg).toBe(0);
  });

  it('uses fixture normalized closeouts with kg waste values', () => {
    const fixture = FIXTURE_NORMALIZED_CLOSEOUTS[0];
    expect(fixture.main.overproductionKg).toBe(0.48);
    expect(fixture.vegetarian.overproductionKg).toBe(0.36);
  });
});
