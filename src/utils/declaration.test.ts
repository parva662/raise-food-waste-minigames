import { describe, it, expect } from 'vitest';
import {
  buildInitialQuantities,
  buildSelections,
  createDeclarationFromDraft,
  reconcileDraftWithMenu,
  snapshotFromDeclaration,
} from './declaration';
import { resolveMenuForDate } from '../services/menuResolver';
import { CANTEEN_CONFIG } from '../config/canteen';
import { FIXTURE_LUNCH_DATE, SUBMISSION_TIMES } from '../test/fixtures/dates';

describe('declaration helpers', () => {
  const menu = resolveMenuForDate(FIXTURE_LUNCH_DATE);
  const menuItems = menu.status === 'available' ? menu.items : [];

  it('builds selections from positive quantities only', () => {
    const quantities = buildInitialQuantities(menuItems);
    quantities['rice-with-sauce'] = 2;
    const selections = buildSelections(quantities, menuItems);
    expect(selections).toHaveLength(1);
    expect(selections[0]).toMatchObject({ itemId: 'rice-with-sauce', quantity: 2 });
  });

  it('creates a declaration with recalculated scoring fields', () => {
    const quantities = buildInitialQuantities(menuItems);
    quantities['rice-with-sauce'] = 1;
    const declaration = createDeclarationFromDraft(
      { quantities, noLunch: false },
      menuItems,
      FIXTURE_LUNCH_DATE,
      1,
      CANTEEN_CONFIG.menuVersion,
      null,
      () => SUBMISSION_TIMES.midday,
    );
    expect(declaration).toMatchObject({
      basePoints: 20,
      timingAdjustment: 5,
      totalPoints: 25,
      timingStatus: 'on-time',
      includeInForecast: true,
    });
  });

  it('creates a snapshot from a saved declaration', () => {
    const quantities = buildInitialQuantities(menuItems);
    quantities['rice-with-sauce'] = 1;
    const declaration = createDeclarationFromDraft(
      { quantities, noLunch: false },
      menuItems,
      FIXTURE_LUNCH_DATE,
      1,
      CANTEEN_CONFIG.menuVersion,
      null,
      () => SUBMISSION_TIMES.midday,
    )!;
    const snapshot = snapshotFromDeclaration(declaration, menuItems);
    expect(snapshot.quantities['rice-with-sauce']).toBe(1);
    expect(snapshot.totalPoints).toBe(25);
  });

  it('flags menuChanged when the menu version differs', () => {
    const quantities = buildInitialQuantities(menuItems);
    quantities['rice-with-sauce'] = 1;
    const savedSnapshot = snapshotFromDeclaration(
      createDeclarationFromDraft(
        { quantities, noLunch: false },
        menuItems,
        FIXTURE_LUNCH_DATE,
        1,
        'old-version',
        null,
        () => SUBMISSION_TIMES.midday,
      )!,
      menuItems,
    );
    const result = reconcileDraftWithMenu(
      savedSnapshot,
      savedSnapshot,
      menuItems,
      CANTEEN_CONFIG.menuVersion,
    );
    expect(result.menuChanged).toBe(true);
  });
});
