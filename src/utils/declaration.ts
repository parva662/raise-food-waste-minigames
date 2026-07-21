import type { SelectionEntry } from '../types/menu';
import type { MenuItem } from '../types/menu';
import { CANTEEN_CONFIG } from '../config/canteen';
import {
  getPointsBreakdownForInstant,
  type Clock,
  systemClock,
} from '../services/submissionWindow';
import type { ActiveDeclaration } from '../types/declaration';
import { declarationRepository } from '../repositories/declarationRepository';
import { isDraftDirty } from './declarationSelection';

export { declarationRepository, isDraftDirty };

export interface DraftSnapshot {
  quantities: Record<string, number>;
  noLunch: boolean;
}

export interface SavedSnapshot extends DraftSnapshot {
  submittedAt: string;
  updatedAt: string;
  timingStatus: ActiveDeclaration['timingStatus'];
  basePoints: number;
  timingAdjustment: ActiveDeclaration['timingAdjustment'];
  totalPoints: number;
  menuVersion: string;
  menuCycleWeek: number;
}

export function buildInitialQuantities(menuItems: MenuItem[]): Record<string, number> {
  return Object.fromEntries(menuItems.map((item) => [item.id, 0]));
}

export function buildSelections(
  quantities: Record<string, number>,
  menuItems: MenuItem[],
): SelectionEntry[] {
  return menuItems
    .filter((item) => (quantities[item.id] ?? 0) > 0)
    .map((item) => ({
      itemId: item.id,
      name: item.name,
      quantity: quantities[item.id],
      unit: item.unit,
    }));
}

export function snapshotFromDeclaration(
  declaration: ActiveDeclaration,
  menuItems: MenuItem[],
): SavedSnapshot {
  const quantities = buildInitialQuantities(menuItems);
  for (const selection of declaration.selections) {
    if (quantities[selection.itemId] !== undefined) {
      quantities[selection.itemId] = selection.quantity;
    }
  }
  return {
    quantities,
    noLunch: declaration.noLunch,
    submittedAt: declaration.submittedAt,
    updatedAt: declaration.updatedAt,
    timingStatus: declaration.timingStatus,
    basePoints: declaration.basePoints,
    timingAdjustment: declaration.timingAdjustment,
    totalPoints: declaration.totalPoints,
    menuVersion: declaration.menuVersion,
    menuCycleWeek: declaration.menuCycleWeek,
  };
}

export function createDeclarationFromDraft(
  draft: DraftSnapshot,
  menuItems: MenuItem[],
  lunchDate: string,
  menuCycleWeek: number,
  menuVersion: string,
  existing: ActiveDeclaration | null,
  clock: Clock = systemClock,
): ActiveDeclaration | null {
  const now = clock();
  const pointsBreakdown = getPointsBreakdownForInstant(now, lunchDate);
  if (pointsBreakdown === null) return null;

  const selections = buildSelections(draft.quantities, menuItems);

  return {
    studentId: CANTEEN_CONFIG.studentId,
    lunchDate,
    menuCycleWeek,
    menuVersion,
    noLunch: draft.noLunch,
    selections,
    timingStatus: pointsBreakdown.timingStatus,
    basePoints: pointsBreakdown.basePoints,
    timingAdjustment: pointsBreakdown.timingAdjustment,
    totalPoints: pointsBreakdown.totalPoints,
    submittedAt: existing?.submittedAt ?? now.toISOString(),
    updatedAt: now.toISOString(),
    includeInForecast: true,
  };
}

export function reconcileDraftWithMenu(
  draft: DraftSnapshot,
  saved: SavedSnapshot | null,
  menuItems: MenuItem[],
  currentMenuVersion: string,
): {
  draft: DraftSnapshot;
  menuChanged: boolean;
} {
  const availableIds = new Set(menuItems.map((item) => item.id));
  const nextQuantities = { ...draft.quantities };
  let removedAny = false;

  for (const item of menuItems) {
    if (nextQuantities[item.id] === undefined) {
      nextQuantities[item.id] = 0;
    }
  }

  for (const itemId of Object.keys(nextQuantities)) {
    if (!availableIds.has(itemId) && nextQuantities[itemId] > 0) {
      nextQuantities[itemId] = 0;
      removedAny = true;
    }
  }

  const menuChanged =
    removedAny ||
    (saved !== null && saved.menuVersion !== currentMenuVersion);

  return {
    draft: { quantities: nextQuantities, noLunch: draft.noLunch },
    menuChanged,
  };
}

export type SubmitButtonState = 'submit' | 'update';

export function getSubmitButtonState(hasSavedDeclaration: boolean): SubmitButtonState {
  return hasSavedDeclaration ? 'update' : 'submit';
}
