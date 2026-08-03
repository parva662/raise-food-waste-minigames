// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { FoodImage } from '../components/FoodImage';
import { foodCatalogue } from '../data/foodCatalogue';
import { resolveMenuItemImage, publicAssetUrl } from './menuItemImage';

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

describe('FoodImage', () => {
  it('falls back from broken dedicated image to placeholder', () => {
    const placeholder = publicAssetUrl('images/menu/placeholders/main.svg');
    const { container } = render(
      <FoodImage
        src="/missing-dedicated.webp"
        placeholderSrc={placeholder}
        alt="Test dish"
        category="classic"
      />,
    );
    const img = container.querySelector('img');
    expect(img).toBeTruthy();
    fireEvent.error(img!);
    expect(container.querySelector('img')?.getAttribute('src')).toBe(placeholder);
  });
});
