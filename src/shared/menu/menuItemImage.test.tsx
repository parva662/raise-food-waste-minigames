import { describe, it, expect } from 'vitest';
import { foodCatalogue } from '@/shared/menu/foodCatalogue';
import { resolveMenuItemImage } from '@/shared/menu/menuItemImage';

describe('menuItemImage', () => {
  it('uses category placeholder when dedicated file is absent', () => {
    const resolution = resolveMenuItemImage('apple-compote', 'dessert', false);
    expect(resolution.usesPlaceholder).toBe(true);
    expect(resolution.placeholderSrc).toContain('placeholders/dessert.svg');
    expect(resolution.dedicatedSrc).toContain('items/apple-compote.webp');
  });

  it('uses dedicated path when manifest reports a file', () => {
    const resolution = resolveMenuItemImage('apple-compote', 'dessert', true);
    expect(resolution.hasDedicatedFile).toBe(true);
    expect(resolution.usesPlaceholder).toBe(false);
  });

  it('resolves every catalogue item to dedicated and placeholder URLs', () => {
    for (const item of Object.values(foodCatalogue)) {
      expect(item.imageDedicated).toMatch(/items\/.+\.webp$/);
      expect(item.imagePlaceholder).toMatch(/placeholders\/.+\.svg$/);
    }
  });
});
