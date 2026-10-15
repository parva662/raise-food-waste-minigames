import { useCallback, useEffect, useMemo, useState, type KeyboardEvent } from 'react';
import { ManagementDetailDrawer } from '@/products/forecast-results/admin/components/ManagementDetailDrawer';
import { formatCountLabel } from '@/products/forecast-results/admin/adminPresentation';
import { SessionEvidence } from '@/products/kitchen-skills-challenge/surfaces/shared/SessionEvidence';
import type { KitchenSkillsTrainerSession } from '@/products/kitchen-skills-challenge/domain/types';
import {
  assessmentStatusLabel,
  filterSessionsByDateRange,
  formatMeanScoreOutOfFive,
  recordedModulesLabel,
  summarizeFilteredKitchenSkillsSessions,
  type KitchenSkillsAssessmentRow,
  type KitchenSkillsManagementDataState,
  type KitchenSkillsModuleAssessmentAverage,
  KITCHEN_SKILLS_MODULE_TITLES,
  KITCHEN_SKILLS_REVIEWED_MODULES,
} from '@/products/forecast-results/admin/skills/buildKitchenSkillsManagementSummary';
import {
  moduleHasEvidence,
  sessionAssessmentStatus,
} from '@/products/kitchen-skills-challenge/read/trainerSessions';

type SkillsTab = 'overview' | 'participants' | 'sessions' | 'assessments';

const SKILLS_TABS: { id: SkillsTab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'participants', label: 'Participants' },
  { id: 'sessions', label: 'Sessions' },
  { id: 'assessments', label: 'Assessments' },
];

const PAGE_SIZE = 8;

interface KitchenSkillsManagementSectionProps {
  data: KitchenSkillsManagementDataState;
}

function UnavailablePanel({
  title,
  message,
  testId,
}: {
  title: string;
  message: string;
  testId: string;
}) {
  return (
    <div className="kitchen-mgmt-surface" data-testid={testId}>
      <h3 className="kitchen-mgmt-surface__title">{title}</h3>
      <p className="kitchen-mgmt-snapshot-message">{message}</p>
    </div>
  );
}

function ModuleAssessmentPerformance({
  averages,
}: {
  averages: readonly KitchenSkillsModuleAssessmentAverage[];
}) {
  return (
    <section className="kitchen-mgmt-surface" data-testid="kitchen-mgmt-skills-assessment-performance">
      <h3 className="kitchen-mgmt-surface__title">Assessment performance</h3>
      <p className="kitchen-mgmt-helper">
        Mean tutor scores from recorded assessments only. Time efficiency and preparation quality
        stay separate; unassessed modules are not treated as zero.
      </p>
      <div className="kitchen-mgmt-assessment-grid" role="list">
        {averages.map((row) => (
          <article
            key={row.module}
            className="kitchen-mgmt-assessment-card"
            role="listitem"
            data-testid={`skills-assessment-avg-${row.module}`}
          >
            <h4 className="kitchen-mgmt-assessment-card__title">{row.moduleTitle}</h4>
            <dl className="kitchen-mgmt-assessment-card__metrics">
              <div>
                <dt>Time efficiency</dt>
                <dd data-testid={`skills-assessment-avg-time-${row.module}`}>
                  {formatMeanScoreOutOfFive(row.meanTimeEfficiency)}
                </dd>
              </div>
              <div>
                <dt>Preparation quality</dt>
                <dd data-testid={`skills-assessment-avg-quality-${row.module}`}>
                  {formatMeanScoreOutOfFive(row.meanPreparationQuality)}
                </dd>
              </div>
              <div>
                <dt>Assessments</dt>
                <dd data-testid={`skills-assessment-avg-count-${row.module}`}>
                  {formatCountLabel(row.assessmentCount, 'assessment', 'assessments')}
                </dd>
              </div>
            </dl>
          </article>
        ))}
      </div>
    </section>
  );
}

function SkillsOverview({
  data,
}: {
  data: Extract<KitchenSkillsManagementDataState, { status: 'ready' }>;
}) {
  const recent = [...data.sessions]
    .sort((left, right) => right.sessionDate.localeCompare(left.sessionDate))
    .slice(0, 5);

  return (
    <div className="kitchen-mgmt-overview kitchen-mgmt-overview--skills" data-testid="kitchen-mgmt-skills-overview">
      <section className="kitchen-mgmt-surface">
        <h3 className="kitchen-mgmt-surface__title">Kitchen Skills overview</h3>
        <div className="kitchen-mgmt-kpi-grid" data-testid="kitchen-mgmt-skills-kpis">
          <article className="kitchen-mgmt-kpi kitchen-mgmt-kpi--neutral">
            <p className="kitchen-mgmt-kpi__value" data-testid="skills-kpi-participants">
              {data.uniqueParticipants}
            </p>
            <p className="kitchen-mgmt-kpi__label">Participants</p>
          </article>
          <article className="kitchen-mgmt-kpi kitchen-mgmt-kpi--forecast">
            <p className="kitchen-mgmt-kpi__value" data-testid="skills-kpi-sessions">
              {data.sessionCount}
            </p>
            <p className="kitchen-mgmt-kpi__label">Practical sessions</p>
          </article>
          <article className="kitchen-mgmt-kpi kitchen-mgmt-kpi--surplus">
            <p className="kitchen-mgmt-kpi__value" data-testid="skills-kpi-activities">
              {data.activityCount}
            </p>
            <p className="kitchen-mgmt-kpi__label">Recorded activities</p>
          </article>
          <article className="kitchen-mgmt-kpi kitchen-mgmt-kpi--pending">
            <p className="kitchen-mgmt-kpi__value" data-testid="skills-kpi-awaiting">
              {data.modulesAwaitingAssessment}
            </p>
            <p className="kitchen-mgmt-kpi__label">Modules awaiting assessment</p>
          </article>
        </div>
      </section>

      <div className="kitchen-mgmt-skills-overview-split">
        <section className="kitchen-mgmt-surface" data-testid="kitchen-mgmt-skills-module-chart">
          <h3 className="kitchen-mgmt-surface__title">Module activity</h3>
          <div className="kitchen-mgmt-bar-chart" role="img" aria-label="Module activity counts">
            {KITCHEN_SKILLS_REVIEWED_MODULES.map((module) => {
              const count = data.moduleActivityCounts[module];
              const max = Math.max(
                ...KITCHEN_SKILLS_REVIEWED_MODULES.map((key) => data.moduleActivityCounts[key]),
                1,
              );
              const height = Math.max(8, Math.round((count / max) * 100));
              return (
                <div key={module} className="kitchen-mgmt-bar-chart__item">
                  <div
                    className="kitchen-mgmt-bar-chart__bar"
                    style={{ height }}
                    data-testid={`skills-module-bar-${module}`}
                    title={`${KITCHEN_SKILLS_MODULE_TITLES[module]}: ${count}`}
                  />
                  <span className="kitchen-mgmt-bar-chart__value">{count}</span>
                  <span className="kitchen-mgmt-bar-chart__label">
                    {KITCHEN_SKILLS_MODULE_TITLES[module]}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        <ModuleAssessmentPerformance averages={data.moduleAssessmentAverages} />
      </div>

      <section className="kitchen-mgmt-surface" data-testid="kitchen-mgmt-skills-recent">
        <h3 className="kitchen-mgmt-surface__title">Recent sessions</h3>
        {recent.length === 0 ? (
          <p className="kitchen-mgmt-empty">No practical sessions recorded yet.</p>
        ) : (
          <ul className="kitchen-mgmt-compact-list">
            {recent.map((session) => (
              <li key={`${session.actorId}:${session.sessionId}`}>
                <span className="kitchen-mgmt-compact-list__name">{session.actorName}</span>
                <span className="kitchen-mgmt-compact-list__meta">
                  {session.sessionDate} · {recordedModulesLabel(session) || 'No modules'} ·{' '}
                  {assessmentStatusLabel(session)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function paginate<T>(items: readonly T[], page: number): { rows: T[]; pageCount: number; page: number } {
  const pageCount = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  return {
    rows: items.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE) as T[],
    pageCount,
    page: safePage,
  };
}

function SkillsParticipants({
  sessions,
  participants,
}: {
  sessions: readonly KitchenSkillsTrainerSession[];
  participants: Extract<KitchenSkillsManagementDataState, { status: 'ready' }>['participants'];
}) {
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(0);
  const [selectedActorId, setSelectedActorId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return participants.filter((participant) =>
      needle ? participant.actorName.toLowerCase().includes(needle) : true,
    );
  }, [participants, query]);

  const { rows, pageCount, page: safePage } = paginate(filtered, page);
  const selectedSessions = sessions.filter((session) => session.actorId === selectedActorId);
  const selectedName =
    participants.find((participant) => participant.actorId === selectedActorId)?.actorName ??
    selectedSessions[0]?.actorName ??
    selectedActorId;

  useEffect(() => {
    if (selectedActorId && !participants.some((participant) => participant.actorId === selectedActorId)) {
      setSelectedActorId(null);
    }
  }, [participants, selectedActorId]);

  return (
    <section data-testid="kitchen-mgmt-skills-participants">
      <label className="kitchen-mgmt-search">
        <span className="kitchen-mgmt-search__label">Search participants</span>
        <input
          type="search"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setPage(0);
          }}
          data-testid="kitchen-mgmt-skills-participant-search"
          placeholder="Search by name"
        />
      </label>
      <div className="chef-results-table-wrap kitchen-mgmt-table-wrap">
        <table className="chef-results-table kitchen-mgmt-table">
          <thead>
            <tr>
              <th scope="col">Participant</th>
              <th scope="col" className="kitchen-mgmt-table__num">
                Sessions
              </th>
              <th scope="col">Latest session</th>
              <th scope="col" className="kitchen-mgmt-table__num">
                Awaiting assessment
              </th>
              <th scope="col">Details</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((participant) => (
              <tr
                key={participant.actorId}
                data-testid={`skills-participant-row-${participant.actorId}`}
              >
                <th scope="row">{participant.actorName}</th>
                <td className="kitchen-mgmt-table__num">{participant.sessionCount}</td>
                <td>{participant.latestSessionDate}</td>
                <td className="kitchen-mgmt-table__num">{participant.modulesAwaitingAssessment}</td>
                <td>
                  <button
                    type="button"
                    className="kitchen-mgmt-detail-button"
                    data-testid={`skills-participant-view-${participant.actorId}`}
                    aria-expanded={selectedActorId === participant.actorId}
                    onClick={() => setSelectedActorId(participant.actorId)}
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {filtered.length > PAGE_SIZE ? (
        <div className="kitchen-mgmt-pagination">
          <button
            type="button"
            className="kitchen-mgmt-detail-button"
            disabled={safePage === 0}
            onClick={() => setPage((current) => Math.max(0, current - 1))}
          >
            Previous
          </button>
          <span>
            Page {safePage + 1} of {pageCount}
          </span>
          <button
            type="button"
            className="kitchen-mgmt-detail-button"
            disabled={safePage >= pageCount - 1}
            onClick={() => setPage((current) => Math.min(pageCount - 1, current + 1))}
          >
            Next
          </button>
        </div>
      ) : null}
      <ManagementDetailDrawer
        open={Boolean(selectedActorId)}
        title={selectedName ?? 'Participant'}
        subtitle="Read-only Kitchen Skills history"
        onClose={() => setSelectedActorId(null)}
        testId="kitchen-mgmt-skills-participant-detail"
      >
        {selectedSessions.map((session) => (
          <div key={session.sessionId} className="kitchen-mgmt-surface kitchen-mgmt-surface--nested">
            <h4 className="kitchen-mgmt-surface__title">
              {session.sessionDate} · {assessmentStatusLabel(session)}
            </h4>
            <SessionEvidence
              trimEntries={session.trimEntries}
              rescueEntries={session.rescueEntries}
              portionEntries={session.portionEntries}
              moduleReviews={session.moduleReviews}
              sessionPortionEntries={session.portionEntries}
              showWasteAnalytics
              testIdPrefix={`skills-participant-${session.sessionId}`}
            />
          </div>
        ))}
      </ManagementDetailDrawer>
    </section>
  );
}

function SkillsSessions({ sessions }: { sessions: readonly KitchenSkillsTrainerSession[] }) {
  const [query, setQuery] = useState('');
  const [moduleFilter, setModuleFilter] = useState<'all' | (typeof KITCHEN_SKILLS_REVIEWED_MODULES)[number]>(
    'all',
  );
  const [statusFilter, setStatusFilter] = useState<'all' | 'awaiting' | 'partial' | 'reviewed'>('all');
  const [page, setPage] = useState(0);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return [...sessions]
      .sort((left, right) => right.sessionDate.localeCompare(left.sessionDate))
      .filter((session) => {
        if (needle && !session.actorName.toLowerCase().includes(needle) && !session.sessionDate.includes(needle)) {
          return false;
        }
        if (moduleFilter !== 'all' && !moduleHasEvidence(session, moduleFilter)) return false;
        const status = sessionAssessmentStatus(session);
        if (statusFilter === 'awaiting' && status !== 'needs_assessment') return false;
        if (statusFilter === 'partial' && status !== 'partially_reviewed') return false;
        if (statusFilter === 'reviewed' && status !== 'reviewed') return false;
        return true;
      });
  }, [moduleFilter, query, sessions, statusFilter]);

  const { rows, pageCount, page: safePage } = paginate(filtered, page);
  const selected = sessions.find(
    (session) => `${session.actorId}:${session.sessionId}` === selectedKey,
  );

  useEffect(() => {
    if (selectedKey && !selected) {
      setSelectedKey(null);
    }
  }, [selected, selectedKey]);

  return (
    <section data-testid="kitchen-mgmt-skills-sessions">
      <div className="kitchen-mgmt-filters">
        <label className="kitchen-mgmt-search">
          <span className="kitchen-mgmt-search__label">Search</span>
          <input
            type="search"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setPage(0);
            }}
            data-testid="kitchen-mgmt-skills-session-search"
            placeholder="Participant or date"
          />
        </label>
        <label className="kitchen-mgmt-search">
          <span className="kitchen-mgmt-search__label">Module</span>
          <select
            value={moduleFilter}
            onChange={(event) => {
              setModuleFilter(event.target.value as typeof moduleFilter);
              setPage(0);
            }}
            data-testid="kitchen-mgmt-skills-session-module-filter"
          >
            <option value="all">All modules</option>
            {KITCHEN_SKILLS_REVIEWED_MODULES.map((module) => (
              <option key={module} value={module}>
                {KITCHEN_SKILLS_MODULE_TITLES[module]}
              </option>
            ))}
          </select>
        </label>
        <label className="kitchen-mgmt-search">
          <span className="kitchen-mgmt-search__label">Assessment</span>
          <select
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(event.target.value as typeof statusFilter);
              setPage(0);
            }}
            data-testid="kitchen-mgmt-skills-session-status-filter"
          >
            <option value="all">All statuses</option>
            <option value="awaiting">Awaiting assessment</option>
            <option value="partial">Partially reviewed</option>
            <option value="reviewed">Reviewed</option>
          </select>
        </label>
      </div>
      <div className="chef-results-table-wrap kitchen-mgmt-table-wrap">
        <table className="chef-results-table kitchen-mgmt-table">
          <thead>
            <tr>
              <th scope="col">Participant</th>
              <th scope="col">Session date</th>
              <th scope="col">Modules</th>
              <th scope="col">Assessment</th>
              <th scope="col">Details</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((session) => {
              const key = `${session.actorId}:${session.sessionId}`;
              return (
                <tr key={key} data-testid={`skills-session-row-${session.sessionId}`}>
                  <th scope="row">{session.actorName}</th>
                  <td>{session.sessionDate}</td>
                  <td>{recordedModulesLabel(session) || 'None'}</td>
                  <td>{assessmentStatusLabel(session)}</td>
                  <td>
                    <button
                      type="button"
                      className="kitchen-mgmt-detail-button"
                      data-testid={`skills-session-view-${session.sessionId}`}
                      aria-expanded={selectedKey === key}
                      onClick={() => setSelectedKey(key)}
                    >
                      View
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {filtered.length > PAGE_SIZE ? (
        <div className="kitchen-mgmt-pagination">
          <button
            type="button"
            className="kitchen-mgmt-detail-button"
            disabled={safePage === 0}
            onClick={() => setPage((current) => Math.max(0, current - 1))}
          >
            Previous
          </button>
          <span>
            Page {safePage + 1} of {pageCount}
          </span>
          <button
            type="button"
            className="kitchen-mgmt-detail-button"
            disabled={safePage >= pageCount - 1}
            onClick={() => setPage((current) => Math.min(pageCount - 1, current + 1))}
          >
            Next
          </button>
        </div>
      ) : null}
      <ManagementDetailDrawer
        open={Boolean(selected)}
        title={selected?.actorName ?? 'Session'}
        subtitle={
          selected ? `${selected.sessionDate} · ${assessmentStatusLabel(selected)}` : undefined
        }
        onClose={() => setSelectedKey(null)}
        testId="kitchen-mgmt-skills-session-detail"
      >
        {selected ? (
          <SessionEvidence
            trimEntries={selected.trimEntries}
            rescueEntries={selected.rescueEntries}
            portionEntries={selected.portionEntries}
            moduleReviews={selected.moduleReviews}
            sessionPortionEntries={selected.portionEntries}
            showWasteAnalytics
            testIdPrefix={`skills-session-${selected.sessionId}`}
          />
        ) : null}
      </ManagementDetailDrawer>
    </section>
  );
}

function SkillsAssessments({ assessments }: { assessments: readonly KitchenSkillsAssessmentRow[] }) {
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return assessments.filter((row) => {
      if (!needle) return true;
      return (
        row.actorName.toLowerCase().includes(needle) ||
        row.moduleTitle.toLowerCase().includes(needle) ||
        row.sessionDate.includes(needle)
      );
    });
  }, [assessments, query]);

  const { rows, pageCount, page: safePage } = paginate(filtered, page);

  return (
    <section data-testid="kitchen-mgmt-skills-assessments">
      <p className="kitchen-mgmt-helper">
        Read-only tutor assessments. Time efficiency and preparation quality remain separate
        metrics.
      </p>
      <label className="kitchen-mgmt-search">
        <span className="kitchen-mgmt-search__label">Search assessments</span>
        <input
          type="search"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setPage(0);
          }}
          data-testid="kitchen-mgmt-skills-assessment-search"
          placeholder="Participant, module, or date"
        />
      </label>
      {filtered.length === 0 ? (
        <p className="kitchen-mgmt-empty" data-testid="kitchen-mgmt-skills-assessments-empty">
          No tutor assessments match the current filters.
        </p>
      ) : (
        <div className="chef-results-table-wrap kitchen-mgmt-table-wrap">
          <table className="chef-results-table kitchen-mgmt-table">
            <thead>
              <tr>
                <th scope="col">Participant</th>
                <th scope="col">Session</th>
                <th scope="col">Module</th>
                <th scope="col" className="kitchen-mgmt-table__num">
                  Time efficiency
                </th>
                <th scope="col" className="kitchen-mgmt-table__num">
                  Preparation quality
                </th>
                <th scope="col">Feedback</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={`${row.actorId}:${row.sessionId}:${row.module}`}
                  data-testid={`skills-assessment-row-${row.sessionId}-${row.module}`}
                >
                  <th scope="row">{row.actorName}</th>
                  <td>{row.sessionDate}</td>
                  <td>{row.moduleTitle}</td>
                  <td className="kitchen-mgmt-table__num">{row.review.timeEfficiencyScore} / 5</td>
                  <td className="kitchen-mgmt-table__num">
                    {row.review.preparationQualityScore} / 5
                  </td>
                  <td>{row.review.chefFeedback?.trim() || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {filtered.length > PAGE_SIZE ? (
        <div className="kitchen-mgmt-pagination">
          <button
            type="button"
            className="kitchen-mgmt-detail-button"
            disabled={safePage === 0}
            onClick={() => setPage((current) => Math.max(0, current - 1))}
          >
            Previous
          </button>
          <span>
            Page {safePage + 1} of {pageCount}
          </span>
          <button
            type="button"
            className="kitchen-mgmt-detail-button"
            disabled={safePage >= pageCount - 1}
            onClick={() => setPage((current) => Math.min(pageCount - 1, current + 1))}
          >
            Next
          </button>
        </div>
      ) : null}
    </section>
  );
}

function KitchenSkillsReportingPeriodPanel({
  allSessions,
  fromDate,
  toDate,
  onFromChange,
  onToChange,
  onReset,
  filteredSessionCount,
}: {
  allSessions: readonly KitchenSkillsTrainerSession[];
  fromDate: string;
  toDate: string;
  onFromChange: (value: string) => void;
  onToChange: (value: string) => void;
  onReset: () => void;
  filteredSessionCount: number;
}) {
  const period = useMemo(() => {
    if (allSessions.length === 0) {
      return { earliest: null as string | null, latest: null as string | null };
    }
    const dates = allSessions.map((session) => session.sessionDate).sort();
    return { earliest: dates[0] ?? null, latest: dates[dates.length - 1] ?? null };
  }, [allSessions]);

  const isFiltered = Boolean(fromDate || toDate);

  return (
    <section
      className="kitchen-mgmt-surface kitchen-mgmt-surface--compact kitchen-mgmt-skills-period"
      data-testid="kitchen-mgmt-skills-reporting-period"
    >
      <div className="kitchen-mgmt-skills-period__header">
        <h3 className="kitchen-mgmt-surface__title kitchen-mgmt-surface__title--inline">
          Kitchen Skills reporting period
        </h3>
        <p className="kitchen-mgmt-helper" data-testid="kitchen-mgmt-skills-period-default">
          {period.earliest && period.latest
            ? isFiltered
              ? `Showing ${formatCountLabel(filteredSessionCount, 'session', 'sessions')} in the selected range.`
              : `All recorded sessions (${period.earliest} – ${period.latest}).`
            : 'No recorded sessions yet.'}
        </p>
      </div>
      <div className="kitchen-mgmt-skills-period__controls">
        <label className="kitchen-mgmt-search">
          <span className="kitchen-mgmt-search__label">From</span>
          <input
            type="date"
            value={fromDate}
            onChange={(event) => onFromChange(event.target.value)}
            data-testid="kitchen-mgmt-skills-period-from"
          />
        </label>
        <label className="kitchen-mgmt-search">
          <span className="kitchen-mgmt-search__label">To</span>
          <input
            type="date"
            value={toDate}
            onChange={(event) => onToChange(event.target.value)}
            data-testid="kitchen-mgmt-skills-period-to"
          />
        </label>
        <button
          type="button"
          className="kitchen-mgmt-detail-button"
          data-testid="kitchen-mgmt-skills-period-reset"
          onClick={onReset}
          disabled={!isFiltered}
        >
          All sessions
        </button>
      </div>
    </section>
  );
}

export function KitchenSkillsManagementSection({ data }: KitchenSkillsManagementSectionProps) {
  const [activeTab, setActiveTab] = useState<SkillsTab>('overview');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        setActiveTab(SKILLS_TABS[(index + 1) % SKILLS_TABS.length]!.id);
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        setActiveTab(SKILLS_TABS[(index - 1 + SKILLS_TABS.length) % SKILLS_TABS.length]!.id);
      } else if (event.key === 'Home') {
        event.preventDefault();
        setActiveTab(SKILLS_TABS[0]!.id);
      } else if (event.key === 'End') {
        event.preventDefault();
        setActiveTab(SKILLS_TABS[SKILLS_TABS.length - 1]!.id);
      }
    },
    [],
  );

  if (data.status === 'pending') {
    return (
      <UnavailablePanel
        title="Kitchen Skills"
        message="Loading Kitchen Skills group activities…"
        testId="kitchen-mgmt-skills-pending"
      />
    );
  }

  if (data.status === 'standalone') {
    return (
      <UnavailablePanel
        title="Kitchen Skills"
        message="Kitchen Skills management data requires the GameBus kitchenSkillsTrainerInput group collection. Standalone fixtures cover Forecast & Service only."
        testId="kitchen-mgmt-skills-standalone"
      />
    );
  }

  if (data.status === 'unavailable') {
    return (
      <UnavailablePanel
        title="Kitchen Skills"
        message="kitchenSkillsTrainerInput is not attached to this Admin Dashboard GameBus page. Forecast & Service remains available. Attach the Kitchen Skills group Input Collection to enable this area."
        testId="kitchen-mgmt-skills-unavailable"
      />
    );
  }

  const filteredSessions = filterSessionsByDateRange(
    data.sessions,
    fromDate || toDate ? { fromDate, toDate } : null,
  );
  const viewData = summarizeFilteredKitchenSkillsSessions(filteredSessions);

  return (
    <div className="kitchen-mgmt-skills" data-testid="kitchen-mgmt-skills">
      <KitchenSkillsReportingPeriodPanel
        allSessions={data.sessions}
        fromDate={fromDate}
        toDate={toDate}
        onFromChange={setFromDate}
        onToChange={setToDate}
        onReset={() => {
          setFromDate('');
          setToDate('');
        }}
        filteredSessionCount={viewData.sessionCount}
      />

      <div
        className="kitchen-mgmt-primary-tabs kitchen-mgmt-primary-tabs--scroll"
        role="tablist"
        aria-label="Kitchen Skills views"
        data-testid="kitchen-mgmt-skills-tabs"
      >
        {SKILLS_TABS.map((tab, index) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            id={`kitchen-mgmt-skills-tab-${tab.id}`}
            aria-selected={activeTab === tab.id}
            aria-controls={`kitchen-mgmt-skills-panel-${tab.id}`}
            className={
              activeTab === tab.id
                ? 'kitchen-mgmt-primary-tabs__tab kitchen-mgmt-primary-tabs__tab--active'
                : 'kitchen-mgmt-primary-tabs__tab'
            }
            data-testid={`kitchen-mgmt-skills-tab-${tab.id}`}
            onClick={() => setActiveTab(tab.id)}
            onKeyDown={(event) => handleKeyDown(event, index)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {SKILLS_TABS.map((tab) => (
        <div
          key={tab.id}
          role="tabpanel"
          id={`kitchen-mgmt-skills-panel-${tab.id}`}
          aria-labelledby={`kitchen-mgmt-skills-tab-${tab.id}`}
          hidden={activeTab !== tab.id}
          data-testid={`kitchen-mgmt-skills-panel-${tab.id}`}
          className="kitchen-mgmt-primary-panel"
        >
          {activeTab === tab.id ? (
            tab.id === 'overview' ? (
              <SkillsOverview data={viewData} />
            ) : tab.id === 'participants' ? (
              <SkillsParticipants sessions={viewData.sessions} participants={viewData.participants} />
            ) : tab.id === 'sessions' ? (
              <SkillsSessions sessions={viewData.sessions} />
            ) : (
              <SkillsAssessments assessments={viewData.assessments} />
            )
          ) : null}
        </div>
      ))}
    </div>
  );
}
