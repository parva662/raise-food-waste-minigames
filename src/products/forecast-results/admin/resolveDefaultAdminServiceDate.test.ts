import { describe, expect, it } from 'vitest';
import { resolveDefaultAdminServiceDate } from '@/products/forecast-results/admin/resolveDefaultAdminServiceDate';

describe('resolveDefaultAdminServiceDate', () => {
  const dates = ['2026-10-26', '2026-10-27', '2026-10-28', '2026-10-29'] as const;

  it('prefers Helsinki today when that date has data', () => {
    expect(resolveDefaultAdminServiceDate(dates, '2026-10-28')).toEqual({
      date: '2026-10-28',
      isUpcoming: false,
    });
  });

  it('falls back to the most recent past date when today has no data', () => {
    expect(resolveDefaultAdminServiceDate(dates, '2026-10-30')).toEqual({
      date: '2026-10-29',
      isUpcoming: false,
    });
  });

  it('selects the nearest future date and flags it upcoming when only future data exists', () => {
    expect(resolveDefaultAdminServiceDate(['2026-10-29', '2026-10-30'], '2026-10-28')).toEqual({
      date: '2026-10-29',
      isUpcoming: true,
    });
  });

  it('returns null for an empty date list', () => {
    expect(resolveDefaultAdminServiceDate([], '2026-10-28')).toBeNull();
  });
});
