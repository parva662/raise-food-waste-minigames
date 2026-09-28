export const CHEF_SEEDED_WASTE_PERCENT_BY_INGREDIENT_ID: Record<string, number> = {
  carrot: 12,
  potato: 15,
  onion: 10,
  lemon: 8,
};

export function getSeededReferencePercent(ingredientId: string): number | null {
  return CHEF_SEEDED_WASTE_PERCENT_BY_INGREDIENT_ID[ingredientId] ?? null;
}
