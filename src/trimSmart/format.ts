export function formatChallengeGrams(grams: number): string {
  return `${Math.round(grams).toLocaleString('en-GB')} g`;
}
