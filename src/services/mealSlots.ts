import { resolveMenuForDate } from './menuResolver';
import type { MenuItem } from '../types/menu';
import type { DailyMealSlots } from '../types/mealChoice';

function slotsFromItems(items: MenuItem[]): DailyMealSlots | null {
  const main = items.find((item) => item.category === 'classic');
  const vegetarian = items.find((item) => item.category === 'vegetarian');
  const soup = items.find((item) => item.category === 'soup');
  const dessert = items.find((item) => item.category === 'dessert');
  if (!main || !vegetarian || !soup || !dessert) return null;
  return { main, vegetarian, soup, dessert };
}

export function resolveMealSlotsForDate(lunchDate: string): DailyMealSlots | null {
  const availability = resolveMenuForDate(lunchDate);
  if (availability.status !== 'available') return null;
  return slotsFromItems(availability.items);
}
