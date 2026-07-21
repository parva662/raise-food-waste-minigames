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

/** Date-specific menu overrides take priority over the rotating schedule. */
export const menuOverrides: MenuOverride[] = [
  {
    type: 'closed',
    lunchDate: '2026-02-23',
    reason: 'Public holiday',
  },
  {
    type: 'replace',
    lunchDate: '2026-03-15',
    menu: {
      vegetarian: ['pasta-primavera', 'roasted-vegetables'],
      classic: ['grilled-chicken', 'meatballs'],
      soups: ['tomato-soup', 'mushroom-soup'],
      desserts: ['yogurt-berries', 'chocolate-cake'],
    },
    reason: 'Special themed lunch day',
  },
];
