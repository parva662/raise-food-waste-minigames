import { describe, it, expect } from 'vitest';
import { createDeclarationFromDraft, snapshotFromDeclaration } from './declaration';
import { resolveMealSlotsForDate } from '../services/mealSlots';
import { CANTEEN_CONFIG } from '../config/canteen';
import { FIXTURE_LUNCH_DATE, SUBMISSION_TIMES } from '../test/fixtures/dates';

describe('declaration factory', () => {
  it('creates a declaration without scoring fields', () => {
    const slots = resolveMealSlotsForDate(FIXTURE_LUNCH_DATE)!;
    const declaration = createDeclarationFromDraft(
      { mealChoice: 'regular', mainQuantity: 1, vegetarianQuantity: 0, soupQuantity: 0, dessertQuantity: 0 },
      slots,
      FIXTURE_LUNCH_DATE,
      2,
      CANTEEN_CONFIG.menuVersion,
      () => SUBMISSION_TIMES.midday,
    );

    expect(declaration).not.toBeNull();
    expect(declaration).not.toHaveProperty('basePoints');
    expect(declaration).not.toHaveProperty('timingStatus');
    expect(declaration?.submittedAt).toBeTruthy();
  });

  it('snapshots omit scoring fields', () => {
    const slots = resolveMealSlotsForDate(FIXTURE_LUNCH_DATE)!;
    const declaration = createDeclarationFromDraft(
      { mealChoice: 'no_lunch', mainQuantity: 0, vegetarianQuantity: 0, soupQuantity: 0, dessertQuantity: 0 },
      slots,
      FIXTURE_LUNCH_DATE,
      2,
      CANTEEN_CONFIG.menuVersion,
      () => SUBMISSION_TIMES.midday,
    )!;

    const snapshot = snapshotFromDeclaration(declaration, slots);
    expect(snapshot).not.toHaveProperty('basePoints');
    expect(snapshot).not.toHaveProperty('timingStatus');
    expect(snapshot.submittedAt).toBe(declaration.submittedAt);
  });
});
