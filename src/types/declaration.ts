import type { SelectionEntry } from './menu';

export type TimingStatus = 'on-time' | 'late';
export type TimingAdjustment = 5 | -5;

export interface ActiveDeclaration {
  studentId: string;
  lunchDate: string;
  menuCycleWeek: number;
  menuVersion: string;
  noLunch: boolean;
  selections: SelectionEntry[];
  timingStatus: TimingStatus;
  basePoints: number;
  timingAdjustment: TimingAdjustment;
  totalPoints: number;
  submittedAt: string;
  updatedAt: string;
  includeInForecast: true;
}

export type SubmissionPhase = 'on-time' | 'late' | 'closed';

export interface SubmissionWindowStatus {
  phase: SubmissionPhase;
  countdownTargetIso: string | null;
  totalPointsIfSubmittedNow: number | null;
  message: string;
  detailLines: string[];
}
