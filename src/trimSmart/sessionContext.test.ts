import { describe, expect, it } from 'vitest';
import { parseHashRoute, isTrimSmartHashPath } from './sessionContext';

describe('trim smart hash routing', () => {
  it('parses hash route path without requiring query', () => {
    const { path, searchParams } = parseHashRoute('#/waste/trim-smart');
    expect(path).toBe('waste/trim-smart');
    expect(isTrimSmartHashPath(path)).toBe(true);
    expect(searchParams.toString()).toBe('');
  });

  it('ignores legacy query parameters without using them as session context', () => {
    const { path, searchParams } = parseHashRoute(
      '#/waste/trim-smart?sessionId=old&ingredientName=Carrot',
    );
    expect(path).toBe('waste/trim-smart');
    expect(searchParams.get('sessionId')).toBe('old');
  });
});
