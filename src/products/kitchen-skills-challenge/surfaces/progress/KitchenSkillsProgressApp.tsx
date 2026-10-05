import { useMemo, useState } from 'react';
import { formatSessionDate, formatWastePercent } from '@/products/kitchen-skills-challenge/format';
import {
  buildKitchenSkillsProgressPoints,
  filterModuleHistorySessions,
  latestModuleReviewAcrossSessions,
  metricSeriesForModule,
  moduleReviewHistory,
  paginateSessions,
  PROGRESS_HISTORY_PAGE_SIZE,
  progressMetricsForModule,
  recentSessionsLabel,
  sessionsForModule,
  sortKitchenSkillsSessionsNewestFirst,
  takeRecentSessions,
  type KitchenSkillsProgressHistoryFilters,
  type KitchenSkillsProgressMetricKey,
  type KitchenSkillsProgressReviewFilter,
} from '@/products/kitchen-skills-challenge/read/progressModel';
import { Sparkline } from '@/products/kitchen-skills-challenge/surfaces/progress/Sparkline';
import { useKitchenSkillsStudentProgressData } from '@/products/kitchen-skills-challenge/read/useGroupData';
import {
  KITCHEN_SKILLS_MODULE_TITLES,
  KITCHEN_SKILLS_REVIEWED_MODULES,
} from '@/products/kitchen-skills-challenge/domain/types';
import type {
  KitchenSkillsReviewedModule,
  KitchenSkillsReviewEntry,
  KitchenSkillsTrainerSession,
} from '@/products/kitchen-skills-challenge/domain/types';
import {
  findModuleReview,
  moduleHasEvidence,
} from '@/products/kitchen-skills-challenge/read/trainerSessions';

function shortSessionDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-').map(Number);
  if (!year || !month || !day) return isoDate;
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(year, month - 1, day, 12, 0, 0)));
}

function formatDurationMinutes(value: number): string {
  return `${value.toFixed(1)} min`;
}

function TutorAssessmentCard({
  review,
  sessionDate,
  compact = false,
  testIdBase,
}: {
  review: KitchenSkillsReviewEntry;
  sessionDate: string;
  compact?: boolean;
  /** Stable test ids only for the primary/latest card (avoid duplicates in history). */
  testIdBase?: string;
}) {
  return (
    <div
      className={
        compact
          ? 'kitchen-day-progress-tutor-card kitchen-day-progress-tutor-card--compact'
          : 'kitchen-day-progress-tutor-card'
      }
      data-testid={testIdBase}
    >
      <dl className="kitchen-day-progress-tutor-card__scores">
        <div>
          <dt>Time efficiency</dt>
          <dd data-testid={testIdBase ? `${testIdBase}-time` : undefined}>
            {review.timeEfficiencyScore} / 5
          </dd>
        </div>
        <div>
          <dt>Preparation quality</dt>
          <dd data-testid={testIdBase ? `${testIdBase}-quality` : undefined}>
            {review.preparationQualityScore} / 5
          </dd>
        </div>
      </dl>
      {review.chefFeedback ? (
        <p
          className="kitchen-day-progress-tutor-card__feedback"
          data-testid={testIdBase ? `${testIdBase}-feedback` : undefined}
        >
          “{review.chefFeedback}”
        </p>
      ) : null}
      <p className="kitchen-day-progress-tutor-card__session">Session: {shortSessionDate(sessionDate)}</p>
    </div>
  );
}

function moduleSessionMetrics(
  session: KitchenSkillsTrainerSession,
  module: KitchenSkillsReviewedModule,
  point?: ReturnType<typeof buildKitchenSkillsProgressPoints>[number],
): string[] {
  const metrics: string[] = [];
  if (module === 'trimSmart') {
    if (point?.wastePercent != null) metrics.push(`Waste ${formatWastePercent(point.wastePercent)}`);
    if (point?.durationMinutes != null) metrics.push(formatDurationMinutes(point.durationMinutes));
  } else if (module === 'rescueAndReuse') {
    metrics.push(
      `${session.rescueEntries.length} rescue entr${session.rescueEntries.length === 1 ? 'y' : 'ies'}`,
    );
  } else {
    if (point?.ingredientAccuracyPercent != null) {
      metrics.push(`Accuracy ${formatWastePercent(point.ingredientAccuracyPercent)}`);
    }
    if (point?.finalWeightDeviationPercent != null) {
      metrics.push(`Deviation ${formatWastePercent(point.finalWeightDeviationPercent)}`);
    }
  }
  return metrics;
}

function ModuleSummaryMetrics({
  module,
  sessions,
  points,
  totalSessionCount,
}: {
  module: KitchenSkillsReviewedModule;
  sessions: readonly KitchenSkillsTrainerSession[];
  points: ReturnType<typeof buildKitchenSkillsProgressPoints>;
  totalSessionCount: number;
}) {
  const latestPoint = [...points]
    .reverse()
    .find((point) => sessions.some((session) => session.sessionId === point.sessionId));
  const metrics = progressMetricsForModule(module);

  if (sessions.length === 0) {
    return <p className="kitchen-day-progress-empty">No {KITCHEN_SKILLS_MODULE_TITLES[module]} sessions yet.</p>;
  }

  return (
    <dl className="kitchen-day-progress-summary" data-testid={`kitchen-day-progress-summary-${module}`}>
      <div>
        <dt>Recent sessions</dt>
        <dd>
          {sessions.length}
          {totalSessionCount > sessions.length ? ` of ${totalSessionCount}` : ''}
        </dd>
      </div>
      {metrics.map((metric) => {
        const value = latestPoint?.[metric.key] ?? null;
        return (
          <div key={metric.key}>
            <dt>Latest {metric.label.toLowerCase()}</dt>
            <dd>
              {value == null
                ? '—'
                : metric.unit === 'percent'
                  ? formatWastePercent(value)
                  : formatDurationMinutes(value)}
            </dd>
          </div>
        );
      })}
      {module === 'rescueAndReuse' ? (
        <div>
          <dt>Latest rescue entries</dt>
          <dd>{sessions[0]?.rescueEntries.length ?? 0}</dd>
        </div>
      ) : null}
    </dl>
  );
}

function ModuleSessionCard({
  session,
  module,
  point,
}: {
  session: KitchenSkillsTrainerSession;
  module: KitchenSkillsReviewedModule;
  point?: ReturnType<typeof buildKitchenSkillsProgressPoints>[number];
}) {
  const review = findModuleReview(session, module);
  const metrics = moduleSessionMetrics(session, module, point);

  return (
    <details className="kitchen-day-progress-session-card" data-testid={`kitchen-day-progress-session-${module}-${session.sessionId}`}>
      <summary>
        <span className="kitchen-day-progress-session-card__date">{formatSessionDate(session.sessionDate)}</span>
        <span className="kitchen-day-progress-session-card__metrics">
          {metrics.length > 0 ? metrics.join(' · ') : 'Evidence recorded'}
        </span>
        <span
          className={
            review
              ? 'kitchen-day-tutor-status kitchen-day-tutor-status--reviewed'
              : 'kitchen-day-tutor-status kitchen-day-tutor-status--needs'
          }
        >
          {review ? `Reviewed ${review.timeEfficiencyScore}/${review.preparationQualityScore}` : 'Awaiting review'}
        </span>
      </summary>
      <div className="kitchen-day-progress-session-card__body">
        {moduleHasEvidence(session, module) ? (
          <p className="kitchen-day-progress-session-card__note">
            {module === 'trimSmart'
              ? `${session.trimEntries.length} Trim Smart entr${session.trimEntries.length === 1 ? 'y' : 'ies'}`
              : module === 'rescueAndReuse'
                ? `${session.rescueEntries.length} Rescue & Reuse entr${session.rescueEntries.length === 1 ? 'y' : 'ies'}`
                : `${session.portionEntries.length} Portion Precision entr${session.portionEntries.length === 1 ? 'y' : 'ies'}`}
          </p>
        ) : null}
        {review ? (
          <TutorAssessmentCard review={review} sessionDate={session.sessionDate} compact />
        ) : (
          <p className="kitchen-day-progress-empty">No tutor assessment for this session.</p>
        )}
      </div>
    </details>
  );
}

function ModuleHistoryRow({
  session,
  module,
  point,
}: {
  session: KitchenSkillsTrainerSession;
  module: KitchenSkillsReviewedModule;
  point?: ReturnType<typeof buildKitchenSkillsProgressPoints>[number];
}) {
  const review = findModuleReview(session, module);
  const metrics = moduleSessionMetrics(session, module, point);

  return (
    <details
      className="kitchen-day-progress-history-row"
      data-testid={`kitchen-day-progress-history-row-${module}-${session.sessionId}`}
    >
      <summary>
        <span className="kitchen-day-progress-history-row__date">{formatSessionDate(session.sessionDate)}</span>
        <span className="kitchen-day-progress-history-row__metrics">
          {metrics.length > 0 ? metrics.join(' · ') : 'Evidence recorded'}
        </span>
        <span
          className={
            review
              ? 'kitchen-day-tutor-status kitchen-day-tutor-status--reviewed'
              : 'kitchen-day-tutor-status kitchen-day-tutor-status--needs'
          }
        >
          {review ? `${review.timeEfficiencyScore}/${review.preparationQualityScore}` : 'Awaiting'}
        </span>
      </summary>
      <div className="kitchen-day-progress-history-row__body">
        {review ? (
          <TutorAssessmentCard review={review} sessionDate={session.sessionDate} compact />
        ) : (
          <p className="kitchen-day-progress-empty">No tutor assessment for this session.</p>
        )}
      </div>
    </details>
  );
}

function ModuleHistoryPanel({
  module,
  sessions,
  points,
}: {
  module: KitchenSkillsReviewedModule;
  sessions: readonly KitchenSkillsTrainerSession[];
  points: ReturnType<typeof buildKitchenSkillsProgressPoints>;
}) {
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [reviewStatus, setReviewStatus] = useState<KitchenSkillsProgressReviewFilter>('all');
  const [page, setPage] = useState(1);

  const filters: KitchenSkillsProgressHistoryFilters = {
    fromDate: fromDate || null,
    toDate: toDate || null,
    reviewStatus,
  };
  const filtered = filterModuleHistorySessions(sessions, module, filters);
  const { pageItems, page: safePage, totalPages, totalItems } = paginateSessions(
    filtered,
    page,
    PROGRESS_HISTORY_PAGE_SIZE,
  );

  return (
    <section className="kitchen-day-progress-section" data-testid={`kitchen-day-progress-archive-${module}`}>
      <h3 className="kitchen-day-progress-section__title">History</h3>
      <p className="kitchen-day-progress-section__eyebrow">
        Search and browse earlier sessions. Charts stay on Recent only.
      </p>

      <div className="kitchen-day-progress-history-filters">
        <label className="kitchen-day-progress-history-filters__field">
          <span>From</span>
          <input
            type="date"
            value={fromDate}
            data-testid={`kitchen-day-progress-history-from-${module}`}
            onChange={(event) => {
              setFromDate(event.target.value);
              setPage(1);
            }}
          />
        </label>
        <label className="kitchen-day-progress-history-filters__field">
          <span>To</span>
          <input
            type="date"
            value={toDate}
            data-testid={`kitchen-day-progress-history-to-${module}`}
            onChange={(event) => {
              setToDate(event.target.value);
              setPage(1);
            }}
          />
        </label>
        <label className="kitchen-day-progress-history-filters__field">
          <span>Review status</span>
          <select
            value={reviewStatus}
            data-testid={`kitchen-day-progress-history-status-${module}`}
            onChange={(event) => {
              setReviewStatus(event.target.value as KitchenSkillsProgressReviewFilter);
              setPage(1);
            }}
          >
            <option value="all">All</option>
            <option value="reviewed">Reviewed only</option>
            <option value="awaiting">Awaiting review</option>
          </select>
        </label>
      </div>

      {totalItems === 0 ? (
        <p className="kitchen-day-progress-empty" data-testid={`kitchen-day-progress-history-empty-${module}`}>
          No sessions match these filters.
        </p>
      ) : (
        <>
          <ul className="kitchen-day-progress-history-list" data-testid={`kitchen-day-progress-history-list-${module}`}>
            {pageItems.map((session) => (
              <li key={session.sessionId}>
                <ModuleHistoryRow
                  session={session}
                  module={module}
                  point={points.find((item) => item.sessionId === session.sessionId)}
                />
              </li>
            ))}
          </ul>
          <div className="kitchen-day-progress-history-pager">
            <p className="kitchen-day-progress-history-pager__meta">
              {totalItems} session{totalItems === 1 ? '' : 's'} · page {safePage} of {totalPages}
            </p>
            <div className="kitchen-day-progress-history-pager__actions">
              <button
                type="button"
                className="kitchen-day-button kitchen-day-button--ghost"
                disabled={safePage <= 1}
                data-testid={`kitchen-day-progress-history-prev-${module}`}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
              >
                Previous
              </button>
              <button
                type="button"
                className="kitchen-day-button kitchen-day-button--ghost"
                disabled={safePage >= totalPages}
                data-testid={`kitchen-day-progress-history-next-${module}`}
                onClick={() => setPage((current) => current + 1)}
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </section>
  );
}

function ModuleProgressPanel({
  module,
  sessions,
  points,
}: {
  module: KitchenSkillsReviewedModule;
  sessions: readonly KitchenSkillsTrainerSession[];
  points: ReturnType<typeof buildKitchenSkillsProgressPoints>;
}) {
  const metrics = progressMetricsForModule(module);
  const [metricKey, setMetricKey] = useState<KitchenSkillsProgressMetricKey | null>(
    metrics[0]?.key ?? null,
  );
  const activeMetric = metrics.find((metric) => metric.key === metricKey) ?? metrics[0] ?? null;
  const moduleSessions = sessionsForModule(sessions, module);
  const recentSessions = takeRecentSessions(moduleSessions);
  const recentIds = new Set(recentSessions.map((session) => session.sessionId));
  const recentPoints = points.filter((point) => recentIds.has(point.sessionId));
  const series = activeMetric ? metricSeriesForModule(recentPoints, activeMetric.key) : [];
  const latestReview = moduleReviewHistory(moduleSessions, module)[0] ?? null;

  if (moduleSessions.length === 0) {
    return (
      <div data-testid={`kitchen-day-progress-module-${module}`}>
        <p className="kitchen-day-progress-empty">No {KITCHEN_SKILLS_MODULE_TITLES[module]} sessions yet.</p>
        <section className="kitchen-day-progress-section">
          <h3 className="kitchen-day-progress-section__title">Tutor assessment</h3>
          <p className="kitchen-day-progress-empty" data-testid={`kitchen-day-progress-tutor-empty-${module}`}>
            No tutor assessment yet.
          </p>
        </section>
      </div>
    );
  }

  return (
    <div data-testid={`kitchen-day-progress-module-${module}`}>
      <section className="kitchen-day-progress-section" data-testid={`kitchen-day-progress-recent-${module}`}>
        <h3 className="kitchen-day-progress-section__title">Recent</h3>
        <p
          className="kitchen-day-progress-section__eyebrow"
          data-testid={`kitchen-day-progress-recent-label-${module}`}
        >
          {recentSessionsLabel(recentSessions)}
        </p>

        <ModuleSummaryMetrics
          module={module}
          sessions={recentSessions}
          points={recentPoints}
          totalSessionCount={moduleSessions.length}
        />

        {metrics.length > 1 ? (
          <div
            className="kitchen-day-progress-metric-tabs"
            role="tablist"
            aria-label={`${KITCHEN_SKILLS_MODULE_TITLES[module]} metrics`}
          >
            {metrics.map((metric) => {
              const selected = activeMetric?.key === metric.key;
              return (
                <button
                  key={metric.key}
                  type="button"
                  role="tab"
                  className={
                    selected
                      ? 'kitchen-day-progress-metric-tabs__tab kitchen-day-progress-metric-tabs__tab--active'
                      : 'kitchen-day-progress-metric-tabs__tab'
                  }
                  aria-selected={selected}
                  data-testid={`kitchen-day-progress-metric-${module}-${metric.key}`}
                  onClick={() => setMetricKey(metric.key)}
                >
                  {metric.label}
                </button>
              );
            })}
          </div>
        ) : null}

        {activeMetric ? (
          <Sparkline
            label={activeMetric.label}
            testId={`kitchen-day-progress-${module}-${activeMetric.key}-trend`}
            unit={activeMetric.unit}
            values={series.map((item) => item.value)}
            labels={series.map((item) => shortSessionDate(item.sessionDate))}
          />
        ) : (
          <p className="kitchen-day-progress-empty">
            Performance trends for {KITCHEN_SKILLS_MODULE_TITLES[module]} appear here when measurements are available.
          </p>
        )}

        <h4 className="kitchen-day-progress-section__subtitle">Tutor assessment</h4>
        {latestReview ? (
          <>
            <p className="kitchen-day-progress-section__eyebrow">Latest tutor assessment</p>
            <TutorAssessmentCard
              review={latestReview.review}
              sessionDate={latestReview.session.sessionDate}
              testIdBase={`kitchen-day-progress-tutor-${module}`}
            />
          </>
        ) : (
          <p className="kitchen-day-progress-empty" data-testid={`kitchen-day-progress-tutor-empty-${module}`}>
            No tutor assessment yet.
          </p>
        )}

        <h4 className="kitchen-day-progress-section__subtitle">Recent sessions</h4>
        <ul className="kitchen-day-progress-session-list" data-testid={`kitchen-day-progress-sessions-${module}`}>
          {recentSessions.map((session) => (
            <li key={session.sessionId}>
              <ModuleSessionCard
                session={session}
                module={module}
                point={points.find((item) => item.sessionId === session.sessionId)}
              />
            </li>
          ))}
        </ul>
      </section>

      <ModuleHistoryPanel module={module} sessions={moduleSessions} points={points} />
    </div>
  );
}

function OverviewModuleCard({
  module,
  sessions,
  points,
  onOpen,
}: {
  module: KitchenSkillsReviewedModule;
  sessions: readonly KitchenSkillsTrainerSession[];
  points: ReturnType<typeof buildKitchenSkillsProgressPoints>;
  onOpen: (module: KitchenSkillsReviewedModule) => void;
}) {
  const latestReview = latestModuleReviewAcrossSessions(sessions, module);
  const moduleSessions = sessionsForModule(sessions, module);
  const latestPoint = [...points]
    .reverse()
    .find((point) => moduleSessions.some((session) => session.sessionId === point.sessionId));
  const metrics = progressMetricsForModule(module);

  return (
    <article className="kitchen-day-progress-overview-card" data-testid={`kitchen-day-progress-overview-${module}`}>
      <header className="kitchen-day-progress-overview-card__header">
        <h3>{KITCHEN_SKILLS_MODULE_TITLES[module]}</h3>
        <span
          className={
            latestReview
              ? 'kitchen-day-tutor-status kitchen-day-tutor-status--reviewed'
              : 'kitchen-day-tutor-status kitchen-day-tutor-status--needs'
          }
        >
          {latestReview ? 'Reviewed' : 'No tutor assessment'}
        </span>
      </header>
      <dl className="kitchen-day-progress-summary kitchen-day-progress-summary--compact">
        <div>
          <dt>Sessions</dt>
          <dd>{moduleSessions.length}</dd>
        </div>
        {metrics.slice(0, 1).map((metric) => {
          const value = latestPoint?.[metric.key] ?? null;
          return (
            <div key={metric.key}>
              <dt>{metric.label}</dt>
              <dd>
                {value == null
                  ? '—'
                  : metric.unit === 'percent'
                    ? formatWastePercent(value)
                    : formatDurationMinutes(value)}
              </dd>
            </div>
          );
        })}
        {latestReview ? (
          <div>
            <dt>Latest tutor scores</dt>
            <dd>
              {latestReview.review.timeEfficiencyScore}/{latestReview.review.preparationQualityScore}
            </dd>
          </div>
        ) : null}
      </dl>
      {latestReview?.review.chefFeedback ? (
        <p className="kitchen-day-progress-overview-card__feedback">
          “{latestReview.review.chefFeedback}”
        </p>
      ) : null}
      <button
        type="button"
        className="kitchen-day-button kitchen-day-button--ghost"
        data-testid={`kitchen-day-progress-overview-open-${module}`}
        onClick={() => onOpen(module)}
      >
        View {KITCHEN_SKILLS_MODULE_TITLES[module]}
      </button>
    </article>
  );
}

export function KitchenSkillsProgressApp() {
  const { sessions: ownSessions } = useKitchenSkillsStudentProgressData();
  const [tab, setTab] = useState<'overview' | 'progress'>('overview');
  const [moduleTab, setModuleTab] = useState<KitchenSkillsReviewedModule>('trimSmart');
  const points = useMemo(() => buildKitchenSkillsProgressPoints(ownSessions), [ownSessions]);
  const newestSessions = useMemo(
    () => sortKitchenSkillsSessionsNewestFirst(ownSessions),
    [ownSessions],
  );

  const openModuleInProgress = (module: KitchenSkillsReviewedModule) => {
    setModuleTab(module);
    setTab('progress');
  };

  return (
    <div
      className="chef-results-page chef-results-page--participant kitchen-mgmt-page kitchen-day-progress-page"
      data-testid="kitchen-day-progress-page"
    >
      <header className="kitchen-day-progress-header">
        <div>
          <h1 className="kitchen-day-progress-header__title">Kitchen Skills Challenge Progress</h1>
          <p className="kitchen-day-progress-header__lead">
            Your own Kitchen Skills Challenge performance over time.
          </p>
        </div>
      </header>

      <div
        className="kitchen-day-progress-primary-tabs"
        role="tablist"
        aria-label="Kitchen Skills Challenge progress views"
      >
        <button
          type="button"
          role="tab"
          className={
            tab === 'overview'
              ? 'kitchen-day-progress-primary-tabs__tab kitchen-day-progress-primary-tabs__tab--active'
              : 'kitchen-day-progress-primary-tabs__tab'
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
              ? 'kitchen-day-progress-primary-tabs__tab kitchen-day-progress-primary-tabs__tab--active'
              : 'kitchen-day-progress-primary-tabs__tab'
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
          {newestSessions.length === 0 ? (
            <p className="kitchen-day-progress-empty">No Kitchen Skills Challenge history yet.</p>
          ) : (
            <div className="kitchen-day-progress-overview-grid">
              {KITCHEN_SKILLS_REVIEWED_MODULES.map((module) => (
                <OverviewModuleCard
                  key={module}
                  module={module}
                  sessions={ownSessions}
                  points={points}
                  onOpen={openModuleInProgress}
                />
              ))}
            </div>
          )}
        </section>
      ) : (
        <section data-testid="kitchen-day-progress-history">
          <div
            className="kitchen-day-module-tabs"
            role="tablist"
            aria-label="Kitchen Skills Challenge modules"
            data-testid="kitchen-day-progress-module-tabs"
          >
            {KITCHEN_SKILLS_REVIEWED_MODULES.map((module) => {
              const selected = moduleTab === module;
              return (
                <button
                  key={module}
                  type="button"
                  role="tab"
                  className={
                    selected
                      ? 'kitchen-day-module-tabs__tab kitchen-day-module-tabs__tab--active'
                      : 'kitchen-day-module-tabs__tab'
                  }
                  aria-selected={selected}
                  data-testid={`kitchen-day-progress-module-tab-${module}`}
                  onClick={() => setModuleTab(module)}
                >
                  {KITCHEN_SKILLS_MODULE_TITLES[module]}
                </button>
              );
            })}
          </div>
          <ModuleProgressPanel
            key={moduleTab}
            module={moduleTab}
            sessions={ownSessions}
            points={points}
          />
        </section>
      )}
    </div>
  );
}
