import { resolveMenuForDate } from '../../services/menuResolver';
import { FIXTURE_LUNCH_DATE } from './dates';

export function getFixtureMenuItems() {
  const menu = resolveMenuForDate(FIXTURE_LUNCH_DATE);
  if (menu.status !== 'available') {
    throw new Error('Expected fixture lunch date to have an available menu');
  }
  return menu.items;
}

export const SECTION_KEYS = ['vegetarian', 'classic', 'soups', 'desserts'] as const;
