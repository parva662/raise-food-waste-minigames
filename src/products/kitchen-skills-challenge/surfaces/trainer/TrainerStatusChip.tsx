import type { KitchenSkillsModuleAssessmentState } from '@/products/kitchen-skills-challenge/domain/session/reviewIdentity';
import { KITCHEN_SKILLS_ASSESSMENT_STATE_LABELS } from '@/products/kitchen-skills-challenge/read/trainerSessions';

const STATE_CLASS: Record<KitchenSkillsModuleAssessmentState, string> = {
  needs_assessment: 'kitchen-day-tutor-status--needs',
  awaiting_confirmation: 'kitchen-day-tutor-status--awaiting',
  reviewed: 'kitchen-day-tutor-status--reviewed',
};

export function trainerStateClass(state: KitchenSkillsModuleAssessmentState): string {
  return STATE_CLASS[state];
}

export function TrainerStatusChip({
  state,
  testId,
  label,
}: {
  state: KitchenSkillsModuleAssessmentState;
  testId?: string;
  label?: string;
}) {
  return (
    <span
      className={`kitchen-day-tutor-status ${STATE_CLASS[state]}`}
      data-testid={testId}
      data-state={state}
    >
      {label ?? KITCHEN_SKILLS_ASSESSMENT_STATE_LABELS[state]}
    </span>
  );
}

/** Small state marker for tabs and chips; the visible label carries the module or recipe name. */
export function TrainerStateDot({ state }: { state: KitchenSkillsModuleAssessmentState }) {
  return (
    <>
      <span
        className={`kitchen-day-tutor-dot kitchen-day-tutor-dot--${state}`}
        aria-hidden="true"
      />
      <span className="visually-hidden">{KITCHEN_SKILLS_ASSESSMENT_STATE_LABELS[state]}</span>
    </>
  );
}
