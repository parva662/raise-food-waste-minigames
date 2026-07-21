import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  LocalStorageDeclarationRepository,
  buildStorageKey,
  normalizeDeclarationRecord,
} from './declarationRepository';
import {
  createDeclarationFromDraft,
  buildInitialQuantities,
} from '../utils/declaration';
import { resolveMenuForDate } from '../services/menuResolver';
import { CANTEEN_CONFIG } from '../config/canteen';
import {
  FIXTURE_LUNCH_DATE,
  SUBMISSION_TIMES,
  helsinki,
  FIXTURE_SUBMISSION_DAY,
} from '../test/fixtures/dates';
import {
  createFixtureDeclaration,
  createLegacyFixtureDeclaration,
} from '../test/fixtures/declarations';
import {
  clearLocalStorageMock,
  installLocalStorageMock,
} from '../test/fixtures/storage';

describe('LocalStorageDeclarationRepository', () => {
  let storage: Map<string, string>;
  let repo: LocalStorageDeclarationRepository;
  const menu = resolveMenuForDate(FIXTURE_LUNCH_DATE);
  const menuItems = menu.status === 'available' ? menu.items : [];

  beforeEach(() => {
    storage = installLocalStorageMock();
    repo = new LocalStorageDeclarationRepository();
  });

  afterEach(() => {
    clearLocalStorageMock(storage);
  });

  function draft(quantities: Record<string, number>, noLunch = false) {
    return {
      quantities: { ...buildInitialQuantities(menuItems), ...quantities },
      noLunch,
    };
  }

  it('returns null when no declaration exists', () => {
    expect(repo.getDeclaration(CANTEEN_CONFIG.studentId, FIXTURE_LUNCH_DATE)).toBeNull();
  });

  it('creates one record on first submission', () => {
    const created = createDeclarationFromDraft(
      draft({ 'rice-with-sauce': 1 }),
      menuItems,
      FIXTURE_LUNCH_DATE,
      1,
      CANTEEN_CONFIG.menuVersion,
      null,
      () => SUBMISSION_TIMES.midday,
    )!;
    repo.upsertDeclaration(created);
    expect(storage.size).toBe(1);
  });

  it('uses a deterministic storage key from student ID and lunch date', () => {
    expect(buildStorageKey(CANTEEN_CONFIG.studentId, FIXTURE_LUNCH_DATE)).toBe(
      `lunch-declaration-${CANTEEN_CONFIG.studentId}-${FIXTURE_LUNCH_DATE}`,
    );
  });

  it('replaces an existing record on update', () => {
    const first = createDeclarationFromDraft(
      draft({ 'rice-with-sauce': 1 }),
      menuItems,
      FIXTURE_LUNCH_DATE,
      1,
      CANTEEN_CONFIG.menuVersion,
      null,
      () => SUBMISSION_TIMES.midday,
    )!;
    repo.upsertDeclaration(first);
    const second = createDeclarationFromDraft(
      draft({ 'roasted-vegetables': 1 }),
      menuItems,
      FIXTURE_LUNCH_DATE,
      1,
      CANTEEN_CONFIG.menuVersion,
      first,
      () => helsinki(FIXTURE_SUBMISSION_DAY, '12:30:00'),
    )!;
    repo.upsertDeclaration(second);
    expect(storage.size).toBe(1);
    expect(repo.getDeclaration(CANTEEN_CONFIG.studentId, FIXTURE_LUNCH_DATE)?.selections[0].itemId).toBe(
      'roasted-vegetables',
    );
  });

  it('keeps only one record after multiple updates', () => {
    let current = createDeclarationFromDraft(
      draft({ 'rice-with-sauce': 1 }),
      menuItems,
      FIXTURE_LUNCH_DATE,
      1,
      CANTEEN_CONFIG.menuVersion,
      null,
      () => SUBMISSION_TIMES.midday,
    )!;
    repo.upsertDeclaration(current);
    current = createDeclarationFromDraft(
      draft({ 'rice-with-sauce': 2 }),
      menuItems,
      FIXTURE_LUNCH_DATE,
      1,
      CANTEEN_CONFIG.menuVersion,
      current,
      () => helsinki(FIXTURE_SUBMISSION_DAY, '12:10:00'),
    )!;
    repo.upsertDeclaration(current);
    current = createDeclarationFromDraft(
      draft({ 'rice-with-sauce': 3 }),
      menuItems,
      FIXTURE_LUNCH_DATE,
      1,
      CANTEEN_CONFIG.menuVersion,
      current,
      () => helsinki(FIXTURE_SUBMISSION_DAY, '12:20:00'),
    )!;
    repo.upsertDeclaration(current);
    expect(storage.size).toBe(1);
  });

  it('does not overwrite another lunch date', () => {
    const firstDate = createDeclarationFromDraft(
      draft({ 'rice-with-sauce': 1 }),
      menuItems,
      FIXTURE_LUNCH_DATE,
      1,
      CANTEEN_CONFIG.menuVersion,
      null,
      () => SUBMISSION_TIMES.midday,
    )!;
    const secondDate = createDeclarationFromDraft(
      draft({ 'rice-with-sauce': 2 }),
      menuItems,
      '2026-01-08',
      1,
      CANTEEN_CONFIG.menuVersion,
      null,
      () => SUBMISSION_TIMES.midday,
    )!;
    repo.upsertDeclaration(firstDate);
    repo.upsertDeclaration(secondDate);
    expect(storage.size).toBe(2);
  });

  it('does not overwrite another student', () => {
    const studentA = createFixtureDeclaration({ studentId: 'student-a' });
    const studentB = createFixtureDeclaration({ studentId: 'student-b' });
    repo.upsertDeclaration(studentA);
    repo.upsertDeclaration(studentB);
    expect(storage.size).toBe(2);
  });

  it('preserves submittedAt on update', () => {
    const first = createDeclarationFromDraft(
      draft({ 'rice-with-sauce': 1 }),
      menuItems,
      FIXTURE_LUNCH_DATE,
      1,
      CANTEEN_CONFIG.menuVersion,
      null,
      () => SUBMISSION_TIMES.midday,
    )!;
    repo.upsertDeclaration(first);
    const updated = createDeclarationFromDraft(
      draft({ 'rice-with-sauce': 2 }),
      menuItems,
      FIXTURE_LUNCH_DATE,
      1,
      CANTEEN_CONFIG.menuVersion,
      first,
      () => helsinki(FIXTURE_SUBMISSION_DAY, '17:00:00'),
    )!;
    repo.upsertDeclaration(updated);
    expect(repo.getDeclaration(CANTEEN_CONFIG.studentId, FIXTURE_LUNCH_DATE)?.submittedAt).toBe(
      first.submittedAt,
    );
  });

  it('updates updatedAt on update', () => {
    const first = createDeclarationFromDraft(
      draft({ 'rice-with-sauce': 1 }),
      menuItems,
      FIXTURE_LUNCH_DATE,
      1,
      CANTEEN_CONFIG.menuVersion,
      null,
      () => SUBMISSION_TIMES.midday,
    )!;
    repo.upsertDeclaration(first);
    const updated = createDeclarationFromDraft(
      draft({ 'rice-with-sauce': 2 }),
      menuItems,
      FIXTURE_LUNCH_DATE,
      1,
      CANTEEN_CONFIG.menuVersion,
      first,
      () => helsinki(FIXTURE_SUBMISSION_DAY, '17:00:00'),
    )!;
    repo.upsertDeclaration(updated);
    expect(repo.getDeclaration(CANTEEN_CONFIG.studentId, FIXTURE_LUNCH_DATE)?.updatedAt).toBe(
      updated.updatedAt,
    );
  });

  it('replaces selections and noLunch completely', () => {
    const first = createDeclarationFromDraft(
      draft({ 'rice-with-sauce': 1 }),
      menuItems,
      FIXTURE_LUNCH_DATE,
      1,
      CANTEEN_CONFIG.menuVersion,
      null,
      () => SUBMISSION_TIMES.midday,
    )!;
    repo.upsertDeclaration(first);
    const noLunch = createDeclarationFromDraft(
      { quantities: buildInitialQuantities(menuItems), noLunch: true },
      menuItems,
      FIXTURE_LUNCH_DATE,
      1,
      CANTEEN_CONFIG.menuVersion,
      first,
      () => helsinki(FIXTURE_SUBMISSION_DAY, '17:00:00'),
    )!;
    repo.upsertDeclaration(noLunch);
    const saved = repo.getDeclaration(CANTEEN_CONFIG.studentId, FIXTURE_LUNCH_DATE)!;
    expect(saved.noLunch).toBe(true);
    expect(saved.selections).toHaveLength(0);
  });

  it('recalculates and replaces points on update', () => {
    const first = createDeclarationFromDraft(
      draft({ 'rice-with-sauce': 1 }),
      menuItems,
      FIXTURE_LUNCH_DATE,
      1,
      CANTEEN_CONFIG.menuVersion,
      null,
      () => SUBMISSION_TIMES.midday,
    )!;
    repo.upsertDeclaration(first);
    const late = createDeclarationFromDraft(
      draft({ 'rice-with-sauce': 2 }),
      menuItems,
      FIXTURE_LUNCH_DATE,
      1,
      CANTEEN_CONFIG.menuVersion,
      first,
      () => SUBMISSION_TIMES.lateEvening,
    )!;
    repo.upsertDeclaration(late);
    expect(repo.getDeclaration(CANTEEN_CONFIG.studentId, FIXTURE_LUNCH_DATE)?.totalPoints).toBe(15);
  });

  it('keeps includeInForecast true for on-time declarations', () => {
    const created = createDeclarationFromDraft(
      draft({ 'rice-with-sauce': 1 }),
      menuItems,
      FIXTURE_LUNCH_DATE,
      1,
      CANTEEN_CONFIG.menuVersion,
      null,
      () => SUBMISSION_TIMES.midday,
    )!;
    repo.upsertDeclaration(created);
    expect(repo.getDeclaration(CANTEEN_CONFIG.studentId, FIXTURE_LUNCH_DATE)?.includeInForecast).toBe(
      true,
    );
  });

  it('keeps includeInForecast true for late declarations', () => {
    const created = createDeclarationFromDraft(
      draft({ 'rice-with-sauce': 1 }),
      menuItems,
      FIXTURE_LUNCH_DATE,
      1,
      CANTEEN_CONFIG.menuVersion,
      null,
      () => SUBMISSION_TIMES.lateEvening,
    )!;
    repo.upsertDeclaration(created);
    expect(repo.getDeclaration(CANTEEN_CONFIG.studentId, FIXTURE_LUNCH_DATE)?.includeInForecast).toBe(
      true,
    );
  });

  it('restores the latest saved declaration on reload', () => {
    const created = createDeclarationFromDraft(
      draft({ 'rice-with-sauce': 2 }),
      menuItems,
      FIXTURE_LUNCH_DATE,
      1,
      CANTEEN_CONFIG.menuVersion,
      null,
      () => SUBMISSION_TIMES.midday,
    )!;
    repo.upsertDeclaration(created);
    const reloaded = new LocalStorageDeclarationRepository().getDeclaration(
      CANTEEN_CONFIG.studentId,
      FIXTURE_LUNCH_DATE,
    );
    expect(reloaded?.selections[0].quantity).toBe(2);
  });

  it('does not persist unsaved draft edits', () => {
    repo.upsertDeclaration(createFixtureDeclaration());
    expect(storage.size).toBe(1);
    expect(storage.get(buildStorageKey(CANTEEN_CONFIG.studentId, FIXTURE_LUNCH_DATE))).not.toContain(
      '"quantity": 99',
    );
  });

  it('normalizes legacy records on read', () => {
    storage.set(
      buildStorageKey(CANTEEN_CONFIG.studentId, FIXTURE_LUNCH_DATE),
      JSON.stringify(createLegacyFixtureDeclaration()),
    );
    const restored = repo.getDeclaration(CANTEEN_CONFIG.studentId, FIXTURE_LUNCH_DATE)!;
    expect(restored.basePoints).toBe(20);
    expect(restored.timingAdjustment).toBe(5);
    expect(restored.totalPoints).toBe(25);
  });

  it('handles corrupted JSON without crashing', () => {
    storage.set(buildStorageKey(CANTEEN_CONFIG.studentId, FIXTURE_LUNCH_DATE), '{not-json');
    expect(repo.getDeclaration(CANTEEN_CONFIG.studentId, FIXTURE_LUNCH_DATE)).toBeNull();
  });

  it('rejects invalid records missing required identifiers', () => {
    expect(normalizeDeclarationRecord({ lunchDate: FIXTURE_LUNCH_DATE })).toBeNull();
  });
});
