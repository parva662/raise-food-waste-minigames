export function dedicatedMenuItemImagePath(itemId: string): string {
  return `images/menu/items/${itemId}.webp`;
}

const PLACEHOLDER_BY_CATEGORY: Record<string, string> = {
  classic: 'images/menu/placeholders/main.svg',
  vegetarian: 'images/menu/placeholders/vegetarian.svg',
  soup: 'images/menu/placeholders/soup.svg',
  dessert: 'images/menu/placeholders/dessert.svg',
};

export function categoryPlaceholderImagePath(category: string): string {
  return PLACEHOLDER_BY_CATEGORY[category] ?? PLACEHOLDER_BY_CATEGORY.classic;
}
