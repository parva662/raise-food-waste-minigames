import { CANTEEN_CONFIG } from '../config/canteen';
import type { ActiveDeclaration, TimingStatus } from '../types/declaration';
import { calculatePointsForTimingStatus } from '../utils/points';

export interface DeclarationRepository {
  getDeclaration(studentId: string, lunchDate: string): ActiveDeclaration | null;
  upsertDeclaration(declaration: ActiveDeclaration): ActiveDeclaration;
}

const STORAGE_PREFIX = 'lunch-declaration-';

export function buildStorageKey(studentId: string, lunchDate: string): string {
  return `${STORAGE_PREFIX}${studentId}-${lunchDate}`;
}

function inferTimingStatusFromLegacyPoints(legacyPoints: unknown): TimingStatus {
  if (legacyPoints === CANTEEN_CONFIG.onTimeBonus || legacyPoints === 5) {
    return 'on-time';
  }
  if (legacyPoints === CANTEEN_CONFIG.latePenalty || legacyPoints === -5) {
    return 'late';
  }
  return 'on-time';
}

export function normalizeDeclarationRecord(parsed: Record<string, unknown>): ActiveDeclaration | null {
  const studentId = parsed.studentId;
  const lunchDate = parsed.lunchDate;
  if (typeof studentId !== 'string' || typeof lunchDate !== 'string') {
    return null;
  }

  const hasNewScoring =
    typeof parsed.basePoints === 'number' &&
    typeof parsed.timingAdjustment === 'number' &&
    typeof parsed.totalPoints === 'number';

  if (hasNewScoring) {
    return parsed as unknown as ActiveDeclaration;
  }

  const timingStatus =
    parsed.timingStatus === 'on-time' || parsed.timingStatus === 'late'
      ? parsed.timingStatus
      : inferTimingStatusFromLegacyPoints(parsed.points);

  const breakdown = calculatePointsForTimingStatus(timingStatus);
  const { points: _legacyPoints, ...rest } = parsed;

  return {
    ...(rest as Omit<ActiveDeclaration, 'timingStatus' | 'basePoints' | 'timingAdjustment' | 'totalPoints'>),
    timingStatus,
    basePoints: breakdown.basePoints,
    timingAdjustment: breakdown.timingAdjustment,
    totalPoints: breakdown.totalPoints,
  };
}

/**
 * Local prototype persistence. This repository can later be replaced
 * by a GameBus-backed implementation without changing UI or business rules.
 */
export class LocalStorageDeclarationRepository implements DeclarationRepository {
  getDeclaration(studentId: string, lunchDate: string): ActiveDeclaration | null {
    try {
      const raw = localStorage.getItem(buildStorageKey(studentId, lunchDate));
      if (!raw) return null;
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      const normalized = normalizeDeclarationRecord(parsed);
      if (!normalized || normalized.studentId !== studentId || normalized.lunchDate !== lunchDate) {
        return null;
      }
      return normalized;
    } catch {
      return null;
    }
  }

  upsertDeclaration(declaration: ActiveDeclaration): ActiveDeclaration {
    localStorage.setItem(
      buildStorageKey(declaration.studentId, declaration.lunchDate),
      JSON.stringify(declaration),
    );
    return declaration;
  }
}

export const declarationRepository = new LocalStorageDeclarationRepository();
