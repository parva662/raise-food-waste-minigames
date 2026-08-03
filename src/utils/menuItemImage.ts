import type { MenuCategory } from '../types/menu';
import {
  categoryPlaceholderImagePath,
  dedicatedMenuItemImagePath,
} from '../config/menuImagePaths';

/** Prefix-aware asset URL for Vite / GitHub Pages base. */
export function publicAssetUrl(relativePath: string): string {
  const base = import.meta.env.BASE_URL ?? '/';
  const normalized = relativePath.replace(/^\//, '');
  return `${base}${normalized}`;
}

export type MenuItemImageResolution = {
  dedicatedSrc: string;
  placeholderSrc: string;
  expectedDedicatedPath: string;
  /** When false at build time, UI still tries dedicated first and falls back on error. */
  hasDedicatedFile: boolean;
  usesPlaceholder: boolean;
};

export function resolveMenuItemImage(
  itemId: string,
  category: MenuCategory,
  hasDedicatedFile = false,
): MenuItemImageResolution {
  const expectedDedicatedPath = dedicatedMenuItemImagePath(itemId);
  const dedicatedSrc = publicAssetUrl(expectedDedicatedPath);
  const placeholderSrc = publicAssetUrl(categoryPlaceholderImagePath(category));
  const usesPlaceholder = !hasDedicatedFile;
  return {
    dedicatedSrc,
    placeholderSrc,
    expectedDedicatedPath,
    hasDedicatedFile,
    usesPlaceholder,
  };
}

export function primaryMenuItemImageSrc(resolution: MenuItemImageResolution): string {
  return resolution.hasDedicatedFile ? resolution.dedicatedSrc : resolution.placeholderSrc;
}
