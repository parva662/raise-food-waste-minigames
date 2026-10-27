import type { SelectionEntry } from '@/shared/menu/types';
import type { ActiveDeclaration } from '@/products/lunch-declaration/types/declaration';
import type { DailyMealSlots, LunchOption, MealChoice, MealDraft } from '@/shared/menu/mealChoice';
import { clampItemQuantity, resolveLunchOption } from '@/shared/menu/mealChoice';

export function createEmptyMealDraft(): MealDraft {
  return {
    mealChoice: null,
    lunchOption: null,
    mainQuantity: 0,
    vegetarianQuantity: 0,
    soupQuantity: 0,
    dessertQuantity: 0,
  };
}

export function isRegularDishSelected(quantity: number): boolean {
  return quantity > 0;
}

export function isMealDraftSubmittable(draft: MealDraft): boolean {
  const option = resolveLunchOption(draft);
  if (draft.mealChoice === null || option === null) return false;
  if (option === 'no_lunch') return true;
  if (option === 'soup') {
    if (draft.lunchOption == null) {
      return draft.soupQuantity > 0 || draft.dessertQuantity > 0;
    }
    return draft.soupQuantity > 0 && draft.soupQuantity === draft.dessertQuantity;
  }
  if (option === 'classic') {
    if (draft.lunchOption == null) {
      return draft.mainQuantity > 0 || draft.vegetarianQuantity > 0;
    }
    return draft.mainQuantity > 0 && draft.vegetarianQuantity === 0;
  }
  if (option === 'vegetarian') {
    return draft.vegetarianQuantity > 0 && draft.mainQuantity === 0;
  }
  return false;
}

export function buildQuantitiesFromMealDraft(
  draft: MealDraft,
  slots: DailyMealSlots,
): Record<string, number> {
  const quantities: Record<string, number> = {
    [slots.main.id]: 0,
    [slots.vegetarian.id]: 0,
    [slots.soup.id]: 0,
    [slots.dessert.id]: 0,
  };

  if (draft.mealChoice === 'regular') {
    quantities[slots.main.id] = draft.mainQuantity;
    quantities[slots.vegetarian.id] = draft.vegetarianQuantity;
  } else if (draft.mealChoice === 'soup') {
    quantities[slots.soup.id] = draft.soupQuantity;
    quantities[slots.dessert.id] = draft.dessertQuantity;
  }

  return quantities;
}

export function buildSelectionsFromMealDraft(
  draft: MealDraft,
  slots: DailyMealSlots,
): SelectionEntry[] {
  const quantities = buildQuantitiesFromMealDraft(draft, slots);
  const items = [slots.main, slots.vegetarian, slots.soup, slots.dessert];

  return items
    .filter((item) => (quantities[item.id] ?? 0) > 0)
    .map((item) => ({
      itemId: item.id,
      name: item.name,
      quantity: quantities[item.id],
      unit: item.unit,
    }));
}

function quantityFromSelections(
  selections: SelectionEntry[],
  itemId: string,
): number {
  return selections.find((entry) => entry.itemId === itemId)?.quantity ?? 0;
}

function lunchOptionFromQuantities(
  mealChoice: MealChoice,
  mainQuantity: number,
  vegetarianQuantity: number,
): LunchOption {
  if (mealChoice === 'no_lunch') return 'no_lunch';
  if (mealChoice === 'soup') return 'soup';
  if (vegetarianQuantity > 0 && mainQuantity === 0) return 'vegetarian';
  return 'classic';
}

export function mealDraftFromDeclaration(
  declaration: ActiveDeclaration,
  slots: DailyMealSlots,
): MealDraft {
  const emptyQuantities = {
    mainQuantity: 0,
    vegetarianQuantity: 0,
    soupQuantity: 0,
    dessertQuantity: 0,
  };

  if (declaration.noLunch || declaration.mealChoice === 'no_lunch') {
    return { mealChoice: 'no_lunch', lunchOption: 'no_lunch', ...emptyQuantities };
  }

  if (declaration.mealChoice === 'soup') {
    const soupQuantity = quantityFromSelections(declaration.selections, slots.soup.id);
    const dessertQuantity = quantityFromSelections(declaration.selections, slots.dessert.id);
    return {
      mealChoice: 'soup',
      lunchOption: 'soup',
      ...emptyQuantities,
      // Preserve historical unequal quantities for display; new UI always keeps them equal.
      soupQuantity,
      dessertQuantity,
    };
  }

  if (declaration.mealChoice === 'regular') {
    const mainQuantity = quantityFromSelections(declaration.selections, slots.main.id);
    const vegetarianQuantity = quantityFromSelections(declaration.selections, slots.vegetarian.id);
    return {
      mealChoice: 'regular',
      lunchOption: lunchOptionFromQuantities('regular', mainQuantity, vegetarianQuantity),
      soupQuantity: 0,
      dessertQuantity: 0,
      mainQuantity,
      vegetarianQuantity,
    };
  }

  const selectedIds = new Set(declaration.selections.map((entry) => entry.itemId));
  if (selectedIds.has(slots.soup.id) || selectedIds.has(slots.dessert.id)) {
    const soupQuantity = quantityFromSelections(declaration.selections, slots.soup.id);
    const dessertQuantity = quantityFromSelections(declaration.selections, slots.dessert.id);
    return {
      mealChoice: 'soup',
      lunchOption: 'soup',
      mainQuantity: 0,
      vegetarianQuantity: 0,
      soupQuantity,
      dessertQuantity,
    };
  }

  const mainQuantity = quantityFromSelections(declaration.selections, slots.main.id);
  const vegetarianQuantity = quantityFromSelections(declaration.selections, slots.vegetarian.id);
  return {
    mealChoice: 'regular',
    lunchOption: lunchOptionFromQuantities('regular', mainQuantity, vegetarianQuantity),
    soupQuantity: 0,
    dessertQuantity: 0,
    mainQuantity,
    vegetarianQuantity,
  };
}

export function mealChoiceLabel(choice: MealChoice): string {
  switch (choice) {
    case 'regular':
      return 'Regular lunch';
    case 'soup':
      return 'Soup + Dessert';
    case 'no_lunch':
      return 'No lunch';
  }
}

export function lunchOptionLabel(option: LunchOption): string {
  switch (option) {
    case 'classic':
      return 'Classic dish';
    case 'vegetarian':
      return 'Vegetarian dish';
    case 'soup':
      return 'Soup + Dessert package';
    case 'no_lunch':
      return 'No lunch';
  }
}

export interface MealSummaryLine {
  label: string;
  detail: string;
}

export function buildMealSummary(
  draft: MealDraft,
  slots: DailyMealSlots,
): MealSummaryLine[] {
  const option = resolveLunchOption(draft);
  if (option === 'no_lunch' || draft.mealChoice === 'no_lunch') {
    return [{ label: 'Option', detail: 'No lunch' }];
  }
  if (option === 'soup' || draft.mealChoice === 'soup') {
    const lines: MealSummaryLine[] = [
      { label: 'Option', detail: lunchOptionLabel('soup') },
    ];
    if (draft.soupQuantity > 0) {
      lines.push({
        label: 'Packages',
        detail: `${draft.soupQuantity}`,
      });
      lines.push({
        label: 'Soup',
        detail: `${slots.soup.name} × ${draft.soupQuantity} ${slots.soup.unit}`,
      });
      lines.push({
        label: 'Dessert',
        detail: `${slots.dessert.name} × ${draft.dessertQuantity} ${slots.dessert.unit}`,
      });
    }
    return lines;
  }
  if (option === 'classic' || (draft.mealChoice === 'regular' && draft.mainQuantity > 0 && draft.vegetarianQuantity === 0)) {
    const lines: MealSummaryLine[] = [{ label: 'Option', detail: lunchOptionLabel('classic') }];
    if (draft.mainQuantity > 0) {
      lines.push({
        label: 'Quantity',
        detail: `${slots.main.name} × ${draft.mainQuantity} ${slots.main.unit}`,
      });
    }
    return lines;
  }
  if (option === 'vegetarian' || (draft.mealChoice === 'regular' && draft.vegetarianQuantity > 0 && draft.mainQuantity === 0)) {
    const lines: MealSummaryLine[] = [{ label: 'Option', detail: lunchOptionLabel('vegetarian') }];
    if (draft.vegetarianQuantity > 0) {
      lines.push({
        label: 'Quantity',
        detail: `${slots.vegetarian.name} × ${draft.vegetarianQuantity} ${slots.vegetarian.unit}`,
      });
    }
    return lines;
  }
  if (draft.mealChoice === 'regular') {
    // Historical declarations that selected both Classic and Vegetarian
    const lines: MealSummaryLine[] = [{ label: 'Option', detail: 'Classic and Vegetarian (historical)' }];
    if (draft.mainQuantity > 0) {
      lines.push({
        label: 'Classic',
        detail: `${slots.main.name} × ${draft.mainQuantity} ${slots.main.unit}`,
      });
    }
    if (draft.vegetarianQuantity > 0) {
      lines.push({
        label: 'Vegetarian',
        detail: `${slots.vegetarian.name} × ${draft.vegetarianQuantity} ${slots.vegetarian.unit}`,
      });
    }
    return lines;
  }
  return [];
}

/** @deprecated use buildMealSummary */
export function describeMealDraft(draft: MealDraft, slots: DailyMealSlots): string[] {
  return buildMealSummary(draft, slots).map((line) =>
    line.label === 'Option' || line.label === 'Meal' ? line.detail : `${line.label}: ${line.detail}`,
  );
}

export function adjustPortionQuantity(
  current: number,
  delta: number,
  maxQuantity: number,
): number {
  if (current <= 0 && delta < 0) return 0;
  return clampItemQuantity(current + delta, maxQuantity);
}

export type { LunchOption };
