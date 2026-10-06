import type { KitchenSkillsHashSection } from '@/app/routes';

export type KitchenSkillsTaskProgress = {
  portionComplete: boolean;
  trimCount: number;
  reuseComplete: boolean;
  reuseEntered: boolean;
  trimInProgress: boolean;
};

export function requiredKitchenSkillsSection(
  progress: KitchenSkillsTaskProgress,
): Exclude<KitchenSkillsHashSection, 'review'> {
  if (!progress.portionComplete) return 'portion';
  if (!progress.reuseEntered) return 'trim';
  return 'reuse';
}

export function canOpenKitchenSkillsReview(progress: KitchenSkillsTaskProgress): boolean {
  return (
    progress.portionComplete &&
    progress.trimCount > 0 &&
    progress.reuseComplete &&
    !progress.trimInProgress
  );
}

export function isKitchenSkillsNavEnabled(
  section: KitchenSkillsHashSection,
  progress: KitchenSkillsTaskProgress,
): boolean {
  if (section === 'review') return canOpenKitchenSkillsReview(progress);
  return requiredKitchenSkillsSection(progress) === section;
}
