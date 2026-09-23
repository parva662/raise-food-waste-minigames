export function formatWastePercent(percent: number): string {
  if (!Number.isFinite(percent)) return '—';
  return `${percent.toFixed(1)}%`;
}

export function formatGrams(grams: number): string {
  if (!Number.isFinite(grams)) return '—';
  const rounded = Math.round(grams * 10) / 10;
  const display = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
  return `${display} g`;
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
  return String(score);
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
