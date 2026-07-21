import { describe, it, expect, beforeEach } from 'vitest';
import { fromZonedTime } from 'date-fns-tz';
import { getMenuCycleWeek, resolveMenuForDate, getDailyMenuCatalogue } from '../services/menuResolver';
import {
  getSubmissionPhase,
  getPointsBreakdownForInstant,
  isSubmissionAllowed,
  requiresLateUpdateConfirmation,
} from '../services/submissionWindow';
import {
  createDeclarationFromDraft,
  buildInitialQuantities,
  reconcileDraftWithMenu,
} from '../utils/declaration';
import {
  LocalStorageDeclarationRepository,
  buildStorageKey,
  normalizeDeclarationRecord,
} from '../repositories/declarationRepository';
import type { ActiveDeclaration } from '../types/declaration';
import { resolveMenuForDate as resolveMenu } from '../services/menuResolver';
import { CANTEEN_CONFIG } from '../config/canteen';
import { getLateTotalPoints, getOnTimeTotalPoints } from '../utils/points';

function helsinki(date: string, time: string): Date {
  return fromZonedTime(`${date} ${time}`, 'Europe/Helsinki');
}

const LUNCH_DATE = '2026-01-07'; // Wednesday
const SUBMISSION_DAY = '2026-01-06';

describe('menu rotation', () => {
  it('defines exactly 15 complete daily menus', () => {
    const catalogue = getDailyMenuCatalogue();
    expect(catalogue).toHaveLength(15);
    for (const dailyMenu of catalogue) {
      expect(dailyMenu.vegetarian).toHaveLength(2);
      expect(dailyMenu.classic).toHaveLength(2);
      expect(dailyMenu.soups).toHaveLength(2);
      expect(dailyMenu.desserts).toHaveLength(2);
    }
  });

  it('resolves a complete daily menu with eight selectable dishes', () => {
    const menu = resolveMenuForDate('2026-01-06'); // Week 1 Tuesday
    expect(menu.status).toBe('available');
    if (menu.status === 'available') {
      expect(menu.items).toHaveLength(8);
      expect(menu.items.filter((item) => item.category === 'vegetarian')).toHaveLength(2);
      expect(menu.items.filter((item) => item.category === 'classic')).toHaveLength(2);
      expect(menu.items.filter((item) => item.category === 'soup')).toHaveLength(2);
      expect(menu.items.filter((item) => item.category === 'dessert')).toHaveLength(2);
    }
  });

  it('resolves Week 1 menu', () => {
    expect(getMenuCycleWeek('2026-01-06')).toBe(1);
    const menu = resolveMenuForDate('2026-01-06');
    expect(menu.status).toBe('available');
    if (menu.status === 'available') {
      expect(menu.menuCycleWeek).toBe(1);
      expect(menu.dailyMenuId).toBe('week1-tuesday');
    }
  });

  it('resolves Week 2 menu', () => {
    expect(getMenuCycleWeek('2026-01-13')).toBe(2);
    const menu = resolveMenuForDate('2026-01-13');
    expect(menu.status).toBe('available');
    if (menu.status === 'available') {
      expect(menu.dailyMenuId).toBe('week2-tuesday');
      expect(menu.items).toHaveLength(8);
    }
  });

  it('resolves Week 3 menu', () => {
    expect(getMenuCycleWeek('2026-01-21')).toBe(3);
    const menu = resolveMenuForDate('2026-01-21');
    expect(menu.status).toBe('available');
    if (menu.status === 'available') {
      expect(menu.menuCycleWeek).toBe(3);
      expect(menu.dailyMenuId).toBe('week3-wednesday');
      expect(menu.items).toHaveLength(8);
    }
  });

  it('rotates Week 4 back to Week 1', () => {
    expect(getMenuCycleWeek('2026-01-27')).toBe(1);
  });

  it('resolves the correct weekday menu', () => {
    const monday = resolveMenuForDate('2026-01-19'); // Week 2 Monday
    const thursday = resolveMenuForDate('2026-01-15'); // Week 2 Thursday
    expect(monday.status).toBe('available');
    expect(thursday.status).toBe('available');
    if (monday.status === 'available' && thursday.status === 'available') {
      expect(monday.menuCycleWeek).toBe(2);
      expect(thursday.menuCycleWeek).toBe(2);
      expect(monday.items.map((item) => item.id)).not.toEqual(thursday.items.map((item) => item.id));
    }
  });

  it('applies a date-specific menu replacement override', () => {
    const menu = resolveMenuForDate('2026-03-15');
    expect(menu.status).toBe('available');
    if (menu.status === 'available') {
      expect(menu.items).toHaveLength(8);
      expect(menu.items.filter((item) => item.category === 'vegetarian')).toHaveLength(2);
      expect(menu.items.filter((item) => item.category === 'classic')).toHaveLength(2);
    }
  });

  it('handles a closed-date override', () => {
    const menu = resolveMenuForDate('2026-02-23');
    expect(menu.status).toBe('closed');
  });

  it('returns unavailable outside menu validity', () => {
    const menu = resolveMenuForDate('2027-01-15');
    expect(menu.status).toBe('unavailable');
  });
});

describe('submission window', () => {
  it('gives 25 total points before 18:00', () => {
    expect(getSubmissionPhase(helsinki(SUBMISSION_DAY, '17:30:00'), LUNCH_DATE)).toBe('on-time');
    expect(getPointsBreakdownForInstant(helsinki(SUBMISSION_DAY, '17:30:00'), LUNCH_DATE)?.totalPoints).toBe(25);
  });

  it('gives 25 total points exactly at 18:00', () => {
    expect(getSubmissionPhase(helsinki(SUBMISSION_DAY, '18:00:00'), LUNCH_DATE)).toBe('on-time');
    expect(getPointsBreakdownForInstant(helsinki(SUBMISSION_DAY, '18:00:00'), LUNCH_DATE)?.totalPoints).toBe(25);
  });

  it('gives 15 total points after 18:00', () => {
    expect(getSubmissionPhase(helsinki(SUBMISSION_DAY, '18:00:01'), LUNCH_DATE)).toBe('late');
    expect(getPointsBreakdownForInstant(helsinki(SUBMISSION_DAY, '20:15:00'), LUNCH_DATE)?.totalPoints).toBe(15);
  });

  it('gives 15 total points exactly at 23:00', () => {
    expect(getSubmissionPhase(helsinki(SUBMISSION_DAY, '23:00:00'), LUNCH_DATE)).toBe('late');
    expect(getPointsBreakdownForInstant(helsinki(SUBMISSION_DAY, '23:00:00'), LUNCH_DATE)?.totalPoints).toBe(15);
  });

  it('rejects submission after 23:00', () => {
    expect(getSubmissionPhase(helsinki(SUBMISSION_DAY, '23:00:01'), LUNCH_DATE)).toBe('closed');
    expect(getPointsBreakdownForInstant(helsinki(SUBMISSION_DAY, '23:00:01'), LUNCH_DATE)).toBeNull();
    expect(isSubmissionAllowed(helsinki(SUBMISSION_DAY, '23:00:01'), LUNCH_DATE)).toBe(false);
  });

  it('keeps late declarations included in forecast via declaration shape', () => {
    const menu = resolveMenu(LUNCH_DATE);
    if (menu.status !== 'available') throw new Error('Expected available menu');
    const declaration = createDeclarationFromDraft(
      { quantities: { ...buildInitialQuantities(menu.items), 'rice-with-sauce': 1 }, noLunch: false },
      menu.items,
      LUNCH_DATE,
      1,
      CANTEEN_CONFIG.menuVersion,
      null,
      () => helsinki(SUBMISSION_DAY, '20:00:00'),
    );
    expect(declaration?.includeInForecast).toBe(true);
    expect(declaration?.totalPoints).toBe(15);
    expect(declaration?.timingAdjustment).toBe(-5);
  });
});

describe('declaration repository and upsert', () => {
  const storage = new Map<string, string>();

  beforeEach(() => {
    storage.clear();
    globalThis.localStorage = {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => {
        storage.set(key, value);
      },
      removeItem: (key: string) => {
        storage.delete(key);
      },
      clear: () => storage.clear(),
      key: () => null,
      length: 0,
    };
  });

  const repo = new LocalStorageDeclarationRepository();
  const lunchDate = LUNCH_DATE;
  const menu = resolveMenuForDate(lunchDate);
  const menuItems = menu.status === 'available' ? menu.items : [];

  function draft(quantities: Record<string, number>, noLunch = false) {
    const base = buildInitialQuantities(menuItems);
    return { quantities: { ...base, ...quantities }, noLunch };
  }

  it('creates one declaration on first submission', () => {
    const created = createDeclarationFromDraft(
      draft({ 'rice-with-sauce': 2 }),
      menuItems,
      lunchDate,
      1,
      CANTEEN_CONFIG.menuVersion,
      null,
      () => helsinki(SUBMISSION_DAY, '12:00:00'),
    );
    expect(created).not.toBeNull();
    repo.upsertDeclaration(created!);
    expect(storage.size).toBe(1);
    expect(repo.getDeclaration(CANTEEN_CONFIG.studentId, lunchDate)?.selections).toHaveLength(1);
  });

  it('replaces an existing declaration on update', () => {
    const first = createDeclarationFromDraft(
      draft({ 'rice-with-sauce': 2 }),
      menuItems,
      lunchDate,
      1,
      CANTEEN_CONFIG.menuVersion,
      null,
      () => helsinki(SUBMISSION_DAY, '12:00:00'),
    )!;
    repo.upsertDeclaration(first);

    const second = createDeclarationFromDraft(
      draft({ 'roasted-vegetables': 1 }),
      menuItems,
      lunchDate,
      1,
      CANTEEN_CONFIG.menuVersion,
      first,
      () => helsinki(SUBMISSION_DAY, '12:30:00'),
    )!;
    repo.upsertDeclaration(second);

    expect(storage.size).toBe(1);
    const saved = repo.getDeclaration(CANTEEN_CONFIG.studentId, lunchDate)!;
    expect(saved.selections[0].itemId).toBe('roasted-vegetables');
    expect(saved.submittedAt).toBe(first.submittedAt);
    expect(saved.updatedAt).not.toBe(first.updatedAt);
  });

  it('keeps only one declaration after multiple updates', () => {
    let current: ActiveDeclaration | null = null;
    for (let index = 0; index < 3; index += 1) {
      current = createDeclarationFromDraft(
        draft({ 'rice-with-sauce': index + 1 }),
        menuItems,
        lunchDate,
        1,
        CANTEEN_CONFIG.menuVersion,
        current,
        () => helsinki(SUBMISSION_DAY, `12:0${index}:00`),
      )!;
      repo.upsertDeclaration(current);
    }
    expect(storage.size).toBe(1);
  });

  it('stores new-format scoring fields on submission', () => {
    const created = createDeclarationFromDraft(
      draft({ 'rice-with-sauce': 1 }),
      menuItems,
      lunchDate,
      1,
      CANTEEN_CONFIG.menuVersion,
      null,
      () => helsinki(SUBMISSION_DAY, '12:00:00'),
    )!;
    repo.upsertDeclaration(created);
    const saved = repo.getDeclaration(CANTEEN_CONFIG.studentId, lunchDate)!;
    expect(saved.basePoints).toBe(20);
    expect(saved.timingAdjustment).toBe(5);
    expect(saved.totalPoints).toBe(25);
  });

  it('keeps on-time updates before 18:00 at 25 total points', () => {
    const first = createDeclarationFromDraft(
      draft({ 'rice-with-sauce': 1 }),
      menuItems,
      lunchDate,
      1,
      CANTEEN_CONFIG.menuVersion,
      null,
      () => helsinki(SUBMISSION_DAY, '12:00:00'),
    )!;
    const updated = createDeclarationFromDraft(
      draft({ 'rice-with-sauce': 2 }),
      menuItems,
      lunchDate,
      1,
      CANTEEN_CONFIG.menuVersion,
      first,
      () => helsinki(SUBMISSION_DAY, '17:00:00'),
    )!;
    expect(updated.totalPoints).toBe(25);
    expect(updated.timingStatus).toBe('on-time');
  });

  it('changes an on-time declaration to 15 total points on late update', () => {
    const first = createDeclarationFromDraft(
      draft({ 'rice-with-sauce': 1 }),
      menuItems,
      lunchDate,
      1,
      CANTEEN_CONFIG.menuVersion,
      null,
      () => helsinki(SUBMISSION_DAY, '12:00:00'),
    )!;
    repo.upsertDeclaration(first);

    const lateUpdate = createDeclarationFromDraft(
      draft({ 'rice-with-sauce': 3 }),
      menuItems,
      lunchDate,
      1,
      CANTEEN_CONFIG.menuVersion,
      first,
      () => helsinki(SUBMISSION_DAY, '19:00:00'),
    )!;
    expect(lateUpdate.totalPoints).toBe(15);
    expect(lateUpdate.timingAdjustment).toBe(-5);
    expect(requiresLateUpdateConfirmation(first.timingStatus, helsinki(SUBMISSION_DAY, '19:00:00'), lunchDate)).toBe(true);
  });

  it('does not change score when app is opened late without submitting', () => {
    const first = createDeclarationFromDraft(
      draft({ 'rice-with-sauce': 1 }),
      menuItems,
      lunchDate,
      1,
      CANTEEN_CONFIG.menuVersion,
      null,
      () => helsinki(SUBMISSION_DAY, '12:00:00'),
    )!;
    repo.upsertDeclaration(first);
    const reopened = repo.getDeclaration(CANTEEN_CONFIG.studentId, lunchDate)!;
    expect(reopened.totalPoints).toBe(25);
    expect(getSubmissionPhase(helsinki(SUBMISSION_DAY, '21:00:00'), lunchDate)).toBe('late');
  });

  it('supports no-lunch declarations with scoring', () => {
    const declaration = createDeclarationFromDraft(
      { quantities: buildInitialQuantities(menuItems), noLunch: true },
      menuItems,
      lunchDate,
      1,
      CANTEEN_CONFIG.menuVersion,
      null,
      () => helsinki(SUBMISSION_DAY, '19:30:00'),
    );
    expect(declaration?.noLunch).toBe(true);
    expect(declaration?.totalPoints).toBe(15);
    expect(declaration?.includeInForecast).toBe(true);
  });

  it('uses a deterministic storage key per student and lunch date', () => {
    expect(buildStorageKey('demo-student-001', lunchDate)).toBe(
      `lunch-declaration-demo-student-001-${lunchDate}`,
    );
  });

  it('requires review when menu version changes', () => {
    const savedSnapshot = {
      quantities: draft({ 'rice-with-sauce': 1 }).quantities,
      noLunch: false,
      submittedAt: helsinki(SUBMISSION_DAY, '12:00:00').toISOString(),
      updatedAt: helsinki(SUBMISSION_DAY, '12:00:00').toISOString(),
      timingStatus: 'on-time' as const,
      basePoints: 20,
      timingAdjustment: 5 as const,
      totalPoints: 25,
      menuVersion: 'old-version',
      menuCycleWeek: 1,
    };
    const result = reconcileDraftWithMenu(
      savedSnapshot,
      savedSnapshot,
      menuItems,
      CANTEEN_CONFIG.menuVersion,
    );
    expect(result.menuChanged).toBe(true);
  });

  it('reads legacy localStorage records safely', () => {
    const legacy = {
      studentId: CANTEEN_CONFIG.studentId,
      lunchDate,
      menuCycleWeek: 1,
      menuVersion: CANTEEN_CONFIG.menuVersion,
      noLunch: false,
      selections: [{ itemId: 'rice-with-sauce', name: 'Rice', quantity: 1, unit: 'portion' }],
      timingStatus: 'on-time',
      points: 5,
      submittedAt: helsinki(SUBMISSION_DAY, '12:00:00').toISOString(),
      updatedAt: helsinki(SUBMISSION_DAY, '12:00:00').toISOString(),
      includeInForecast: true,
    };
    storage.set(buildStorageKey(CANTEEN_CONFIG.studentId, lunchDate), JSON.stringify(legacy));
    const restored = repo.getDeclaration(CANTEEN_CONFIG.studentId, lunchDate)!;
    expect(restored.basePoints).toBe(20);
    expect(restored.timingAdjustment).toBe(5);
    expect(restored.totalPoints).toBe(25);
  });

  it('normalizes legacy late records from timing status', () => {
    const normalized = normalizeDeclarationRecord({
      studentId: CANTEEN_CONFIG.studentId,
      lunchDate,
      timingStatus: 'late',
      points: -5,
    })!;
    expect(normalized.totalPoints).toBe(15);
    expect(normalized.timingAdjustment).toBe(-5);
  });
});

describe('late update confirmation behaviour', () => {
  it('preserves 25-point declaration when update is cancelled (no upsert)', () => {
    const repo = new LocalStorageDeclarationRepository();
    const storage = new Map<string, string>();
    globalThis.localStorage = {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => storage.set(key, value),
      removeItem: (key: string) => storage.delete(key),
      clear: () => storage.clear(),
      key: () => null,
      length: 0,
    };

    const menu = resolveMenuForDate(LUNCH_DATE);
    const menuItems = menu.status === 'available' ? menu.items : [];
    const first = createDeclarationFromDraft(
      { quantities: { ...buildInitialQuantities(menuItems), 'rice-with-sauce': 1 }, noLunch: false },
      menuItems,
      LUNCH_DATE,
      1,
      CANTEEN_CONFIG.menuVersion,
      null,
      () => helsinki(SUBMISSION_DAY, '12:00:00'),
    )!;
    repo.upsertDeclaration(first);

    const stillSaved = repo.getDeclaration(CANTEEN_CONFIG.studentId, LUNCH_DATE)!;
    expect(stillSaved.totalPoints).toBe(getOnTimeTotalPoints());
    expect(stillSaved.selections[0].quantity).toBe(1);
  });

  it('changes total from 25 to 15 when late update is saved', () => {
    const repo = new LocalStorageDeclarationRepository();
    const storage = new Map<string, string>();
    globalThis.localStorage = {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => storage.set(key, value),
      removeItem: (key: string) => storage.delete(key),
      clear: () => storage.clear(),
      key: () => null,
      length: 0,
    };

    const menu = resolveMenuForDate(LUNCH_DATE);
    const menuItems = menu.status === 'available' ? menu.items : [];
    const first = createDeclarationFromDraft(
      { quantities: { ...buildInitialQuantities(menuItems), 'rice-with-sauce': 1 }, noLunch: false },
      menuItems,
      LUNCH_DATE,
      1,
      CANTEEN_CONFIG.menuVersion,
      null,
      () => helsinki(SUBMISSION_DAY, '12:00:00'),
    )!;
    repo.upsertDeclaration(first);

    const lateUpdate = createDeclarationFromDraft(
      { quantities: { ...buildInitialQuantities(menuItems), 'rice-with-sauce': 2 }, noLunch: false },
      menuItems,
      LUNCH_DATE,
      1,
      CANTEEN_CONFIG.menuVersion,
      first,
      () => helsinki(SUBMISSION_DAY, '19:00:00'),
    )!;
    repo.upsertDeclaration(lateUpdate);

    const saved = repo.getDeclaration(CANTEEN_CONFIG.studentId, LUNCH_DATE)!;
    expect(saved.totalPoints).toBe(getLateTotalPoints());
    expect(saved.timingAdjustment).toBe(-5);
  });
});

describe('reload restores latest declaration', () => {
  it('restores the saved declaration from storage', () => {
    const storage = new Map<string, string>();
    globalThis.localStorage = {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => storage.set(key, value),
      removeItem: (key: string) => storage.delete(key),
      clear: () => storage.clear(),
      key: () => null,
      length: 0,
    };
    const repo = new LocalStorageDeclarationRepository();
    const menu = resolveMenuForDate(LUNCH_DATE);
    const menuItems = menu.status === 'available' ? menu.items : [];
    const declaration = createDeclarationFromDraft(
      { quantities: { ...buildInitialQuantities(menuItems), 'rice-with-sauce': 2 }, noLunch: false },
      menuItems,
      LUNCH_DATE,
      1,
      CANTEEN_CONFIG.menuVersion,
      null,
      () => helsinki(SUBMISSION_DAY, '12:00:00'),
    )!;
    repo.upsertDeclaration(declaration);
    const restored = repo.getDeclaration(CANTEEN_CONFIG.studentId, LUNCH_DATE);
    expect(restored?.selections[0].quantity).toBe(2);
    expect(restored?.totalPoints).toBe(25);
  });
});
