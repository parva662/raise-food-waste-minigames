import { CANTEEN_CONFIG } from '../config/canteen';
import type { TimingAdjustment, TimingStatus } from '../types/declaration';

export interface PointsBreakdown {
  basePoints: number;
  timingAdjustment: TimingAdjustment;
  totalPoints: number;
  timingStatus: TimingStatus;
}

export function calculatePointsForTimingStatus(timingStatus: TimingStatus): PointsBreakdown {
  const basePoints = CANTEEN_CONFIG.basePoints;
  const timingAdjustment =
    timingStatus === 'on-time' ? CANTEEN_CONFIG.onTimeBonus : CANTEEN_CONFIG.latePenalty;

  return {
    basePoints,
    timingAdjustment,
    totalPoints: basePoints + timingAdjustment,
    timingStatus,
  };
}

export function formatPointsBreakdown(breakdown: PointsBreakdown): string {
  if (breakdown.timingStatus === 'on-time') {
    return `${breakdown.basePoints} base points + ${breakdown.timingAdjustment} on-time bonus`;
  }

  return `${breakdown.basePoints} base points − ${Math.abs(breakdown.timingAdjustment)} late penalty`;
}

export function formatSavedStatusSummary(breakdown: PointsBreakdown): string {
  const label = breakdown.timingStatus === 'on-time' ? 'Lunch saved' : 'Lunch saved late';
  return `${label} · ${breakdown.totalPoints} points`;
}

export function formatToastPointsMessage(breakdown: PointsBreakdown): string {
  return formatSavedStatusSummary(breakdown);
}

export function getOnTimeTotalPoints(): number {
  return CANTEEN_CONFIG.basePoints + CANTEEN_CONFIG.onTimeBonus;
}

export function getLateTotalPoints(): number {
  return CANTEEN_CONFIG.basePoints + CANTEEN_CONFIG.latePenalty;
}

export function isOnTimeTotalPoints(totalPoints: number): boolean {
  return totalPoints === getOnTimeTotalPoints();
}
