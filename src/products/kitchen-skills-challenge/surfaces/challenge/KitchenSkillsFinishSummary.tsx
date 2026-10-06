import { goToKitchenDaySection } from '@/app/routes';
import { SessionEvidence } from '@/products/kitchen-skills-challenge/surfaces/shared/SessionEvidence';
import { postKitchenSkillsChallengeExit } from '@/products/kitchen-skills-challenge/gamebus/postExit';
import { useReadyKitchenSkillsSession } from '@/products/kitchen-skills-challenge/domain/session/KitchenSkillsSessionContext';
import { formatMetricPercent } from '@/products/kitchen-skills-challenge/domain/portion/copy';
import { buildPortionRecipeMetrics } from '@/products/kitchen-skills-challenge/domain/portion/metrics';
import { getRecipeReference } from '@/products/kitchen-skills-challenge/domain/portion/recipes';
import { wastePercentage } from '@/products/kitchen-skills-challenge/domain/trim/derived';
import { formatGrams, formatWastePercent } from '@/products/kitchen-skills-challenge/format';
import type {
  KitchenSkillsPortionEntry,
  KitchenSkillsRescueEntry,
  KitchenSkillsTrimEntry,
} from '@/products/kitchen-skills-challenge/domain/types';

function trimHeadline(entries: readonly KitchenSkillsTrimEntry[]): string {
  if (entries.length === 0) return 'No trim recorded';
  return entries
    .map((entry) => {
      const percent = wastePercentage(entry.actualWasteGrams, entry.ingredientWeightGrams);
      return `${entry.ingredientName} · ${formatWastePercent(percent)} waste`;
    })
    .join('; ');
}

function reuseHeadline(
  entries: readonly KitchenSkillsRescueEntry[],
  trimEntries: readonly KitchenSkillsTrimEntry[],
): string {
  if (entries.length === 0) return 'No reuse recorded';
  return entries
    .map((entry) => {
      const trim = trimEntries.find((item) => item.ingredientId === entry.ingredientId);
      const name = trim?.ingredientName ?? entry.ingredientId;
      return `${name} · ${formatGrams(entry.reusableWasteGrams)} to ${entry.reuseDestination}`;
    })
    .join('; ');
}

function portionHeadline(entries: readonly KitchenSkillsPortionEntry[]): string {
  if (entries.length === 0) return 'No recipe recorded';
  return entries
    .map((entry) => {
      const metrics = buildPortionRecipeMetrics(entry, getRecipeReference(entry.recipeId));
      return `${entry.recipeName} · ${formatMetricPercent(metrics.recipeIngredientAccuracyPercent)} accuracy`;
    })
    .join('; ');
}

function continueWithMoreIngredients(dismissFinishSummary: () => void) {
  dismissFinishSummary();
  goToKitchenDaySection('trim');
}

export function KitchenSkillsFinishActions({
  finishTestId,
  addMoreTestId,
}: {
  finishTestId: string;
  addMoreTestId: string;
}) {
  const { dismissFinishSummary } = useReadyKitchenSkillsSession();
  return (
    <div className="chef-zero-dialog__actions kitchen-day-finish-dialog__actions">
      <button
        type="button"
        className="chef-zero-dialog__btn kitchen-day-button kitchen-day-button--secondary"
        data-testid={addMoreTestId}
        onClick={() => continueWithMoreIngredients(dismissFinishSummary)}
      >
        Add more ingredients
      </button>
      <button
        type="button"
        className="chef-zero-dialog__btn chef-zero-dialog__btn--confirm kitchen-day-button kitchen-day-button--primary"
        data-testid={finishTestId}
        onClick={() => postKitchenSkillsChallengeExit()}
      >
        Finish challenge
      </button>
    </div>
  );
}

export function KitchenSkillsFinishSummary() {
  const { trimEntries, rescueEntries, portionEntries } = useReadyKitchenSkillsSession();

  return (
    <div className="chef-zero-dialog-backdrop kitchen-day-finish-backdrop" role="presentation">
      <div
        className="chef-zero-dialog kitchen-day-finish-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="kitchen-day-finish-title"
        data-testid="kitchen-day-finish-summary"
      >
        <header className="kitchen-day-finish-dialog__header">
          <h2 id="kitchen-day-finish-title" className="chef-zero-dialog__title">
            Challenge complete
          </h2>
          <ul className="kitchen-day-finish-overview">
            <li data-testid="kitchen-day-finish-trim-headline">
              <span>Trim Smart</span>
              <strong>{trimHeadline(trimEntries)}</strong>
            </li>
            <li data-testid="kitchen-day-finish-reuse-headline">
              <span>Rescue &amp; Reuse</span>
              <strong>{reuseHeadline(rescueEntries, trimEntries)}</strong>
            </li>
            <li data-testid="kitchen-day-finish-portion-headline">
              <span>Portion Precision</span>
              <strong>{portionHeadline(portionEntries)}</strong>
            </li>
          </ul>
        </header>
        <div className="kitchen-day-finish-dialog__body" data-testid="kitchen-day-finish-body">
          <SessionEvidence
            trimEntries={trimEntries}
            rescueEntries={rescueEntries}
            portionEntries={portionEntries}
            testIdPrefix="kitchen-day-finish"
            collapsible
            collapsePortionTable
          />
        </div>
        <KitchenSkillsFinishActions
          finishTestId="kitchen-day-finish-challenge"
          addMoreTestId="kitchen-day-finish-add-more-ingredients"
        />
      </div>
    </div>
  );
}
