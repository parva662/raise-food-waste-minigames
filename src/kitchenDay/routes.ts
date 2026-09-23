export const KITCHEN_DAY_HASH_ROUTE = '#/kitchen-day';

export type KitchenDayHashSection = 'trim' | 'reuse' | 'portion' | 'my-day' | 'chef';

function kitchenDayPath(hash: string = window.location.hash): string {
  const raw = hash.startsWith('#') ? hash.slice(1) : hash;
  const trimmed = raw.startsWith('/') ? raw.slice(1) : raw;
  return trimmed.split('?')[0] ?? '';
}

function kitchenDaySearch(hash: string = window.location.hash): string {
  const raw = hash.startsWith('#') ? hash.slice(1) : hash;
  const trimmed = raw.startsWith('/') ? raw.slice(1) : raw;
  const query = trimmed.split('?')[1] ?? '';
  return query;
}

export function parseKitchenDaySection(hash: string = window.location.hash): KitchenDayHashSection {
  const path = kitchenDayPath(hash);
  if (path === 'kitchen-day/reuse' || path === 'kitchen-day/rescue') return 'reuse';
  if (path === 'kitchen-day/portion') return 'portion';
  if (path === 'kitchen-day/my-day' || path === 'kitchen-day/overview') return 'my-day';
  if (path === 'kitchen-day/chef') return 'chef';
  return 'trim';
}

export function parseKitchenDaySelectedSessionId(hash: string = window.location.hash): string | null {
  const params = new URLSearchParams(kitchenDaySearch(hash));
  const sessionId = params.get('sessionId')?.trim();
  return sessionId && sessionId.length > 0 ? sessionId : null;
}

export function kitchenDayHashFor(section: KitchenDayHashSection): string {
  if (section === 'trim') return KITCHEN_DAY_HASH_ROUTE;
  return `${KITCHEN_DAY_HASH_ROUTE}/${section}`;
}

export function kitchenDayChefHashFor(sessionId?: string): string {
  if (!sessionId) return kitchenDayHashFor('chef');
  return `${kitchenDayHashFor('chef')}?sessionId=${encodeURIComponent(sessionId)}`;
}

export function kitchenDayHashMatches(hash: string): boolean {
  const path = kitchenDayPath(hash);
  return path === 'kitchen-day' || path.startsWith('kitchen-day/');
}
