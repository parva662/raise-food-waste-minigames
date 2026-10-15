/** Normalize recipe identity for compare/post (dataset ids are strings; GameBus may store numbers). */
export function normalizeRecipeId(recipeId: string | number | null | undefined): string | null {
  if (typeof recipeId === 'number' && Number.isFinite(recipeId)) return String(recipeId);
  if (typeof recipeId === 'string') {
    const trimmed = recipeId.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
  return null;
}

export function isPortionRecipeAlreadyRecorded(
  portionRecipeIds: readonly string[],
  recipeId: string | number,
): boolean {
  const normalized = normalizeRecipeId(recipeId);
  if (!normalized) return false;
  return portionRecipeIds.some((id) => normalizeRecipeId(id) === normalized);
}

export function isTrimAlreadyRecorded(
  entries: readonly { recipeId?: string | null; ingredientId: string }[],
  recipeId: string | number,
  ingredientId: string,
): boolean {
  const normalizedRecipeId = normalizeRecipeId(recipeId);
  if (!normalizedRecipeId || !ingredientId) return false;
  return entries.some(
    (entry) =>
      normalizeRecipeId(entry.recipeId) === normalizedRecipeId && entry.ingredientId === ingredientId,
  );
}

export function isRescueAlreadyRecorded(
  entries: readonly { recipeId?: string | null; ingredientId: string }[],
  recipeId: string | number,
  ingredientId: string,
): boolean {
  return isTrimAlreadyRecorded(entries, recipeId, ingredientId);
}

/** @deprecated Prefer {@link isTrimAlreadyRecorded} with recipe scope. */
export function isIngredientAlreadyRecorded(
  recordedIngredientIds: readonly string[],
  ingredientId: string,
): boolean {
  return recordedIngredientIds.includes(ingredientId);
}

/** @deprecated Prefer {@link isTrimAlreadyRecorded} with recipe scope. */
export function assertIngredientAvailableInSession(
  recordedIngredientIds: readonly string[],
  ingredientId: string,
): void {
  if (isIngredientAlreadyRecorded(recordedIngredientIds, ingredientId)) {
    throw new Error(`Ingredient "${ingredientId}" is already recorded in this Kitchen Day session`);
  }
}
