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

export function buildKitchenSkillsManagementSummary(
  activities: readonly unknown[] | null | undefined,
): Exclude<KitchenSkillsManagementDataState, { status: 'standalone' | 'pending' | 'unavailable' }> {
  const sessions = buildKitchenSkillsTrainerSessions(activities ?? []);
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
    assessments: collectAssessments(sessions),
  };
}

export function recordedModulesLabel(session: KitchenSkillsTrainerSession): string {
  return KITCHEN_SKILLS_REVIEWED_MODULES.filter((module) => moduleHasEvidence(session, module))
    .map((module) => KITCHEN_SKILLS_MODULE_TITLES[module])
    .join(', ');
}

export function assessmentStatusLabel(session: KitchenSkillsTrainerSession): string {
  const status = sessionAssessmentStatus(session);
  if (status === 'reviewed') return 'Reviewed';
  if (status === 'partially_reviewed') return 'Partially reviewed';
  return 'Awaiting assessment';
}

export { KITCHEN_SKILLS_MODULE_TITLES, KITCHEN_SKILLS_REVIEWED_MODULES };
