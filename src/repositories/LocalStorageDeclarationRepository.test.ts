import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  LocalStorageDeclarationRepository,
  buildStorageKey,
  normalizeDeclarationRecord,
} from './declarationRepository';
import { createDeclarationFromDraft } from '../utils/declaration';
import { resolveMealSlotsForDate } from '../services/mealSlots';
import { CANTEEN_CONFIG } from '../config/canteen';
import { FIXTURE_LUNCH_DATE, SUBMISSION_TIMES } from '../test/fixtures/dates';
import {
  createFixtureDeclaration,
  createLegacyFixtureDeclaration,
} from '../test/fixtures/declarations';
import {
  clearLocalStorageMock,
  installLocalStorageMock,
} from '../test/fixtures/storage';
import type { MealDraft } from '../types/mealChoice';

describe('LocalStorageDeclarationRepository', () => {
  let storage: Map<string, string>;
  let repo: LocalStorageDeclarationRepository;
  const slots = resolveMealSlotsForDate(FIXTURE_LUNCH_DATE)!;

  beforeEach(() => {
    storage = installLocalStorageMock();
    repo = new LocalStorageDeclarationRepository();
  });

  afterEach(() => {
    clearLocalStorageMock(storage);
  });

  function createFromDraft(draft: MealDraft, instant = SUBMISSION_TIMES.midday) {
    return createDeclarationFromDraft(
      draft,
      slots,
      FIXTURE_LUNCH_DATE,
      1,
      CANTEEN_CONFIG.menuVersion,
      () => instant,
    )!;
  }

  it('returns null when no declaration exists', () => {
    expect(repo.getDeclaration(CANTEEN_CONFIG.studentId, FIXTURE_LUNCH_DATE)).toBeNull();
  });

  it('creates one record on first submission', () => {
    const created = createFromDraft({
      mealChoice: 'regular',
      mainQuantity: 2,
      vegetarianQuantity: 0,
      soupQuantity: 0,
      dessertQuantity: 0,
    });
    repo.upsertDeclaration(created);
    expect(storage.size).toBe(1);
    expect(created.mealChoice).toBe('regular');
  });

  it('uses a deterministic storage key from student ID and lunch date', () => {
    expect(buildStorageKey(CANTEEN_CONFIG.studentId, FIXTURE_LUNCH_DATE)).toBe(
      `lunch-declaration-${CANTEEN_CONFIG.studentId}-${FIXTURE_LUNCH_DATE}`,
    );
  });

  it('replaces an existing record when upserted again', () => {
    repo.upsertDeclaration(
      createFromDraft({ mealChoice: 'regular', mainQuantity: 1, vegetarianQuantity: 0, soupQuantity: 0, dessertQuantity: 0 }),
    );
    repo.upsertDeclaration(
      createFromDraft({ mealChoice: 'soup', mainQuantity: 0, vegetarianQuantity: 0, soupQuantity: 1, dessertQuantity: 1 }),
    );
    expect(storage.size).toBe(1);
    expect(repo.getDeclaration(CANTEEN_CONFIG.studentId, FIXTURE_LUNCH_DATE)?.mealChoice).toBe('soup');
  });

  it('does not overwrite another lunch date', () => {
    const firstDate = createFromDraft({
      mealChoice: 'regular',
      mainQuantity: 1,
      vegetarianQuantity: 0,
      soupQuantity: 0,
      dessertQuantity: 0,
    });
    const secondDate = createDeclarationFromDraft(
      { mealChoice: 'no_lunch', mainQuantity: 0, vegetarianQuantity: 0, soupQuantity: 0, dessertQuantity: 0 },
      slots,
      '2026-07-30',
      1,
      CANTEEN_CONFIG.menuVersion,
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

  it('stores soup lunch with bundled dessert selections', () => {
    const created = createFromDraft({
      mealChoice: 'soup',
      mainQuantity: 0,
      vegetarianQuantity: 0,
      soupQuantity: 1,
      dessertQuantity: 1,
    });
    repo.upsertDeclaration(created);
    const saved = repo.getDeclaration(CANTEEN_CONFIG.studentId, FIXTURE_LUNCH_DATE)!;
    expect(saved.selections).toHaveLength(2);
  });

  it('keeps includeInForecast true for on-time declarations', () => {
    repo.upsertDeclaration(
      createFromDraft({ mealChoice: 'regular', mainQuantity: 1, vegetarianQuantity: 0, soupQuantity: 0, dessertQuantity: 0 }),
    );
    expect(repo.getDeclaration(CANTEEN_CONFIG.studentId, FIXTURE_LUNCH_DATE)?.includeInForecast).toBe(
      true,
    );
  });

  it('keeps includeInForecast true for late declarations', () => {
    repo.upsertDeclaration(
      createFromDraft(
        { mealChoice: 'regular', mainQuantity: 1, vegetarianQuantity: 0, soupQuantity: 0, dessertQuantity: 0 },
        SUBMISSION_TIMES.lateEvening,
      ),
    );
    expect(repo.getDeclaration(CANTEEN_CONFIG.studentId, FIXTURE_LUNCH_DATE)?.totalPoints).toBe(15);
  });

  it('restores the latest saved declaration on reload', () => {
    repo.upsertDeclaration(
      createFromDraft({ mealChoice: 'regular', mainQuantity: 1, vegetarianQuantity: 1, soupQuantity: 0, dessertQuantity: 0 }),
    );
    const reloaded = new LocalStorageDeclarationRepository().getDeclaration(
      CANTEEN_CONFIG.studentId,
      FIXTURE_LUNCH_DATE,
    );
    expect(reloaded?.selections).toHaveLength(2);
  });

  it('does not persist unsaved draft edits', () => {
    repo.upsertDeclaration(createFixtureDeclaration());
    expect(storage.size).toBe(1);
  });

  it('normalizes legacy records on read', () => {
    storage.set(
      buildStorageKey(CANTEEN_CONFIG.studentId, FIXTURE_LUNCH_DATE),
      JSON.stringify(createLegacyFixtureDeclaration()),
    );
    const restored = repo.getDeclaration(CANTEEN_CONFIG.studentId, FIXTURE_LUNCH_DATE)!;
    expect(restored.basePoints).toBe(20);
    expect(restored.totalPoints).toBe(25);
    expect(restored.mealChoice).toBe('regular');
  });

  it('handles corrupted JSON without crashing', () => {
    storage.set(buildStorageKey(CANTEEN_CONFIG.studentId, FIXTURE_LUNCH_DATE), '{not-json');
    expect(repo.getDeclaration(CANTEEN_CONFIG.studentId, FIXTURE_LUNCH_DATE)).toBeNull();
  });

  it('rejects invalid records missing required identifiers', () => {
    expect(normalizeDeclarationRecord({ lunchDate: FIXTURE_LUNCH_DATE })).toBeNull();
  });
});
