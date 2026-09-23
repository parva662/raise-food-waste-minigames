export function wastePercentage(
  actualWasteGrams: number,
  ingredientWeightGrams: number,
): number {
  if (ingredientWeightGrams <= 0) {
    throw new Error('ingredientWeightGrams must be greater than 0');
  }
  return (actualWasteGrams / ingredientWeightGrams) * 100;
}

export function estimateDifferenceGrams(
  estimatedWasteGrams: number,
  actualWasteGrams: number,
): number {
  return estimatedWasteGrams - actualWasteGrams;
}

export function discardedWasteGrams(
  actualWasteGrams: number,
  reusableWasteGrams: number,
): number {
  return actualWasteGrams - reusableWasteGrams;
}
