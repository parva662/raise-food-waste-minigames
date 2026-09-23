/**
 * Student Kitchen Day activity schemas were manually verified on foodtracker.gamebus.eu.
 * Tutor wastePracticeReview posting stays off until the trainer-on-behalf-of-student
 * mechanism is confirmed.
 */
export const KITCHEN_DAY_STUDENT_LIVE_INTEGRATION_READY = true;
export const KITCHEN_DAY_TUTOR_LIVE_INTEGRATION_READY = false;

export const KITCHEN_DAY_STUDENT_LIVE_BLOCK_REASON = 'student_live_blocked';
export const KITCHEN_DAY_TUTOR_LIVE_BLOCK_REASON = 'tutor_live_blocked';

export function canPostKitchenDayStudentActivity(): boolean {
  return KITCHEN_DAY_STUDENT_LIVE_INTEGRATION_READY;
}

export function canPostKitchenDayTutorReview(): boolean {
  return KITCHEN_DAY_TUTOR_LIVE_INTEGRATION_READY;
}
