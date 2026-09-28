export function formatCountdown(now: Date, targetIso: string): string {
  const targetMs = new Date(targetIso).getTime();
  const diffMs = Math.max(0, targetMs - now.getTime());
  const totalMinutes = Math.floor(diffMs / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}
