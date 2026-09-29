import type { ExitMessage } from '@/platform/gamebus/types';

export function postGameBusExit(): void {
  const message: ExitMessage = { type: 'EXIT' };
  window.parent.postMessage(message, '*');
}
