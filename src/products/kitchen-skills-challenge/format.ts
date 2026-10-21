import { shiftDecimalText } from '@/products/kitchen-skills-challenge/domain/mass';

export function formatWastePercent(percent: number): string {
  if (!Number.isFinite(percent)) return '—';
  return `${percent.toFixed(1)}%`;
}

/** Masses above 1000 g read as kg (1001 g → 1.001 kg); 1000 g and below stay in grams. */
export function formatGrams(grams: number): string {
  if (!Number.isFinite(grams)) return '—';
  const rounded = Math.round(grams * 10) / 10;
  const display = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
  if (Math.abs(rounded) > 1000) {
    const sign = rounded < 0 ? '-' : '';
    return `${sign}${shiftDecimalText(display.replace('-', ''), -3)} kg`;
  }
  return `${display} g`;
}

/** Recipe amounts: grams use {@link formatGrams}; volume and other units stay as recorded. */
export function formatRecipeAmount(amount: number, unit: string): string {
  if (unit === 'g') return formatGrams(amount);
  if (!Number.isFinite(amount)) return '—';
  return `${amount} ${unit}`;
}

export function formatDurationFromMinutes(durationMinutes: number): string {
  if (!Number.isFinite(durationMinutes) || durationMinutes < 0) return '—';
  const totalSeconds = Math.round(durationMinutes * 60);
  if (totalSeconds < 60) {
    return `${totalSeconds} sec`;
  }
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (seconds === 0) {
    return `${minutes} min`;
  }
  return `${minutes} min ${seconds} sec`;
}

export function formatScore(score: number): string {
  return `${score} / 5`;
}

export function formatDeltaPercentagePoints(
  deltaPercentagePoints: number,
  style: 'long' | 'short' = 'long',
): string {
  if (!Number.isFinite(deltaPercentagePoints) || deltaPercentagePoints === 0) return 'at reference';
  const points = Math.abs(deltaPercentagePoints).toFixed(1);
  const unit = style === 'short' ? 'pp' : 'percentage points';
  const direction = deltaPercentagePoints < 0 ? 'below' : 'above';
  return `${points} ${unit} ${direction} reference`;
}

export function formatReferenceDelta(studentWastePercent: number, referenceWastePercent: number): string {
  return formatDeltaPercentagePoints(studentWastePercent - referenceWastePercent);
}

export function formatSessionDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-').map(Number);
  if (!year || !month || !day) return isoDate;
  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(year, month - 1, day, 12, 0, 0)));
}
