import { describe, it, expect } from 'vitest';

import {

  buildQuantitiesFromMealDraft,

  buildSelectionsFromMealDraft,

  isMealDraftSubmittable,

  mealDraftFromDeclaration,

  adjustPortionQuantity,

} from './mealChoice';

import { resolveMealSlotsForDate } from '../services/mealSlots';

import { createFixtureDeclaration } from '../test/fixtures/declarations';

import { FIXTURE_LUNCH_DATE } from '../test/fixtures/dates';



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

    expect(isMealDraftSubmittable({ mealChoice: 'no_lunch', ...emptyPortions })).toBe(true);

  });



  it('requires at least one positive soup or dessert quantity', () => {

    expect(

      isMealDraftSubmittable({ mealChoice: 'soup', ...emptyPortions, soupQuantity: 1, dessertQuantity: 0 }),

    ).toBe(true);

    expect(

      isMealDraftSubmittable({ mealChoice: 'soup', ...emptyPortions, soupQuantity: 0, dessertQuantity: 0 }),

    ).toBe(false);

    expect(

      isMealDraftSubmittable({ mealChoice: 'soup', ...emptyPortions, soupQuantity: 2, dessertQuantity: 1 }),

    ).toBe(true);

  });



  it('requires at least one regular dish with positive quantity', () => {

    expect(isMealDraftSubmittable({ mealChoice: 'regular', ...emptyPortions })).toBe(false);

    expect(

      isMealDraftSubmittable({ mealChoice: 'regular', mainQuantity: 2, vegetarianQuantity: 0, soupQuantity: 0, dessertQuantity: 0 }),

    ).toBe(true);

    expect(

      isMealDraftSubmittable({ mealChoice: 'regular', mainQuantity: 1, vegetarianQuantity: 3, soupQuantity: 0, dessertQuantity: 0 }),

    ).toBe(true);

  });

});



describe('regular lunch quantities', () => {

  it('persists separate quantities for main and vegetarian', () => {

    const draft = {

      mealChoice: 'regular' as const,

      mainQuantity: 2,

      vegetarianQuantity: 1,

      soupQuantity: 0,

      dessertQuantity: 0,

    };

    const selections = buildSelectionsFromMealDraft(draft, slots);

    expect(selections).toHaveLength(2);

    expect(selections.find((s) => s.itemId === slots.main.id)?.quantity).toBe(2);

    expect(selections.find((s) => s.itemId === slots.vegetarian.id)?.quantity).toBe(1);

  });



  it('clamps quantities to catalogue max', () => {

    expect(adjustPortionQuantity(1, 10, slots.main.maxQuantity)).toBe(slots.main.maxQuantity);

  });



  it('restores quantities from saved declaration', () => {

    const declaration = createFixtureDeclaration({

      mealChoice: 'regular',

      selections: buildSelectionsFromMealDraft(

        { mealChoice: 'regular', mainQuantity: 3, vegetarianQuantity: 0, soupQuantity: 0, dessertQuantity: 0 },

        slots,

      ),

    });

    const draft = mealDraftFromDeclaration(declaration, slots);

    expect(draft.mainQuantity).toBe(3);

    expect(draft.vegetarianQuantity).toBe(0);

  });

});



describe('soup lunch quantities', () => {

  it('persists separate soup and dessert quantities', () => {

    const selections = buildSelectionsFromMealDraft(

      { mealChoice: 'soup', ...emptyPortions, soupQuantity: 2, dessertQuantity: 1 },

      slots,

    );

    expect(selections).toHaveLength(2);

    expect(selections.find((s) => s.itemId === slots.soup.id)?.quantity).toBe(2);

    expect(selections.find((s) => s.itemId === slots.dessert.id)?.quantity).toBe(1);

  });

});



describe('buildQuantitiesFromMealDraft', () => {

  it('clears soup slot quantities for regular lunch', () => {

    const quantities = buildQuantitiesFromMealDraft(

      { mealChoice: 'regular', mainQuantity: 1, vegetarianQuantity: 0, soupQuantity: 0, dessertQuantity: 0 },

      slots,

    );

    expect(quantities[slots.soup.id]).toBe(0);

    expect(quantities[slots.main.id]).toBe(1);

  });

});

