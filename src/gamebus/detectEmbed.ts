/** True when running inside a parent frame (GameBus embedded task). */
export function isGameBusEmbed(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.parent !== window;
  } catch {
    return true;
  }
}
