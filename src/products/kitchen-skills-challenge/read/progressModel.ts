import { compareTrimSessionFromPortion } from '@/products/kitchen-skills-challenge/domain/trim/objectiveComparison';
import { buildPortionRecipeMetrics } from '@/products/kitchen-skills-challenge/domain/portion/metrics';
import { getRecipeReference } from '@/products/kitchen-skills-challenge/domain/portion/recipes';
import type {
  KitchenSkillsReviewedModule,
  KitchenSkillsReviewEntry,
  KitchenSkillsTrainerSession,
} from '@/products/kitchen-skills-challenge/domain/types';
import { moduleHasEvidence } from '@/products/kitchen-skills-challenge/read/trainerSessions';

export interface KitchenSkillsProgressPoint {
  sessionId: string;
  sessionDate: string;
  wastePercent: number | null;
  actualTrimPercent: number | null;
  referenceTrimPercent: number | null;
  deltaPercentagePoints: number | null;
  durationMinutes: number | null;
  ingredientAccuracyPercent: number | null;
  finalWeightDeviationPercent: number | null;
  trimTimeEfficiencyScore: number | null;
  trimPreparationQualityScore: number | null;
  rescueTimeEfficiencyScore: number | null;
  rescuePreparationQualityScore: number | null;
  portionTimeEfficiencyScore: number | null;
  portionPreparationQualityScore: number | null;
}

export type KitchenSkillsProgressMetricKey =
  | 'wastePercent'
  | 'durationMinutes'
  | 'ingredientAccuracyPercent'
  | 'finalWeightDeviationPercent';

export type KitchenSkillsProgressMetricOption = {
  key: KitchenSkillsProgressMetricKey;
  label: string;
  unit: 'percent' | 'minutes';
};

export function buildKitchenSkillsProgressPoints(
  sessions: readonly KitchenSkillsTrainerSession[],
): KitchenSkillsProgressPoint[] {
  return [...sessions]
    .sort((left, right) => left.sessionDate.localeCompare(right.sessionDate))
    .map((session) => {
      const trimComparison = compareTrimSessionFromPortion(session.trimEntries, session.portionEntries);
      const durations = session.trimEntries.map((entry) => entry.durationMinutes);
      const portionMetrics = session.portionEntries.map((entry) =>
        buildPortionRecipeMetrics(entry, getRecipeReference(entry.recipeId)),
      );
      const { trimSmart, rescueAndReuse, portionPrecision } = session.moduleReviews;
      return {
        sessionId: session.sessionId,
        sessionDate: session.sessionDate,
        wastePercent: trimComparison.actualTrimPercent,
        actualTrimPercent: trimComparison.actualTrimPercent,
        referenceTrimPercent:
          trimComparison.status === 'available' ? trimComparison.referenceTrimPercent : null,
        deltaPercentagePoints:
          trimComparison.status === 'available' ? trimComparison.deltaPercentagePoints : null,
        durationMinutes: average(durations),
        ingredientAccuracyPercent: average(
          portionMetrics.flatMap((item) =>
            item.recipeIngredientAccuracyPercent == null ? [] : [item.recipeIngredientAccuracyPercent],
          ),
        ),
        finalWeightDeviationPercent: average(
          portionMetrics.flatMap((item) =>
            item.finalWeightDeviationPercent == null ? [] : [item.finalWeightDeviationPercent],
          ),
        ),
        trimTimeEfficiencyScore: trimSmart?.timeEfficiencyScore ?? null,
        trimPreparationQualityScore: trimSmart?.preparationQualityScore ?? null,
        rescueTimeEfficiencyScore: rescueAndReuse?.timeEfficiencyScore ?? null,
        rescuePreparationQualityScore: rescueAndReuse?.preparationQualityScore ?? null,
        portionTimeEfficiencyScore: portionPrecision?.timeEfficiencyScore ?? null,
        portionPreparationQualityScore: portionPrecision?.preparationQualityScore ?? null,
      };
    });
}

export function sortKitchenSkillsSessionsNewestFirst(
  sessions: readonly KitchenSkillsTrainerSession[],
): KitchenSkillsTrainerSession[] {
  return [...sessions].sort((left, right) => {
    const byDate = right.sessionDate.localeCompare(left.sessionDate);
    if (byDate !== 0) return byDate;
    return right.sessionId.localeCompare(left.sessionId);
  });
}

export function progressMetricsForModule(
  module: KitchenSkillsReviewedModule,
): readonly KitchenSkillsProgressMetricOption[] {
  switch (module) {
    case 'trimSmart':
      return [
        { key: 'wastePercent', label: 'Waste rate', unit: 'percent' },
        { key: 'durationMinutes', label: 'Preparation duration', unit: 'minutes' },
      ];
    case 'rescueAndReuse':
      return [];
    case 'portionPrecision':
      return [
        { key: 'ingredientAccuracyPercent', label: 'Ingredient accuracy', unit: 'percent' },
        { key: 'finalWeightDeviationPercent', label: 'Final-weight deviation', unit: 'percent' },
      ];
  }
}

export function metricSeriesForModule(
  points: readonly KitchenSkillsProgressPoint[],
  key: KitchenSkillsProgressMetricKey,
): Array<{ sessionId: string; sessionDate: string; value: number }> {
  return points.flatMap((point) => {
    const value = point[key];
    if (value == null) return [];
    return [{ sessionId: point.sessionId, sessionDate: point.sessionDate, value }];
  });
}

export function sessionsForModule(
  sessions: readonly KitchenSkillsTrainerSession[],
  module: KitchenSkillsReviewedModule,
): KitchenSkillsTrainerSession[] {
  return sortKitchenSkillsSessionsNewestFirst(
    sessions.filter(
      (session) => moduleHasEvidence(session, module) || session.moduleReviews[module] !== null,
    ),
  );
}

export function moduleReviewHistory(
  sessions: readonly KitchenSkillsTrainerSession[],
  module: KitchenSkillsReviewedModule,
): Array<{ session: KitchenSkillsTrainerSession; review: KitchenSkillsReviewEntry }> {
  return sortKitchenSkillsSessionsNewestFirst(sessions).flatMap((session) => {
    const review = session.moduleReviews[module];
    if (!review) return [];
    return [{ session, review }];
  });
}

export function latestModuleReviewAcrossSessions(
  sessions: readonly KitchenSkillsTrainerSession[],
  module: KitchenSkillsReviewedModule,
): { session: KitchenSkillsTrainerSession; review: KitchenSkillsReviewEntry } | null {
  return moduleReviewHistory(sessions, module)[0] ?? null;
}

/** Primary Progress chart/list window: last N module sessions (not calendar days). */
export const PROGRESS_RECENT_SESSION_LIMIT = 8;

/** History archive page size for compact session rows. */
export const PROGRESS_HISTORY_PAGE_SIZE = 10;

export type KitchenSkillsProgressReviewFilter = 'all' | 'reviewed' | 'awaiting';

export type KitchenSkillsProgressHistoryFilters = {
  fromDate?: string | null;
  toDate?: string | null;
  reviewStatus?: KitchenSkillsProgressReviewFilter;
};

/**
 * Newest-first slice used for Recent charts and short session lists.
 * Always returns at most `limit` sessions; fewer when history is shorter.
 */
export function takeRecentSessions(
  sessions: readonly KitchenSkillsTrainerSession[],
  limit: number = PROGRESS_RECENT_SESSION_LIMIT,
): KitchenSkillsTrainerSession[] {
  return sortKitchenSkillsSessionsNewestFirst(sessions).slice(0, Math.max(0, limit));
}

/** Calendar span of a newest-first session window for Recent labels. */
export function sessionDateSpanLabel(sessions: readonly KitchenSkillsTrainerSession[]): string | null {
  if (sessions.length === 0) return null;
  const newest = sessions[0]!.sessionDate;
  const oldest = sessions[sessions.length - 1]!.sessionDate;
  if (newest === oldest) return formatProgressDate(newest);
  return `${formatProgressDate(oldest)} – ${formatProgressDate(newest)}`;
}

export function recentSessionsLabel(sessions: readonly KitchenSkillsTrainerSession[]): string {
  if (sessions.length === 0) return 'No recent sessions';
  const span = sessionDateSpanLabel(sessions);
  const countLabel =
    sessions.length === 1 ? 'Last 1 session' : `Last ${sessions.length} sessions`;
  return span ? `${countLabel} · ${span}` : countLabel;
}

export function filterModuleHistorySessions(
  sessions: readonly KitchenSkillsTrainerSession[],
  module: KitchenSkillsReviewedModule,
  filters: KitchenSkillsProgressHistoryFilters = {},
): KitchenSkillsTrainerSession[] {
  const fromDate = filters.fromDate?.trim() || null;
  const toDate = filters.toDate?.trim() || null;
  const reviewStatus = filters.reviewStatus ?? 'all';

  return sortKitchenSkillsSessionsNewestFirst(sessions).filter((session) => {
    if (fromDate && session.sessionDate < fromDate) return false;
    if (toDate && session.sessionDate > toDate) return false;
    if (reviewStatus === 'all') return true;
    const reviewed = session.moduleReviews[module] !== null;
    return reviewStatus === 'reviewed' ? reviewed : !reviewed;
  });
}

export function paginateSessions<T>(
  items: readonly T[],
  page: number,
  pageSize: number = PROGRESS_HISTORY_PAGE_SIZE,
): { pageItems: T[]; page: number; totalPages: number; totalItems: number } {
  const safePageSize = Math.max(1, pageSize);
  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / safePageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * safePageSize;
  return {
    pageItems: items.slice(start, start + safePageSize) as T[],
    page: safePage,
    totalPages,
    totalItems,
  };
}

function formatProgressDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-').map(Number);
  if (!year || !month || !day) return isoDate;
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(year, month - 1, day, 12, 0, 0)));
}

function average(values: readonly number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}
