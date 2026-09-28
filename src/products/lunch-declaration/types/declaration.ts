import type { TimingStatus } from '@/shared/time/timingStatus';
import type { SelectionEntry } from '@/shared/menu/types';
import type { MealChoice } from '@/shared/menu/mealChoice';

export type { TimingStatus };

export interface ActiveDeclaration {
  studentId: string;
  lunchDate: string;
  menuCycleWeek: number;
  menuVersion: string;
  mealChoice: MealChoice;
  regularMainSelected?: boolean;
  regularVegetarianSelected?: boolean;
  noLunch: boolean;
  selections: SelectionEntry[];
  submittedAt: string;
  updatedAt: string;
  includeInForecast: true;
}

export type SubmissionPhase = 'open' | 'closed';

export interface SubmissionWindowStatus {
  phase: SubmissionPhase;
  countdownTargetIso: string | null;
  message: string;
  detailLines: string[];
}
