import type { DailyMenuSections } from '../types/menu';

export interface MenuOverrideReplace {
  type: 'replace';
  lunchDate: string;
  menu: DailyMenuSections;
  reason?: string;
}

export interface MenuOverrideClosed {
  type: 'closed';
  lunchDate: string;
  reason?: string;
}

export type MenuOverride = MenuOverrideReplace | MenuOverrideClosed;

/** Date-specific menu overrides take priority over generated dated menus (runtime-shifted dates). */
export const menuOverrides: MenuOverride[] = [
  {
    type: 'closed',
    lunchDate: '2026-08-17',
    reason: 'Public holiday',
  },
  {
    type: 'replace',
    lunchDate: '2026-09-15',
    menu: {
      classic: ['thai-pork-meatballs-with-rice'],
      vegetarian: ['quorn-and-mushroom-stew'],
      soups: ['pumpkin-soup'],
      desserts: ['apple-compote'],
    },
    reason: 'Special themed lunch day',
  },
];
