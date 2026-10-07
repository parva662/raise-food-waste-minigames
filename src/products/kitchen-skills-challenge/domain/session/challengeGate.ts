import type { KitchenSkillsHashSection } from '@/app/routes';

export type KitchenSkillsTaskProgress = {
  portionComplete: boolean;
  trimCount: number;
  reuseComplete: boolean;
  trimInProgress: boolean;
  reuseInProgress: boolean;
  hasEligibleTrimIngredients: boolean;
  hasRemainingEligibleTrimIngredients: boolean;
  hasReusableTrimWaste: boolean;
};

export function hasKitchenSkillsDraftWork(progress: KitchenSkillsTaskProgress): boolean {
  return progress.trimInProgress || progress.reuseInProgress;
}

export function canFinishKitchenSkillsChallenge(progress: KitchenSkillsTaskProgress): boolean {
  if (!progress.portionComplete || hasKitchenSkillsDraftWork(progress)) return false;
  if (!progress.hasEligibleTrimIngredients) return true;
  if (progress.trimCount === 0) return false;
  if (progress.hasReusableTrimWaste) return progress.reuseComplete;
  return true;
}

export function requiredKitchenSkillsSection(
  progress: KitchenSkillsTaskProgress,
): Exclude<KitchenSkillsHashSection, 'review'> {
  if (!progress.portionComplete) return 'portion';
  if (!progress.hasEligibleTrimIngredients) return 'trim';
  if (progress.trimCount === 0 || progress.trimInProgress) return 'trim';
  if (progress.hasReusableTrimWaste && (!progress.reuseComplete || progress.reuseInProgress)) {
    return 'reuse';
  }
  return 'trim';
}

export function canOpenKitchenSkillsReview(progress: KitchenSkillsTaskProgress): boolean {
  return canFinishKitchenSkillsChallenge(progress);
}

export function isKitchenSkillsNavEnabled(
  section: KitchenSkillsHashSection,
  progress: KitchenSkillsTaskProgress,
): boolean {
  if (section === 'review') return canOpenKitchenSkillsReview(progress);
  if (section === 'portion') return true;
  if (section === 'trim') return progress.portionComplete;
  return (
    progress.portionComplete &&
    progress.trimCount > 0 &&
    !progress.trimInProgress &&
    progress.hasReusableTrimWaste
  );
}
