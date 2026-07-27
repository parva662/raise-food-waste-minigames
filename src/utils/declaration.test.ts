import { describe, it, expect } from 'vitest';
import { createDeclarationFromDraft, snapshotFromDeclaration } from './declaration';
import { resolveMealSlotsForDate } from '../services/mealSlots';
import { FIXTURE_LUNCH_DATE, SUBMISSION_TIMES } from '../test/fixtures/dates';

const slots = resolveMealSlotsForDate(FIXTURE_LUNCH_DATE)!;

describe('createDeclarationFromDraft', () => {
  it('creates a declaration with meal choice, quantities, and scoring', () => {
    const declaration = createDeclarationFromDraft(
      { mealChoice: 'regular', mainQuantity: 2, vegetarianQuantity: 1, soupQuantity: 0, dessertQuantity: 0 },
      slots,
      FIXTURE_LUNCH_DATE,
      1,
      '2026-v1',
      () => SUBMISSION_TIMES.midday,
    );
    expect(declaration).not.toBeNull();
    expect(declaration!.selections).toHaveLength(2);
    expect(declaration!.totalPoints).toBe(25);
  });
});

describe('snapshotFromDeclaration', () => {
  it('restores quantity fields on snapshot', () => {
    const declaration = createDeclarationFromDraft(
      { mealChoice: 'regular', mainQuantity: 1, vegetarianQuantity: 0, soupQuantity: 0, dessertQuantity: 0 },
      slots,
      FIXTURE_LUNCH_DATE,
      1,
      '2026-v1',
      () => SUBMISSION_TIMES.midday,
    )!;
    const snapshot = snapshotFromDeclaration(declaration, slots);
    expect(snapshot.mainQuantity).toBe(1);
  });
});
