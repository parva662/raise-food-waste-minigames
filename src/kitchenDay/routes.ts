export const KITCHEN_DAY_HASH_ROUTE = '#/kitchen-day';
export const KITCHEN_DAY_PROGRESS_HASH_ROUTE = '#/kitchen-day-progress';
export const KITCHEN_DAY_TUTOR_HASH_ROUTE = '#/kitchen-day-tutor';

export type KitchenDayHashSection = 'trim' | 'reuse' | 'portion' | 'review';

function hashPath(hash: string = window.location.hash): string {
  const raw = hash.startsWith('#') ? hash.slice(1) : hash;
  const trimmed = raw.startsWith('/') ? raw.slice(1) : raw;
  return trimmed.split('?')[0] ?? '';
}

function hashSearch(hash: string = window.location.hash): string {
  const raw = hash.startsWith('#') ? hash.slice(1) : hash;
  const trimmed = raw.startsWith('/') ? raw.slice(1) : raw;
  return trimmed.split('?')[1] ?? '';
}

export function parseKitchenDaySection(hash: string = window.location.hash): KitchenDayHashSection {
  const path = hashPath(hash);
  if (path === 'kitchen-day/reuse' || path === 'kitchen-day/rescue') return 'reuse';
  if (path === 'kitchen-day/portion') return 'portion';
  if (path === 'kitchen-day/review' || path === 'kitchen-day/my-day' || path === 'kitchen-day/overview') {
    return 'review';
  }
  return 'trim';
}

export function parseKitchenDaySelectedSessionId(hash: string = window.location.hash): string | null {
  const sessionId = new URLSearchParams(hashSearch(hash)).get('sessionId')?.trim();
  return sessionId && sessionId.length > 0 ? sessionId : null;
}

export function kitchenDayHashFor(section: KitchenDayHashSection): string {
  if (section === 'trim') return KITCHEN_DAY_HASH_ROUTE;
  return `${KITCHEN_DAY_HASH_ROUTE}/${section}`;
}

export function kitchenDayTutorHashFor(sessionId?: string): string {
  if (!sessionId) return KITCHEN_DAY_TUTOR_HASH_ROUTE;
  return `${KITCHEN_DAY_TUTOR_HASH_ROUTE}?sessionId=${encodeURIComponent(sessionId)}`;
}

export function kitchenDayHashMatches(hash: string): boolean {
  const path = hashPath(hash);
  return path === 'kitchen-day' || path.startsWith('kitchen-day/');
}

export function kitchenDayProgressHashMatches(hash: string): boolean {
  const path = hashPath(hash);
  return path === 'kitchen-day-progress';
}

export function kitchenDayTutorHashMatches(hash: string): boolean {
  const path = hashPath(hash);
  return path === 'kitchen-day-tutor';
}
