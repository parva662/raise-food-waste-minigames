import { useMemo, useState } from 'react';
import '../styles.css';
import { formatSessionDate, formatWastePercent } from './format';
import { buildKitchenDayProgressPoints } from './progress/progressModel';
import { SessionEvidence } from './SessionEvidence';
import { Sparkline } from './Sparkline';
import { useKitchenDayGroupData } from './useKitchenDayGroupData';

export function KitchenDayProgressApp() {
  const { actorId, sessions } = useKitchenDayGroupData();
  const [tab, setTab] = useState<'overview' | 'progress'>('overview');
  const ownSessions = useMemo(
    () => (actorId ? sessions.filter((session) => session.actorId === actorId) : []),
    [actorId, sessions],
  );
  const latest = ownSessions[ownSessions.length - 1] ?? ownSessions[0];
  const points = buildKitchenDayProgressPoints(ownSessions);

  return (
    <div className="chef-results-page chef-results-page--participant kitchen-mgmt-page" data-testid="kitchen-day-progress-page">
      <header className="kitchen-mgmt-header chef-results-dashboard-header">
        <div className="kitchen-mgmt-header__main">
          <h1 className="kitchen-mgmt-header__title">Kitchen Day Progress</h1>
          <p className="kitchen-mgmt-header__lead">
            Your own Kitchen Day performance over time.
          </p>
        </div>
      </header>

      <div className="kitchen-mgmt-primary-tabs" role="tablist" aria-label="Kitchen Day progress views">
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
              <h2 className="kitchen-mgmt-module-title">Latest Kitchen Day</h2>
              <p>{formatSessionDate(latest.sessionDate)}</p>
              {latest.review ? (
                <div className="chef-results-panel" data-testid="kitchen-day-progress-tutor">
                  <h3 className="chef-results-panel__title">Tutor review</h3>
                  <p>Time efficiency {latest.review.timeEfficiencyScore}</p>
                  <p>Preparation quality {latest.review.preparationQualityScore}</p>
                  {latest.review.chefFeedback ? <p>{latest.review.chefFeedback}</p> : null}
                </div>
              ) : (
                <p className="chef-results-empty">No tutor assessment yet.</p>
              )}
              <SessionEvidence
                trimEntries={latest.trimEntries}
                rescueEntries={latest.rescueEntries}
                portionEntries={latest.portionEntries}
                testIdPrefix="kitchen-day-progress"
              />
            </>
          ) : (
            <p className="chef-results-empty">No Kitchen Day history yet.</p>
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
            label="Tutor time efficiency"
            testId="kitchen-day-progress-time-trend"
            values={points.flatMap((point) =>
              point.timeEfficiencyScore == null ? [] : [point.timeEfficiencyScore],
            )}
          />
          <Sparkline
            label="Tutor preparation quality"
            testId="kitchen-day-progress-quality-trend"
            values={points.flatMap((point) =>
              point.preparationQualityScore == null ? [] : [point.preparationQualityScore],
            )}
          />
          <ul className="kitchen-day-session-list">
            {points.map((point) => (
              <li key={point.sessionId}>
                {formatSessionDate(point.sessionDate)}
                {point.wastePercent != null ? ` · ${formatWastePercent(point.wastePercent)}` : ''}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
