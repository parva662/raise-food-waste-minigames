const PREFIX = '[gamebus]';

export function gamebusDevLog(event: string, detail?: Record<string, unknown>): void {
  if (!import.meta.env.DEV) return;
  if (detail) {
    console.info(PREFIX, event, detail);
  } else {
    console.info(PREFIX, event);
  }
}
