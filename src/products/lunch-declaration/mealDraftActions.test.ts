import { describe, it, expect } from 'vitest';
import { applyPortionAdjustment, draftForLunchOption } from '@/products/lunch-declaration/mealDraftActions';

const empty = {
  mealChoice: null,
  lunchOption: null,
  mainQuantity: 0,
  vegetarianQuantity: 0,
  soupQuantity: 0,
  dessertQuantity: 0,
} as const;

describe('meal draft exclusive lunch options', () => {
  it('activates classic and sets main to 1 on first plus click', () => {
    const next = applyPortionAdjustment({ ...empty }, 'main', 1, 3);
    expect(next.lunchOption).toBe('classic');
    expect(next.mealChoice).toBe('regular');
    expect(next.mainQuantity).toBe(1);
    expect(next.vegetarianQuantity).toBe(0);
    expect(next.soupQuantity).toBe(0);
  });

  it('clears classic when selecting vegetarian', () => {
    const next = applyPortionAdjustment(
      {
        mealChoice: 'regular',
        lunchOption: 'classic',
        mainQuantity: 2,
        vegetarianQuantity: 0,
        soupQuantity: 0,
        dessertQuantity: 0,
      },
      'vegetarian',
      1,
      3,
    );
    expect(next.lunchOption).toBe('vegetarian');
    expect(next.mainQuantity).toBe(0);
    expect(next.vegetarianQuantity).toBe(1);
  });

  it('keeps soup and dessert identical for the package quantity', () => {
    const next = applyPortionAdjustment({ ...empty }, 'soup_dessert', 1, 5);
    expect(next.lunchOption).toBe('soup');
    expect(next.mealChoice).toBe('soup');
    expect(next.soupQuantity).toBe(1);
    expect(next.dessertQuantity).toBe(1);

    const two = applyPortionAdjustment(next, 'soup_dessert', 1, 5);
    expect(two.soupQuantity).toBe(2);
    expect(two.dessertQuantity).toBe(2);
  });

  it('switches from classic to soup package and clears classic quantities', () => {
    const next = applyPortionAdjustment(
      {
        mealChoice: 'regular',
        lunchOption: 'classic',
        mainQuantity: 2,
        vegetarianQuantity: 0,
        soupQuantity: 0,
        dessertQuantity: 0,
      },
      'soup_dessert',
      1,
      2,
    );
    expect(next.lunchOption).toBe('soup');
    expect(next.mainQuantity).toBe(0);
    expect(next.soupQuantity).toBe(1);
    expect(next.dessertQuantity).toBe(1);
  });

  it('ignores decrement on inactive section', () => {
    const draft = {
      mealChoice: 'regular' as const,
      lunchOption: 'classic' as const,
      mainQuantity: 1,
      vegetarianQuantity: 0,
      soupQuantity: 0,
      dessertQuantity: 0,
    };
    const next = applyPortionAdjustment(draft, 'soup_dessert', -1, 2);
    expect(next).toBe(draft);
  });

  it('clears all portions when activating no lunch', () => {
    const next = draftForLunchOption(
      {
        mealChoice: 'regular',
        lunchOption: 'classic',
        mainQuantity: 2,
        vegetarianQuantity: 0,
        soupQuantity: 0,
        dessertQuantity: 0,
      },
      'no_lunch',
    );
    expect(next.lunchOption).toBe('no_lunch');
    expect(next.mealChoice).toBe('no_lunch');
    expect(next.mainQuantity).toBe(0);
    expect(next.soupQuantity).toBe(0);
    expect(next.dessertQuantity).toBe(0);
  });
});
