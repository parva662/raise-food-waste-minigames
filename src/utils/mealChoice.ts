import type { SelectionEntry } from '../types/menu';
import type { ActiveDeclaration } from '../types/declaration';
import type { DailyMealSlots, MealChoice, MealDraft } from '../types/mealChoice';
import { clampItemQuantity } from '../types/mealChoice';

export function createEmptyMealDraft(): MealDraft {
  return {
    mealChoice: null,
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
  if (draft.mealChoice === null) return false;
  if (draft.mealChoice === 'no_lunch') return true;
  if (draft.mealChoice === 'soup') {
    return draft.soupQuantity > 0 || draft.dessertQuantity > 0;
  }
  if (draft.mealChoice === 'regular') {
    const hasMain = draft.mainQuantity > 0;
    const hasVeg = draft.vegetarianQuantity > 0;
    return hasMain || hasVeg;
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
    return { mealChoice: 'no_lunch', ...emptyQuantities };
  }

  if (declaration.mealChoice === 'soup') {
    return {
      mealChoice: 'soup',
      ...emptyQuantities,
      soupQuantity: quantityFromSelections(declaration.selections, slots.soup.id),
      dessertQuantity: quantityFromSelections(declaration.selections, slots.dessert.id),
    };
  }

  if (declaration.mealChoice === 'regular') {
    return {
      mealChoice: 'regular',
      soupQuantity: 0,
      dessertQuantity: 0,
      mainQuantity: quantityFromSelections(declaration.selections, slots.main.id),
      vegetarianQuantity: quantityFromSelections(declaration.selections, slots.vegetarian.id),
    };
  }

  const selectedIds = new Set(declaration.selections.map((entry) => entry.itemId));
  if (selectedIds.has(slots.soup.id) || selectedIds.has(slots.dessert.id)) {
    return {
      mealChoice: 'soup',
      mainQuantity: 0,
      vegetarianQuantity: 0,
      soupQuantity: quantityFromSelections(declaration.selections, slots.soup.id),
      dessertQuantity: quantityFromSelections(declaration.selections, slots.dessert.id),
    };
  }

  return {
    mealChoice: 'regular',
    soupQuantity: 0,
    dessertQuantity: 0,
    mainQuantity: quantityFromSelections(declaration.selections, slots.main.id),
    vegetarianQuantity: quantityFromSelections(declaration.selections, slots.vegetarian.id),
  };
}

export function mealChoiceLabel(choice: MealChoice): string {
  switch (choice) {
    case 'regular':
      return 'Regular lunch';
    case 'soup':
      return 'Soup lunch';
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
  if (draft.mealChoice === 'no_lunch') {
    return [{ label: 'Meal', detail: 'No lunch' }];
  }
  if (draft.mealChoice === 'soup') {
    const lines: MealSummaryLine[] = [{ label: 'Meal', detail: 'Soup lunch' }];
    if (draft.soupQuantity > 0) {
      lines.push({
        label: 'Soup',
        detail: `${slots.soup.name} × ${draft.soupQuantity} ${slots.soup.unit}`,
      });
    }
    if (draft.dessertQuantity > 0) {
      lines.push({
        label: 'Dessert',
        detail: `${slots.dessert.name} × ${draft.dessertQuantity} ${slots.dessert.unit}`,
      });
    }
    return lines;
  }
  if (draft.mealChoice === 'regular') {
    const lines: MealSummaryLine[] = [{ label: 'Meal', detail: 'Regular lunch' }];
    if (draft.mainQuantity > 0) {
      lines.push({
        label: 'Main',
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
    line.label === 'Meal' ? line.detail : `${line.label}: ${line.detail}`,
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