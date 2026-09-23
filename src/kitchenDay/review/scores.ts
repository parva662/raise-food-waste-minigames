export const KITCHEN_DAY_REVIEW_SCORE_MIN = 0;
export const KITCHEN_DAY_REVIEW_SCORE_MAX = 5;

export function isKitchenDayReviewScore(value: number): boolean {
  return Number.isInteger(value) && value >= KITCHEN_DAY_REVIEW_SCORE_MIN && value <= KITCHEN_DAY_REVIEW_SCORE_MAX;
}

export function parseKitchenDayReviewScore(
  raw: string,
): { ok: true; value: number } | { ok: false; reason: 'blank' | 'invalid' } {
  const trimmed = raw.trim();
  if (trimmed.length === 0) return { ok: false, reason: 'blank' };
  if (!/^-?\d+$/.test(trimmed)) return { ok: false, reason: 'invalid' };
  const value = Number(trimmed);
  if (!isKitchenDayReviewScore(value)) return { ok: false, reason: 'invalid' };
  return { ok: true, value };
}
