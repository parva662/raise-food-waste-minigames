import {
  KITCHEN_SKILLS_INGREDIENT_CATEGORIES,
  type KitchenSkillsIngredientCategory,
} from '@/products/kitchen-skills-challenge/domain/types';

export const INGREDIENT_CATEGORY_LABELS: Record<KitchenSkillsIngredientCategory, string> = {
  root: 'Root vegetables',
  leafy: 'Leafy vegetables',
  fruit: 'Fruit vegetables',
  stem: 'Stem vegetables',
  herbs: 'Herbs',
  other: 'Other',
};

export function ingredientCategoryOptions(): {
  value: KitchenSkillsIngredientCategory;
  label: string;
}[] {
  return KITCHEN_SKILLS_INGREDIENT_CATEGORIES.map((value) => ({
    value,
    label: INGREDIENT_CATEGORY_LABELS[value],
  }));
}

export function isKitchenSkillsIngredientCategory(
  value: string,
): value is KitchenSkillsIngredientCategory {
  return (KITCHEN_SKILLS_INGREDIENT_CATEGORIES as readonly string[]).includes(value);
}

export function storedCategoryFromLabel(label: string): KitchenSkillsIngredientCategory | null {
  const match = ingredientCategoryOptions().find((option) => option.label === label);
  return match?.value ?? null;
}
