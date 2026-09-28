export function isIngredientAlreadyRecorded(
  recordedIngredientIds: readonly string[],
  ingredientId: string,
): boolean {
  return recordedIngredientIds.includes(ingredientId);
}

export function assertIngredientAvailableInSession(
  recordedIngredientIds: readonly string[],
  ingredientId: string,
): void {
  if (isIngredientAlreadyRecorded(recordedIngredientIds, ingredientId)) {
    throw new Error(`Ingredient "${ingredientId}" is already recorded in this Kitchen Day session`);
  }
}
