/** GameBus export schema: number, minimum 0, maximum 1 */
export const CONFIDENCE_MIN = 0;
export const CONFIDENCE_MAX = 1;

export const CHEF_CONFIDENCE_OPTIONS = [
  { label: 'Very low', value: 0 },
  { label: 'Low', value: 0.25 },
  { label: 'Moderate', value: 0.5 },
  { label: 'High', value: 0.75 },
  { label: 'Very high', value: 1 },
] as const;

export type ConfidenceParseResult =
  | { ok: true; value: number | null }
  | { ok: false; error: string };

export function parseChefConfidence(raw: string): ConfidenceParseResult {
  const trimmed = raw.trim();
  if (trimmed.length === 0) {
    return { ok: true, value: null };
  }

  const value = Number(trimmed);
  if (!Number.isFinite(value)) {
    return { ok: false, error: 'Confidence must be a number between 0 and 1.' };
  }

  if (value < CONFIDENCE_MIN || value > CONFIDENCE_MAX) {
    return { ok: false, error: 'Confidence must be between 0 and 1.' };
  }

  return { ok: true, value };
}

export function hasChefConfidenceAnswer(confidence: number | null): boolean {
  return confidence !== null;
}

export function hasChefNotesAnswer(notes: string): boolean {
  return notes.trim().length > 0;
}

export function trimChefNotes(notes: string): string {
  return notes.trim();
}
