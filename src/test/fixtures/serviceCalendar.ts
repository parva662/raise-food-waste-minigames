import { vi } from 'vitest';
import * as menuResolverModule from '../../services/menuResolver';

/**
 * Marks the given dates as explicitly closed / non-service; every other date keeps its
 * normal weekday classification regardless of whether menu content resolves.
 */
export function mockExplicitClosures(...closedDates: string[]) {
  return vi
    .spyOn(menuResolverModule, 'isExplicitlyClosedServiceDate')
    .mockImplementation((isoDate) => closedDates.includes(isoDate));
}
