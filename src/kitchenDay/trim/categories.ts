import {
  KITCHEN_DAY_INGREDIENT_CATEGORIES,
  type KitchenDayIngredientCategory,
} from '../types';

export const INGREDIENT_CATEGORY_LABELS: Record<KitchenDayIngredientCategory, string> = {
  root: 'Root vegetables',
  leafy: 'Leafy vegetables',
  fruit: 'Fruit vegetables',
  stem: 'Stem vegetables',
  herbs: 'Herbs',
  other: 'Other',
};

export function ingredientCategoryOptions(): {
  value: KitchenDayIngredientCategory;
  label: string;
}[] {
  return KITCHEN_DAY_INGREDIENT_CATEGORIES.map((value) => ({
    value,
    label: INGREDIENT_CATEGORY_LABELS[value],
  }));
}

export function isKitchenDayIngredientCategory(
  value: string,
): value is KitchenDayIngredientCategory {
  return (KITCHEN_DAY_INGREDIENT_CATEGORIES as readonly string[]).includes(value);
}

export function storedCategoryFromLabel(label: string): KitchenDayIngredientCategory | null {
  const match = ingredientCategoryOptions().find((option) => option.label === label);
  return match?.value ?? null;
}
