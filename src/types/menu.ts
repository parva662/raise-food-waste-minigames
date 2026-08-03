export type MenuCategory = 'vegetarian' | 'classic' | 'soup' | 'dessert';

export type Weekday =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday';

export interface FoodItem {
  id: string;
  name: string;
  category: MenuCategory;
  unit: string;
  maxQuantity: number;
  image: string;
  dietaryTags: string[];
  /** Category placeholder used when dedicated image is missing or fails to load. */
  imagePlaceholder?: string;
  /** Expected dedicated asset path (may 404 until photography is added). */
  imageDedicated?: string;
  usesPlaceholderImage?: boolean;
}

/** Resolved menu item shown in the UI (same shape as catalogue entry). */
export type MenuItem = FoodItem;

export interface SelectionEntry {
  itemId: string;
  name: string;
  quantity: number;
  unit: string;
}

export type MenuAvailability =
  | {
      status: 'available';
      items: MenuItem[];
      dailyMenuId: string;
      menuCycleWeek: number;
      /** Workbook sheet week label when using generated dated menus. */
      sheetWeek?: number;
      menuVersion: string;
    }
  | { status: 'closed'; reason?: string }
  | { status: 'unavailable' };

export interface DailyMenuDefinition {
  id: string;
  week: 1 | 2 | 3;
  weekday: Weekday;
  vegetarian: string[];
  classic: string[];
  soups: string[];
  desserts: string[];
}

export interface DailyMenuSections {
  vegetarian: string[];
  classic: string[];
  soups: string[];
  desserts: string[];
}
