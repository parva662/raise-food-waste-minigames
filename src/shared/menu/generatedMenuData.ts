import type { GeneratedCatalogueEntry, GeneratedDailyMenu, GeneratedMenuMeta, ImageManifest } from '@/shared/menu/generatedMenu';
import type { FoodItem, MenuItem } from '@/shared/menu/types';
import { primaryMenuItemImageSrc, resolveMenuItemImage } from '@/shared/menu/menuItemImage';
import catalogueJson from '@/data/generated/food-catalogue.json';
import dailyMenusJson from '@/data/generated/daily-menus.json';
import menuMetaJson from '@/data/generated/menu-meta.json';
import imageManifestJson from '@/data/generated/image-manifest.json';

const catalogueEntries = catalogueJson as GeneratedCatalogueEntry[];
const dailyMenus = dailyMenusJson as GeneratedDailyMenu[];
const menuMeta = menuMetaJson as GeneratedMenuMeta;
const imageManifest = imageManifestJson as ImageManifest;

const dailyMenuByDate = new Map<string, GeneratedDailyMenu>(
  dailyMenus.map((day) => [day.date, day]),
);

function toMenuItem(entry: GeneratedCatalogueEntry): MenuItem {
  const manifest = imageManifest[entry.id];
  const hasDedicated = manifest?.hasDedicatedFile === true;
  const resolution = resolveMenuItemImage(entry.id, entry.category, hasDedicated);
  return {
    id: entry.id,
    name: entry.name,
    category: entry.category,
    unit: entry.unit,
    maxQuantity: entry.maxQuantity,
    image: primaryMenuItemImageSrc(resolution),
    imagePlaceholder: resolution.placeholderSrc,
    imageDedicated: resolution.dedicatedSrc,
    usesPlaceholderImage: resolution.usesPlaceholder,
    dietaryTags: entry.dietaryTags,
  };
}

const catalogueMap: Record<string, MenuItem> = Object.fromEntries(
  catalogueEntries.map((entry) => [entry.id, toMenuItem(entry)]),
);

export const foodCatalogue: Record<string, FoodItem> = catalogueMap;

export const foodCatalogueList = Object.values(foodCatalogue);

export function getGeneratedDailyMenu(lunchDate: string): GeneratedDailyMenu | undefined {
  return dailyMenuByDate.get(lunchDate);
}

export function getGeneratedMenuMeta(): GeneratedMenuMeta {
  return menuMeta;
}

export function getAllGeneratedDailyMenus(): GeneratedDailyMenu[] {
  return dailyMenus;
}

export function getImageManifest(): ImageManifest {
  return imageManifest;
}
