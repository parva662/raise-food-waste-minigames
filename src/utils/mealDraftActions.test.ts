import { describe, it, expect } from 'vitest';
import { applyPortionAdjustment, draftForMealChoice } from './mealDraftActions';

describe('meal draft section actions', () => {
  it('activates regular and sets main to 1 on first plus click', () => {
    const next = applyPortionAdjustment(
      {
        mealChoice: null,
        mainQuantity: 0,
        vegetarianQuantity: 0,
        soupQuantity: 0,
        dessertQuantity: 0,
      },
      'main',
      1,
      3,
    );
    expect(next.mealChoice).toBe('regular');
    expect(next.mainQuantity).toBe(1);
    expect(next.soupQuantity).toBe(0);
  });

  it('switches to soup and applies dessert increment, clearing regular quantities', () => {
    const next = applyPortionAdjustment(
      {
        mealChoice: 'regular',
        mainQuantity: 2,
        vegetarianQuantity: 1,
        soupQuantity: 0,
        dessertQuantity: 0,
      },
      'dessert',
      1,
      2,
    );
    expect(next.mealChoice).toBe('soup');
    expect(next.mainQuantity).toBe(0);
    expect(next.vegetarianQuantity).toBe(0);
    expect(next.dessertQuantity).toBe(1);
  });

  it('ignores decrement on inactive section', () => {
    const draft = {
      mealChoice: 'regular' as const,
      mainQuantity: 1,
      vegetarianQuantity: 0,
      soupQuantity: 0,
      dessertQuantity: 0,
    };
    const next = applyPortionAdjustment(draft, 'soup', -1, 2);
    expect(next).toBe(draft);
  });

  it('clears all portions when activating no lunch', () => {
    const next = draftForMealChoice(
      {
        mealChoice: 'regular',
        mainQuantity: 2,
        vegetarianQuantity: 0,
        soupQuantity: 0,
        dessertQuantity: 0,
      },
      'no_lunch',
    );
    expect(next.mealChoice).toBe('no_lunch');
    expect(next.mainQuantity).toBe(0);
  });
});
