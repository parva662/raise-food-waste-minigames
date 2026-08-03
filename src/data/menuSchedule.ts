import type { DailyMenuDefinition, Weekday } from '../types/menu';

/** @deprecated Legacy 3-week rotation — not used at runtime. Dated menus come from `src/data/generated/`. */
export const dailyMenus: DailyMenuDefinition[] = [
  {
    id: 'week1-monday',
    week: 1,
    weekday: 'monday',
    vegetarian: ['pasta-primavera', 'chickpea-curry'],
    classic: ['meatballs', 'grilled-chicken'],
    soups: ['tomato-soup', 'mushroom-soup'],
    desserts: ['yogurt-berries', 'chocolate-cake'],
  },
  {
    id: 'week1-tuesday',
    week: 1,
    weekday: 'tuesday',
    vegetarian: ['roasted-vegetables', 'chickpea-curry'],
    classic: ['meatballs', 'rice-with-sauce'],
    soups: ['tomato-soup', 'mushroom-soup'],
    desserts: ['yogurt-berries', 'chocolate-cake'],
  },
  {
    id: 'week1-wednesday',
    week: 1,
    weekday: 'wednesday',
    vegetarian: ['pasta-primavera', 'roasted-vegetables'],
    classic: ['grilled-chicken', 'rice-with-sauce'],
    soups: ['tomato-soup', 'mushroom-soup'],
    desserts: ['yogurt-berries', 'chocolate-cake'],
  },
  {
    id: 'week1-thursday',
    week: 1,
    weekday: 'thursday',
    vegetarian: ['chickpea-curry', 'roasted-vegetables'],
    classic: ['meatballs', 'grilled-chicken'],
    soups: ['tomato-soup', 'mushroom-soup'],
    desserts: ['yogurt-berries', 'chocolate-cake'],
  },
  {
    id: 'week1-friday',
    week: 1,
    weekday: 'friday',
    vegetarian: ['pasta-primavera', 'roasted-vegetables'],
    classic: ['grilled-chicken', 'rice-with-sauce'],
    soups: ['tomato-soup', 'mushroom-soup'],
    desserts: ['yogurt-berries', 'chocolate-cake'],
  },
  {
    id: 'week2-monday',
    week: 2,
    weekday: 'monday',
    vegetarian: ['roasted-vegetables', 'pasta-primavera'],
    classic: ['grilled-chicken', 'meatballs'],
    soups: ['mushroom-soup', 'tomato-soup'],
    desserts: ['chocolate-cake', 'yogurt-berries'],
  },
  {
    id: 'week2-tuesday',
    week: 2,
    weekday: 'tuesday',
    vegetarian: ['chickpea-curry', 'pasta-primavera'],
    classic: ['meatballs', 'grilled-chicken'],
    soups: ['tomato-soup', 'mushroom-soup'],
    desserts: ['yogurt-berries', 'chocolate-cake'],
  },
  {
    id: 'week2-wednesday',
    week: 2,
    weekday: 'wednesday',
    vegetarian: ['roasted-vegetables', 'chickpea-curry'],
    classic: ['rice-with-sauce', 'grilled-chicken'],
    soups: ['mushroom-soup', 'tomato-soup'],
    desserts: ['chocolate-cake', 'yogurt-berries'],
  },
  {
    id: 'week2-thursday',
    week: 2,
    weekday: 'thursday',
    vegetarian: ['pasta-primavera', 'chickpea-curry'],
    classic: ['grilled-chicken', 'rice-with-sauce'],
    soups: ['tomato-soup', 'mushroom-soup'],
    desserts: ['yogurt-berries', 'chocolate-cake'],
  },
  {
    id: 'week2-friday',
    week: 2,
    weekday: 'friday',
    vegetarian: ['roasted-vegetables', 'pasta-primavera'],
    classic: ['meatballs', 'rice-with-sauce'],
    soups: ['mushroom-soup', 'tomato-soup'],
    desserts: ['chocolate-cake', 'yogurt-berries'],
  },
  {
    id: 'week3-monday',
    week: 3,
    weekday: 'monday',
    vegetarian: ['chickpea-curry', 'roasted-vegetables'],
    classic: ['rice-with-sauce', 'meatballs'],
    soups: ['tomato-soup', 'mushroom-soup'],
    desserts: ['chocolate-cake', 'yogurt-berries'],
  },
  {
    id: 'week3-tuesday',
    week: 3,
    weekday: 'tuesday',
    vegetarian: ['roasted-vegetables', 'chickpea-curry'],
    classic: ['meatballs', 'grilled-chicken'],
    soups: ['mushroom-soup', 'tomato-soup'],
    desserts: ['yogurt-berries', 'chocolate-cake'],
  },
  {
    id: 'week3-wednesday',
    week: 3,
    weekday: 'wednesday',
    vegetarian: ['pasta-primavera', 'chickpea-curry'],
    classic: ['grilled-chicken', 'meatballs'],
    soups: ['tomato-soup', 'mushroom-soup'],
    desserts: ['chocolate-cake', 'yogurt-berries'],
  },
  {
    id: 'week3-thursday',
    week: 3,
    weekday: 'thursday',
    vegetarian: ['roasted-vegetables', 'pasta-primavera'],
    classic: ['rice-with-sauce', 'grilled-chicken'],
    soups: ['mushroom-soup', 'tomato-soup'],
    desserts: ['yogurt-berries', 'chocolate-cake'],
  },
  {
    id: 'week3-friday',
    week: 3,
    weekday: 'friday',
    vegetarian: ['chickpea-curry', 'pasta-primavera'],
    classic: ['meatballs', 'grilled-chicken'],
    soups: ['tomato-soup', 'mushroom-soup'],
    desserts: ['chocolate-cake', 'yogurt-berries'],
  },
];

const dailyMenuLookup = new Map<string, DailyMenuDefinition>(
  dailyMenus.map((menu) => [`${menu.week}-${menu.weekday}`, menu]),
);

export function findDailyMenu(week: number, weekday: Weekday): DailyMenuDefinition | undefined {
  return dailyMenuLookup.get(`${week}-${weekday}`);
}

export function dailyMenuItemIds(menu: DailyMenuDefinition): string[] {
  return [...menu.vegetarian, ...menu.classic, ...menu.soups, ...menu.desserts];
}
