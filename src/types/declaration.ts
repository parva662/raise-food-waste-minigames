import type { SelectionEntry } from './menu';
import type { MealChoice } from './mealChoice';

/** Chef Forecast timing classification — not used by Student Lunch. */
export type TimingStatus = 'on-time' | 'late';

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
