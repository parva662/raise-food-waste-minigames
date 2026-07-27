import { describe, it, expect } from 'vitest';
import { isSubmitDisabled, canSubmitMealDraft } from './declarationSelection';

describe('isSubmitDisabled', () => {
  it('disables when submission is not interactive', () => {
    expect(isSubmitDisabled(false, true, false)).toBe(true);
  });

  it('disables after a declaration is saved', () => {
    expect(isSubmitDisabled(true, true, true)).toBe(true);
  });

  it('disables when draft is not submittable', () => {
    expect(isSubmitDisabled(false, false, true)).toBe(true);
  });

  it('enables first submission for valid draft', () => {
    expect(
      isSubmitDisabled(
        false,
        canSubmitMealDraft({ mealChoice: 'no_lunch', mainQuantity: 0, vegetarianQuantity: 0, soupQuantity: 0, dessertQuantity: 0 }),
        true,
      ),
    ).toBe(false);
  });
});
