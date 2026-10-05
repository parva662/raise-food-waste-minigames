import { useState } from 'react';
import { formatSessionDate, formatWastePercent } from '@/products/kitchen-skills-challenge/format';
import { buildKitchenSkillsProgressPoints } from '@/products/kitchen-skills-challenge/read/progressModel';
import { SessionEvidence } from '@/products/kitchen-skills-challenge/surfaces/shared/SessionEvidence';
import { Sparkline } from '@/products/kitchen-skills-challenge/surfaces/progress/Sparkline';
import { useKitchenSkillsStudentProgressData } from '@/products/kitchen-skills-challenge/read/useGroupData';
import { KITCHEN_SKILLS_MODULE_TITLES } from '@/products/kitchen-skills-challenge/domain/types';
import type {
  KitchenSkillsReviewedModule,
  KitchenSkillsTrainerSession,
} from '@/products/kitchen-skills-challenge/domain/types';
import { KITCHEN_SKILLS_REVIEWED_MODULES } from '@/products/kitchen-skills-challenge/domain/types';

function ModuleReviewSummary({
  module,
  session,
}: {
  module: KitchenSkillsReviewedModule;
  session: KitchenSkillsTrainerSession;
}) {
  const review = session.moduleReviews[module];
  if (!review) return null;
  return (
    <div className="chef-results-panel" data-testid={`kitchen-day-progress-tutor-${module}`}>
      <h3 className="chef-results-panel__title">{KITCHEN_SKILLS_MODULE_TITLES[module]} tutor review</h3>
      <p>Time efficiency {review.timeEfficiencyScore}</p>
      <p>Preparation quality {review.preparationQualityScore}</p>
      {review.chefFeedback ? <p>{review.chefFeedback}</p> : null}
    </div>
  );
}

export function KitchenSkillsProgressApp() {
  const { sessions: ownSessions } = useKitchenSkillsStudentProgressData();
  const [tab, setTab] = useState<'overview' | 'progress'>('overview');
  const latest = ownSessions[ownSessions.length - 1] ?? ownSessions[0];
  const points = buildKitchenSkillsProgressPoints(ownSessions);
  const hasAnyModuleReview =
    latest &&
    KITCHEN_SKILLS_REVIEWED_MODULES.some((module) => latest.moduleReviews[module] !== null);

  return (
    <div className="chef-results-page chef-results-page--participant kitchen-mgmt-page" data-testid="kitchen-day-progress-page">
      <header className="kitchen-mgmt-header chef-results-dashboard-header">
        <div className="kitchen-mgmt-header__main">
          <h1 className="kitchen-mgmt-header__title">Kitchen Skills Challenge Progress</h1>
          <p className="kitchen-mgmt-header__lead">
            Your own Kitchen Skills Challenge performance over time.
          </p>
        </div>
      </header>

      <div className="kitchen-mgmt-primary-tabs" role="tablist" aria-label="Kitchen Skills Challenge progress views">
        <button
          type="button"
          role="tab"
          className={
            tab === 'overview'
              ? 'kitchen-mgmt-primary-tabs__tab kitchen-mgmt-primary-tabs__tab--active'
              : 'kitchen-mgmt-primary-tabs__tab'
          }
          data-testid="kitchen-day-progress-tab-overview"
          aria-selected={tab === 'overview'}
          onClick={() => setTab('overview')}
        >
          Overview
        </button>
        <button
          type="button"
          role="tab"
          className={
            tab === 'progress'
              ? 'kitchen-mgmt-primary-tabs__tab kitchen-mgmt-primary-tabs__tab--active'
              : 'kitchen-mgmt-primary-tabs__tab'
          }
          data-testid="kitchen-day-progress-tab-progress"
          aria-selected={tab === 'progress'}
          onClick={() => setTab('progress')}
        >
          Progress
        </button>
      </div>

      {tab === 'overview' ? (
        <section data-testid="kitchen-day-progress-overview">
          {latest ? (
            <>
              <h2 className="kitchen-mgmt-module-title">Latest challenge session</h2>
              <p>{formatSessionDate(latest.sessionDate)}</p>
              {hasAnyModuleReview ? (
                <div data-testid="kitchen-day-progress-tutor">
                  {KITCHEN_SKILLS_REVIEWED_MODULES.map((module) => (
                    <ModuleReviewSummary key={module} module={module} session={latest} />
                  ))}
                </div>
              ) : (
                <p className="chef-results-empty">No tutor assessment yet.</p>
              )}
              <SessionEvidence
                trimEntries={latest.trimEntries}
                rescueEntries={latest.rescueEntries}
                portionEntries={latest.portionEntries}
                moduleReviews={latest.moduleReviews}
                testIdPrefix="kitchen-day-progress"
              />
            </>
          ) : (
            <p className="chef-results-empty">No Kitchen Skills Challenge history yet.</p>
          )}
        </section>
      ) : (
        <section data-testid="kitchen-day-progress-history">
          <h2 className="kitchen-mgmt-module-title">Progress</h2>
          <Sparkline
            label="Waste rate"
            testId="kitchen-day-progress-waste-trend"
            values={points.flatMap((point) => (point.wastePercent == null ? [] : [point.wastePercent]))}
          />
          <Sparkline
            label="Preparation duration"
            testId="kitchen-day-progress-duration-trend"
            values={points.flatMap((point) => (point.durationMinutes == null ? [] : [point.durationMinutes]))}
          />
          <Sparkline
            label="Ingredient accuracy"
            testId="kitchen-day-progress-accuracy-trend"
            values={points.flatMap((point) =>
              point.ingredientAccuracyPercent == null ? [] : [point.ingredientAccuracyPercent],
            )}
          />
          <Sparkline
            label="Final-weight deviation"
            testId="kitchen-day-progress-final-deviation-trend"
            values={points.flatMap((point) =>
              point.finalWeightDeviationPercent == null ? [] : [point.finalWeightDeviationPercent],
            )}
          />
          <Sparkline
            label="Trim Smart time efficiency"
            testId="kitchen-day-progress-trim-time-trend"
            values={points.flatMap((point) =>
              point.trimTimeEfficiencyScore == null ? [] : [point.trimTimeEfficiencyScore],
            )}
          />
          <Sparkline
            label="Trim Smart preparation quality"
            testId="kitchen-day-progress-trim-quality-trend"
            values={points.flatMap((point) =>
              point.trimPreparationQualityScore == null ? [] : [point.trimPreparationQualityScore],
            )}
          />
          <Sparkline
            label="Rescue & Reuse time efficiency"
            testId="kitchen-day-progress-rescue-time-trend"
            values={points.flatMap((point) =>
              point.rescueTimeEfficiencyScore == null ? [] : [point.rescueTimeEfficiencyScore],
            )}
          />
          <Sparkline
            label="Rescue & Reuse preparation quality"
            testId="kitchen-day-progress-rescue-quality-trend"
            values={points.flatMap((point) =>
              point.rescuePreparationQualityScore == null ? [] : [point.rescuePreparationQualityScore],
            )}
          />
          <Sparkline
            label="Portion Precision time efficiency"
            testId="kitchen-day-progress-portion-time-trend"
            values={points.flatMap((point) =>
              point.portionTimeEfficiencyScore == null ? [] : [point.portionTimeEfficiencyScore],
            )}
          />
          <Sparkline
            label="Portion Precision preparation quality"
            testId="kitchen-day-progress-portion-quality-trend"
            values={points.flatMap((point) =>
              point.portionPreparationQualityScore == null ? [] : [point.portionPreparationQualityScore],
            )}
          />
          <ul className="kitchen-day-session-list">
            {points.map((point) => (
              <li key={point.sessionId}>
                {formatSessionDate(point.sessionDate)}
                {point.wastePercent != null ? ` · ${formatWastePercent(point.wastePercent)}` : ''}
                {point.ingredientAccuracyPercent != null
                  ? ` · Ingredient accuracy ${formatWastePercent(point.ingredientAccuracyPercent)}`
                  : ''}
                {point.finalWeightDeviationPercent != null
                  ? ` · Final-weight deviation ${formatWastePercent(point.finalWeightDeviationPercent)}`
                  : ''}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
