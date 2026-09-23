export const KITCHEN_DAY_HASH_ROUTE = '#/kitchen-day';

export type KitchenDayHashSection = 'trim' | 'reuse' | 'portion' | 'my-day';

export function parseKitchenDaySection(hash: string = window.location.hash): KitchenDayHashSection {
  const raw = hash.startsWith('#') ? hash.slice(1) : hash;
  const trimmed = raw.startsWith('/') ? raw.slice(1) : raw;
  const path = trimmed.split('?')[0] ?? '';
  if (path === 'kitchen-day/reuse' || path === 'kitchen-day/rescue') return 'reuse';
  if (path === 'kitchen-day/portion') return 'portion';
  if (path === 'kitchen-day/my-day' || path === 'kitchen-day/overview') return 'my-day';
  return 'trim';
}

export function kitchenDayHashFor(section: KitchenDayHashSection): string {
  if (section === 'trim') return KITCHEN_DAY_HASH_ROUTE;
  return `${KITCHEN_DAY_HASH_ROUTE}/${section}`;
}

export function kitchenDayHashMatches(hash: string): boolean {
  const raw = hash.startsWith('#') ? hash.slice(1) : hash;
  const trimmed = raw.startsWith('/') ? raw.slice(1) : raw;
  const path = trimmed.split('?')[0] ?? '';
  return path === 'kitchen-day' || path.startsWith('kitchen-day/');
}
