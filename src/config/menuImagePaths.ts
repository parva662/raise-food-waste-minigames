import type { MenuCategory } from '../types/menu';

const PLACEHOLDER_BY_CATEGORY: Record<MenuCategory, string> = {
  classic: 'images/menu/placeholders/main.svg',
  vegetarian: 'images/menu/placeholders/vegetarian.svg',
  soup: 'images/menu/placeholders/soup.svg',
  dessert: 'images/menu/placeholders/dessert.svg',
};

export function dedicatedMenuItemImagePath(itemId: string): string {
  return `images/menu/items/${itemId}.webp`;
}

export function categoryPlaceholderImagePath(category: MenuCategory): string {
  return PLACEHOLDER_BY_CATEGORY[category];
}
