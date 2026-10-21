import { SessionEvidence } from '@/products/kitchen-skills-challenge/surfaces/shared/SessionEvidence';
import {
  RescueSummaryList,
  TrimSummaryList,
} from '@/products/kitchen-skills-challenge/surfaces/shared/AttemptModuleLists';
import { useReadyKitchenSkillsSession } from '@/products/kitchen-skills-challenge/domain/session/KitchenSkillsSessionContext';
import { formatMetricPercent } from '@/products/kitchen-skills-challenge/domain/portion/copy';
import { buildPortionRecipeMetrics } from '@/products/kitchen-skills-challenge/domain/portion/metrics';
import { getRecipeReference } from '@/products/kitchen-skills-challenge/domain/portion/recipes';
import { formatGrams } from '@/products/kitchen-skills-challenge/format';
import type { KitchenSkillsReviewedModule } from '@/products/kitchen-skills-challenge/domain/types';

export function KitchenSkillsFinishSummary() {
  const {
    trimEntries,
    rescueEntries,
    activePortionEntry,
    unconfirmedSaveCount,
    closeFinishSummary,
    finishChallenge,
  } = useReadyKitchenSkillsSession();
  if (!activePortionEntry) return null;
  const metrics = buildPortionRecipeMetrics(activePortionEntry, getRecipeReference(activePortionEntry.recipeId));
  const evidencedModules: KitchenSkillsReviewedModule[] = [
    'portionPrecision',
    ...(trimEntries.length > 0 ? (['trimSmart'] as const) : []),
    ...(rescueEntries.length > 0 ? (['rescueAndReuse'] as const) : []),
  ];

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
          <p className="kitchen-day-finish-dialog__recipe" data-testid="kitchen-day-finish-recipe">
            {activePortionEntry.recipeName}
          </p>
        </header>
        <div className="kitchen-day-finish-dialog__body" data-testid="kitchen-day-finish-body">
          <section className="kitchen-day-finish-module" data-testid="kitchen-day-finish-portion">
            <h3 className="kitchen-day-finish-module__title">Portion Precision</h3>
            <p className="kitchen-day-finish-module__line" data-testid="kitchen-day-finish-portion-headline">
              {formatMetricPercent(metrics.recipeIngredientAccuracyPercent)} accuracy · final weight{' '}
              {formatGrams(metrics.recordedFinalWeightGrams)}
            </p>
          </section>
          {trimEntries.length > 0 ? (
            <section className="kitchen-day-finish-module" data-testid="kitchen-day-finish-trim">
              <h3 className="kitchen-day-finish-module__title">Trim Smart</h3>
              <TrimSummaryList entries={trimEntries} testIdPrefix="kitchen-day-finish" />
            </section>
          ) : null}
          {rescueEntries.length > 0 ? (
            <section className="kitchen-day-finish-module" data-testid="kitchen-day-finish-rescue">
              <h3 className="kitchen-day-finish-module__title">Rescue &amp; Reuse</h3>
              <RescueSummaryList
                entries={rescueEntries}
                trimEntries={trimEntries}
                testIdPrefix="kitchen-day-finish"
              />
            </section>
          ) : null}
          {unconfirmedSaveCount > 0 ? (
            <p className="kitchen-day-evidence-note" data-testid="kitchen-day-finish-unconfirmed">
              {unconfirmedSaveCount === 1
                ? '1 save was sent to GameBus and is not yet visible in your GameBus history.'
                : `${unconfirmedSaveCount} saves were sent to GameBus and are not yet visible in your GameBus history.`}
            </p>
          ) : null}
          <details className="kitchen-day-finish-details" data-testid="kitchen-day-finish-details">
            <summary>Show details</summary>
            <SessionEvidence
              trimEntries={trimEntries}
              rescueEntries={rescueEntries}
              portionEntries={[activePortionEntry]}
              modules={evidencedModules}
              testIdPrefix="kitchen-day-finish"
              collapsePortionTable
              hidePortionRecipeTitle
              showWasteAnalytics={false}
            />
          </details>
        </div>
        <div className="chef-zero-dialog__actions kitchen-day-finish-dialog__actions">
          <button
            type="button"
            className="chef-zero-dialog__btn kitchen-day-button kitchen-day-button--secondary"
            data-testid="kitchen-day-finish-keep-working"
            onClick={closeFinishSummary}
          >
            Keep working
          </button>
          <button
            type="button"
            className="chef-zero-dialog__btn chef-zero-dialog__btn--confirm kitchen-day-button kitchen-day-button--primary"
            data-testid="kitchen-day-finish-challenge"
            onClick={finishChallenge}
          >
            Finish challenge
          </button>
        </div>
      </div>
    </div>
  );
}
