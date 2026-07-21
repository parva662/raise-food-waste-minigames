import { describe, it, expect } from 'vitest';
import {
  normalizeDeclarationSelection,
  areDeclarationSelectionsEqual,
  isDraftDirty,
  isSubmitDisabled,
} from '../utils/declarationSelection';
import type { DraftSnapshot } from '../utils/declaration';

const savedItems: DraftSnapshot = {
  noLunch: false,
  quantities: {
    'chickpea-curry': 1,
    'grilled-chicken': 1,
    'tomato-soup': 1,
    'pasta-primavera': 0,
  },
};

describe('normalizeDeclarationSelection', () => {
  it('removes zero-quantity items and sorts by item ID', () => {
    const normalized = normalizeDeclarationSelection(
      {
        'tomato-soup': 1,
        'chickpea-curry': 1,
        'grilled-chicken': 1,
        'pasta-primavera': 0,
      },
      false,
    );

    expect(normalized.items).toEqual([
      { itemId: 'chickpea-curry', quantity: 1 },
      { itemId: 'grilled-chicken', quantity: 1 },
      { itemId: 'tomato-soup', quantity: 1 },
    ]);
  });
});

describe('isDraftDirty', () => {
  it('treats identical saved and draft selections as not dirty', () => {
    const draft: DraftSnapshot = {
      noLunch: false,
      quantities: { ...savedItems.quantities },
    };
    expect(isDraftDirty(draft, savedItems)).toBe(false);
  });

  it('treats different array order as not dirty', () => {
    const draft: DraftSnapshot = {
      noLunch: false,
      quantities: {
        'tomato-soup': 1,
        'grilled-chicken': 1,
        'chickpea-curry': 1,
      },
    };
    expect(isDraftDirty(draft, savedItems)).toBe(false);
  });

  it('ignores zero-quantity items in dirty comparison', () => {
    const draft: DraftSnapshot = {
      noLunch: false,
      quantities: {
        ...savedItems.quantities,
        'pasta-primavera': 0,
        'meatballs': 0,
      },
    };
    expect(isDraftDirty(draft, savedItems)).toBe(false);
  });

  it('detects changed quantity', () => {
    const draft: DraftSnapshot = {
      noLunch: false,
      quantities: {
        ...savedItems.quantities,
        'chickpea-curry': 2,
      },
    };
    expect(isDraftDirty(draft, savedItems)).toBe(true);
  });

  it('detects removed item', () => {
    const draft: DraftSnapshot = {
      noLunch: false,
      quantities: {
        'chickpea-curry': 1,
        'grilled-chicken': 1,
      },
    };
    expect(isDraftDirty(draft, savedItems)).toBe(true);
  });

  it('detects added item', () => {
    const draft: DraftSnapshot = {
      noLunch: false,
      quantities: {
        ...savedItems.quantities,
        'pasta-primavera': 1,
      },
    };
    expect(isDraftDirty(draft, savedItems)).toBe(true);
  });

  it('clears dirty state when an added item is removed again', () => {
    const withAdded: DraftSnapshot = {
      noLunch: false,
      quantities: {
        ...savedItems.quantities,
        'pasta-primavera': 1,
      },
    };
    expect(isDraftDirty(withAdded, savedItems)).toBe(true);
    expect(isDraftDirty(savedItems, savedItems)).toBe(false);
  });

  it('treats identical no-lunch declarations as not dirty', () => {
    const saved: DraftSnapshot = { noLunch: true, quantities: {} };
    const draft: DraftSnapshot = { noLunch: true, quantities: { meatballs: 0 } };
    expect(isDraftDirty(draft, saved)).toBe(false);
  });

  it('detects changing from food to no-lunch as dirty', () => {
    const draft: DraftSnapshot = { noLunch: true, quantities: {} };
    expect(isDraftDirty(draft, savedItems)).toBe(true);
  });

  it('returns false when there is no saved declaration', () => {
    const draft: DraftSnapshot = { noLunch: false, quantities: { meatballs: 2 } };
    expect(isDraftDirty(draft, null)).toBe(false);
  });

  it('clears dirty state when draft is manually restored to saved values', () => {
    const changed: DraftSnapshot = {
      noLunch: false,
      quantities: { ...savedItems.quantities, 'chickpea-curry': 2 },
    };
    expect(isDraftDirty(changed, savedItems)).toBe(true);
    expect(isDraftDirty(savedItems, savedItems)).toBe(false);
  });
});

describe('areDeclarationSelectionsEqual', () => {
  it('compares normalized structures structurally', () => {
    const left = normalizeDeclarationSelection(savedItems.quantities, false);
    const right = normalizeDeclarationSelection(
      {
        'tomato-soup': 1,
        'grilled-chicken': 1,
        'chickpea-curry': 1,
      },
      false,
    );
    expect(areDeclarationSelectionsEqual(left, right)).toBe(true);
  });
});

describe('isSubmitDisabled', () => {
  it('disables update when draft matches saved declaration', () => {
    expect(isSubmitDisabled(true, false, false, true, true)).toBe(true);
  });

  it('enables update when draft differs', () => {
    expect(isSubmitDisabled(true, true, false, true, true)).toBe(false);
  });

  it('disables submit when draft is empty and nothing is saved', () => {
    expect(isSubmitDisabled(false, false, false, false, true)).toBe(true);
  });

  it('enables submit when draft has content and nothing is saved', () => {
    expect(isSubmitDisabled(false, false, false, true, true)).toBe(false);
  });
});

describe('post-save dirty baseline', () => {
  it('simulates save resetting dirty state to false', () => {
    const draftBeforeSave: DraftSnapshot = { ...savedItems };
    const savedAfterSubmit: DraftSnapshot = { ...savedItems };
    expect(isDraftDirty(draftBeforeSave, savedAfterSubmit)).toBe(false);
  });
});
