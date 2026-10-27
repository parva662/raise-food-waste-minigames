import { describe, it, expect } from 'vitest';

import {
  buildQuantitiesFromMealDraft,
  buildSelectionsFromMealDraft,
  isMealDraftSubmittable,
  mealDraftFromDeclaration,
  adjustPortionQuantity,
  buildMealSummary,
} from '@/products/lunch-declaration/mealChoice';
import { resolveMealSlotsForDate } from '@/shared/menu/mealSlots';
import { createFixtureDeclaration } from '@/test/fixtures/declarations';
import { FIXTURE_LUNCH_DATE } from '@/test/fixtures/dates';

const slots = resolveMealSlotsForDate(FIXTURE_LUNCH_DATE)!;

const emptyPortions = {
  mainQuantity: 0,
  vegetarianQuantity: 0,
  soupQuantity: 0,
  dessertQuantity: 0,
};

describe('meal draft validation', () => {
  it('rejects empty meal choice', () => {
    expect(isMealDraftSubmittable({ mealChoice: null, ...emptyPortions })).toBe(false);
  });

  it('accepts no lunch', () => {
    expect(
      isMealDraftSubmittable({ mealChoice: 'no_lunch', lunchOption: 'no_lunch', ...emptyPortions }),
    ).toBe(true);
  });

  it('requires matching positive soup and dessert package quantities', () => {
    expect(
      isMealDraftSubmittable({
        mealChoice: 'soup',
        lunchOption: 'soup',
        ...emptyPortions,
        soupQuantity: 1,
        dessertQuantity: 1,
      }),
    ).toBe(true);

    expect(
      isMealDraftSubmittable({
        mealChoice: 'soup',
        lunchOption: 'soup',
        ...emptyPortions,
        soupQuantity: 0,
        dessertQuantity: 0,
      }),
    ).toBe(false);

    expect(
      isMealDraftSubmittable({
        mealChoice: 'soup',
        lunchOption: 'soup',
        ...emptyPortions,
        soupQuantity: 2,
        dessertQuantity: 1,
      }),
    ).toBe(false);
  });

  it('requires exactly one of classic or vegetarian', () => {
    expect(isMealDraftSubmittable({ mealChoice: 'regular', lunchOption: 'classic', ...emptyPortions })).toBe(
      false,
    );
    expect(
      isMealDraftSubmittable({
        mealChoice: 'regular',
        lunchOption: 'classic',
        mainQuantity: 2,
        vegetarianQuantity: 0,
        soupQuantity: 0,
        dessertQuantity: 0,
      }),
    ).toBe(true);
    expect(
      isMealDraftSubmittable({
        mealChoice: 'regular',
        lunchOption: 'classic',
        mainQuantity: 1,
        vegetarianQuantity: 3,
        soupQuantity: 0,
        dessertQuantity: 0,
      }),
    ).toBe(false);
  });
});

describe('classic and vegetarian exclusivity', () => {
  it('persists only the selected exclusive dish', () => {
    const draft = {
      mealChoice: 'regular' as const,
      lunchOption: 'classic' as const,
      mainQuantity: 2,
      vegetarianQuantity: 0,
      soupQuantity: 0,
      dessertQuantity: 0,
    };
    const selections = buildSelectionsFromMealDraft(draft, slots);
    expect(selections).toHaveLength(1);
    expect(selections.find((s) => s.itemId === slots.main.id)?.quantity).toBe(2);
  });

  it('clamps quantities to catalogue max', () => {
    expect(adjustPortionQuantity(1, 10, slots.main.maxQuantity)).toBe(slots.main.maxQuantity);
  });

  it('restores quantities from saved declaration', () => {
    const declaration = createFixtureDeclaration({
      mealChoice: 'regular',
      selections: buildSelectionsFromMealDraft(
        {
          mealChoice: 'regular',
          lunchOption: 'classic',
          mainQuantity: 3,
          vegetarianQuantity: 0,
          soupQuantity: 0,
          dessertQuantity: 0,
        },
        slots,
      ),
    });
    const draft = mealDraftFromDeclaration(declaration, slots);
    expect(draft.mainQuantity).toBe(3);
    expect(draft.vegetarianQuantity).toBe(0);
    expect(draft.lunchOption).toBe('classic');
  });

  it('summarises classic option and quantity for review', () => {
    const lines = buildMealSummary(
      {
        mealChoice: 'regular',
        lunchOption: 'classic',
        mainQuantity: 2,
        vegetarianQuantity: 0,
        soupQuantity: 0,
        dessertQuantity: 0,
      },
      slots,
    );
    expect(lines[0]).toEqual({ label: 'Option', detail: 'Classic dish' });
    expect(lines.some((line) => line.label === 'Quantity')).toBe(true);
  });
});

describe('soup dessert package quantities', () => {
  it('persists equal soup and dessert package quantities', () => {
    const selections = buildSelectionsFromMealDraft(
      {
        mealChoice: 'soup',
        lunchOption: 'soup',
        ...emptyPortions,
        soupQuantity: 2,
        dessertQuantity: 2,
      },
      slots,
    );
    expect(selections).toHaveLength(2);
    expect(selections.find((s) => s.itemId === slots.soup.id)?.quantity).toBe(2);
    expect(selections.find((s) => s.itemId === slots.dessert.id)?.quantity).toBe(2);
  });

  it('summarises soup package option and package count', () => {
    const lines = buildMealSummary(
      {
        mealChoice: 'soup',
        lunchOption: 'soup',
        ...emptyPortions,
        soupQuantity: 2,
        dessertQuantity: 2,
      },
      slots,
    );
    expect(lines[0]).toEqual({ label: 'Option', detail: 'Soup + Dessert package' });
    expect(lines).toContainEqual({ label: 'Packages', detail: '2' });
  });
});

describe('buildQuantitiesFromMealDraft', () => {
  it('clears soup slot quantities for classic lunch', () => {
    const quantities = buildQuantitiesFromMealDraft(
      {
        mealChoice: 'regular',
        lunchOption: 'classic',
        mainQuantity: 1,
        vegetarianQuantity: 0,
        soupQuantity: 0,
        dessertQuantity: 0,
      },
      slots,
    );
    expect(quantities[slots.soup.id]).toBe(0);
    expect(quantities[slots.main.id]).toBe(1);
  });
});
