import type { KitchenSkillsTrainerSession } from '@/products/kitchen-skills-challenge/domain/types';
import {
  KITCHEN_SKILLS_MODULE_TITLES,
  KITCHEN_SKILLS_REVIEWED_MODULES,
  type KitchenSkillsReviewedModule,
  type KitchenSkillsReviewEntry,
} from '@/products/kitchen-skills-challenge/domain/types';
import {
  buildKitchenSkillsTrainerSessions,
  buildKitchenSkillsTrainerStaffSummaries,
  moduleHasEvidence,
  modulesAwaitingAssessmentCount,
  modulesReviewedCount,
  sessionAssessmentCounts,
  sessionAssessmentStatus,
} from '@/products/kitchen-skills-challenge/read/trainerSessions';

export type KitchenSkillsManagementDataState =
  | { status: 'standalone' }
  | { status: 'pending' }
  | { status: 'unavailable' }
  | {
      status: 'ready';
      sessions: readonly KitchenSkillsTrainerSession[];
      participants: ReturnType<typeof buildKitchenSkillsTrainerStaffSummaries>;
      moduleActivityCounts: Record<KitchenSkillsReviewedModule, number>;
      uniqueParticipants: number;
      sessionCount: number;
      activityCount: number;
      modulesAwaitingAssessment: number;
      modulesReviewed: number;
      assessments: readonly KitchenSkillsAssessmentRow[];
      moduleAssessmentAverages: readonly KitchenSkillsModuleAssessmentAverage[];
      reportingPeriod: KitchenSkillsReportingPeriod;
    };

export type KitchenSkillsAssessmentRow = {
  actorId: string;
  actorName: string;
  sessionId: string;
  sessionDate: string;
  module: KitchenSkillsReviewedModule;
  moduleTitle: string;
  review: KitchenSkillsReviewEntry;
};

export type KitchenSkillsModuleAssessmentAverage = {
  module: KitchenSkillsReviewedModule;
  moduleTitle: string;
  assessmentCount: number;
  meanTimeEfficiency: number | null;
  meanPreparationQuality: number | null;
};

export type KitchenSkillsReportingPeriod = {
  earliestSessionDate: string | null;
  latestSessionDate: string | null;
  sessionCount: number;
};

export type KitchenSkillsDateRangeFilter = {
  fromDate: string;
  toDate: string;
};

function countModuleActivities(sessions: readonly KitchenSkillsTrainerSession[]) {
  const counts: Record<KitchenSkillsReviewedModule, number> = {
    trimSmart: 0,
    rescueAndReuse: 0,
    portionPrecision: 0,
  };
  for (const session of sessions) {
    counts.trimSmart += session.trimEntries.length;
    counts.rescueAndReuse += session.rescueEntries.length;
    counts.portionPrecision += session.portionEntries.length;
  }
  return counts;
}

function collectAssessments(
  sessions: readonly KitchenSkillsTrainerSession[],
): KitchenSkillsAssessmentRow[] {
  const rows: KitchenSkillsAssessmentRow[] = [];
  for (const session of sessions) {
    for (const module of KITCHEN_SKILLS_REVIEWED_MODULES) {
      const review = session.moduleReviews[module];
      if (!review) continue;
      rows.push({
        actorId: session.actorId,
        actorName: session.actorName,
        sessionId: session.sessionId,
        sessionDate: session.sessionDate,
        module,
        moduleTitle: KITCHEN_SKILLS_MODULE_TITLES[module],
        review,
      });
    }
  }
  return rows.sort((left, right) => right.review.submittedAt.localeCompare(left.review.submittedAt));
}

function meanOf(values: readonly number[]): number | null {
  if (values.length === 0) return null;
  const sum = values.reduce((total, value) => total + value, 0);
  return sum / values.length;
}

/**
 * Arithmetic means per module and dimension from recorded wastePracticeReview assessments only.
 * Unassessed modules are omitted from the mean (not treated as zero).
 */
export function buildModuleAssessmentAverages(
  assessments: readonly KitchenSkillsAssessmentRow[],
): KitchenSkillsModuleAssessmentAverage[] {
  return KITCHEN_SKILLS_REVIEWED_MODULES.map((module) => {
    const moduleRows = assessments.filter((row) => row.module === module);
    const timeScores = moduleRows
      .map((row) => row.review.timeEfficiencyScore)
      .filter((score) => Number.isFinite(score));
    const qualityScores = moduleRows
      .map((row) => row.review.preparationQualityScore)
      .filter((score) => Number.isFinite(score));

    return {
      module,
      moduleTitle: KITCHEN_SKILLS_MODULE_TITLES[module],
      assessmentCount: moduleRows.length,
      meanTimeEfficiency: meanOf(timeScores),
      meanPreparationQuality: meanOf(qualityScores),
    };
  });
}

export function buildKitchenSkillsReportingPeriod(
  sessions: readonly KitchenSkillsTrainerSession[],
): KitchenSkillsReportingPeriod {
  if (sessions.length === 0) {
    return { earliestSessionDate: null, latestSessionDate: null, sessionCount: 0 };
  }
  const dates = sessions.map((session) => session.sessionDate).sort();
  return {
    earliestSessionDate: dates[0] ?? null,
    latestSessionDate: dates[dates.length - 1] ?? null,
    sessionCount: sessions.length,
  };
}

/** Filter sessions by inclusive YYYY-MM-DD range. Empty bounds keep all sessions. */
export function filterSessionsByDateRange(
  sessions: readonly KitchenSkillsTrainerSession[],
  filter: KitchenSkillsDateRangeFilter | null,
): KitchenSkillsTrainerSession[] {
  if (!filter) return [...sessions];
  const from = filter.fromDate.trim();
  const to = filter.toDate.trim();
  return sessions.filter((session) => {
    if (from && session.sessionDate < from) return false;
    if (to && session.sessionDate > to) return false;
    return true;
  });
}

export function summarizeFilteredKitchenSkillsSessions(
  sessions: readonly KitchenSkillsTrainerSession[],
): Exclude<KitchenSkillsManagementDataState, { status: 'standalone' | 'pending' | 'unavailable' }> {
  const participants = buildKitchenSkillsTrainerStaffSummaries(sessions);
  const moduleActivityCounts = countModuleActivities(sessions);
  const activityCount =
    moduleActivityCounts.trimSmart +
    moduleActivityCounts.rescueAndReuse +
    moduleActivityCounts.portionPrecision;
  const modulesAwaitingAssessment = sessions.reduce(
    (sum, session) => sum + modulesAwaitingAssessmentCount(session),
    0,
  );
  const modulesReviewed = sessions.reduce((sum, session) => sum + modulesReviewedCount(session), 0);
  const assessments = collectAssessments(sessions);

  return {
    status: 'ready',
    sessions,
    participants,
    moduleActivityCounts,
    uniqueParticipants: participants.length,
    sessionCount: sessions.length,
    activityCount,
    modulesAwaitingAssessment,
    modulesReviewed,
    assessments,
    moduleAssessmentAverages: buildModuleAssessmentAverages(assessments),
    reportingPeriod: buildKitchenSkillsReportingPeriod(sessions),
  };
}

export function buildKitchenSkillsManagementSummary(
  activities: readonly unknown[] | null | undefined,
): Exclude<KitchenSkillsManagementDataState, { status: 'standalone' | 'pending' | 'unavailable' }> {
  const sessions = buildKitchenSkillsTrainerSessions(activities ?? []);
  return summarizeFilteredKitchenSkillsSessions(sessions);
}

export function recordedModulesLabel(session: KitchenSkillsTrainerSession): string {
  return KITCHEN_SKILLS_REVIEWED_MODULES.filter((module) => moduleHasEvidence(session, module))
    .map((module) => KITCHEN_SKILLS_MODULE_TITLES[module])
    .join(', ');
}

/** Management view of a session: the feed-only data never has unconfirmed local submissions. */
export type KitchenSkillsManagementSessionStatus = 'awaiting' | 'partial' | 'reviewed';

export function managementSessionStatus(
  session: KitchenSkillsTrainerSession,
): KitchenSkillsManagementSessionStatus {
  const status = sessionAssessmentStatus(session);
  if (status === 'reviewed') return 'reviewed';
  const counts = sessionAssessmentCounts(session);
  return counts.confirmed + counts.awaiting > 0 ? 'partial' : 'awaiting';
}

export function assessmentStatusLabel(session: KitchenSkillsTrainerSession): string {
  const status = managementSessionStatus(session);
  if (status === 'reviewed') return 'Reviewed';
  if (status === 'partial') return 'Partially reviewed';
  return 'Awaiting assessment';
}

export function formatMeanScoreOutOfFive(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return 'Not assessed';
  return `${value.toFixed(1)} / 5`;
}

export { KITCHEN_SKILLS_MODULE_TITLES, KITCHEN_SKILLS_REVIEWED_MODULES };
