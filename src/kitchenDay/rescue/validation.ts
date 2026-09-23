export type ReusableParse =
  | { ok: true; value: number }
  | { ok: false; issue: 'blank' | 'invalid' };

export function parseReusableWasteGrams(
  raw: string,
  actualWasteGrams: number,
): ReusableParse {
  const trimmed = raw.trim();
  if (trimmed === '') return { ok: false, issue: 'blank' };
  const value = Number(trimmed);
  if (!Number.isFinite(value) || value < 0 || value > actualWasteGrams) {
    return { ok: false, issue: 'invalid' };
  }
  return { ok: true, value };
}

export function parseReuseDestination(raw: string): { ok: true; value: string } | { ok: false } {
  const value = raw.trim();
  if (value.length < 1) return { ok: false };
  return { ok: true, value };
}

export function canSaveRescueSuggestion(options: {
  reusableRaw: string;
  destinationRaw: string;
  actualWasteGrams: number;
}): boolean {
  return (
    parseReusableWasteGrams(options.reusableRaw, options.actualWasteGrams).ok &&
    parseReuseDestination(options.destinationRaw).ok
  );
}
