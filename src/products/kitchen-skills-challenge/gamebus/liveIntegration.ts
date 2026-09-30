/**
 * Student Kitchen Skills Challenge activity schemas were manually verified on foodtracker.gamebus.eu.
 * Trainer wastePracticeReview posts SILENT_ACTIVITY with actors: [selectedStudentActorId]
 * (on-behalf-of-student), confirmed for this phase.
 */
export const KITCHEN_SKILLS_STUDENT_LIVE_INTEGRATION_READY = true;
export const KITCHEN_SKILLS_TRAINER_LIVE_INTEGRATION_READY = true;

export const KITCHEN_SKILLS_STUDENT_LIVE_BLOCK_REASON = 'student_live_blocked';
export const KITCHEN_SKILLS_TRAINER_LIVE_BLOCK_REASON = 'tutor_live_blocked';

export function canPostKitchenSkillsStudentActivity(): boolean {
  return KITCHEN_SKILLS_STUDENT_LIVE_INTEGRATION_READY;
}

export function canPostKitchenSkillsTrainerReview(): boolean {
  return KITCHEN_SKILLS_TRAINER_LIVE_INTEGRATION_READY;
}
