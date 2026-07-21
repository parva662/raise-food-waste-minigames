import type { DraftSnapshot } from './declaration';

export interface NormalizedSelectionItem {
  itemId: string;
  quantity: number;
}

export interface NormalizedDeclarationSelection {
  noLunch: boolean;
  items: NormalizedSelectionItem[];
}

export function normalizeDeclarationSelection(
  quantities: Record<string, number>,
  noLunch: boolean,
): NormalizedDeclarationSelection {
  const items = Object.entries(quantities)
    .filter(([, quantity]) => quantity > 0)
    .map(([itemId, quantity]) => ({ itemId, quantity }))
    .sort((left, right) => left.itemId.localeCompare(right.itemId));

  return {
    noLunch: Boolean(noLunch),
    items,
  };
}

export function normalizeDraftSelection(draft: DraftSnapshot): NormalizedDeclarationSelection {
  return normalizeDeclarationSelection(draft.quantities, draft.noLunch);
}

export function areDeclarationSelectionsEqual(
  left: NormalizedDeclarationSelection,
  right: NormalizedDeclarationSelection,
): boolean {
  if (left.noLunch !== right.noLunch) return false;
  if (left.items.length !== right.items.length) return false;

  return left.items.every(
    (item, index) =>
      item.itemId === right.items[index].itemId && item.quantity === right.items[index].quantity,
  );
}

export function isDraftDirty(draft: DraftSnapshot, saved: DraftSnapshot | null): boolean {
  if (!saved) return false;
  return !areDeclarationSelectionsEqual(
    normalizeDraftSelection(draft),
    normalizeDraftSelection(saved),
  );
}

export function isSubmitDisabled(
  hasSavedDeclaration: boolean,
  isDirty: boolean,
  menuChanged: boolean,
  canSubmitContent: boolean,
  menuInteractive: boolean,
): boolean {
  if (!menuInteractive) return true;
  if (!hasSavedDeclaration) return !canSubmitContent;
  return !isDirty && !menuChanged;
}
