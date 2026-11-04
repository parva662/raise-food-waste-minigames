import { useEffect, useMemo, useState, type MouseEvent } from 'react';
import {
  KitchenSkillsSessionProvider,
  useKitchenSkillsSession,
} from '@/products/kitchen-skills-challenge/domain/session/KitchenSkillsSessionContext';
import { formatSessionDate } from '@/products/kitchen-skills-challenge/format';
import {
  buildKitchenSkillsTrainerStaffSummaries,
  findKitchenSkillsTrainerSession,
  partitionTrainerSessionsByAssessment,
  sessionAssessmentCounts,
  sessionAssessmentStatus,
  sessionRecordedModuleLabels,
} from '@/products/kitchen-skills-challenge/read/trainerSessions';
import { listSessionRecipeIds, recipeDisplayName } from '@/products/kitchen-skills-challenge/domain/session/reviewIdentity';
import type {
  KitchenSkillsTrainerSession,
  KitchenSkillsTrainerStaffSummary,
} from '@/products/kitchen-skills-challenge/domain/types';
import { KitchenSkillsTrainerSessionDetail } from '@/products/kitchen-skills-challenge/surfaces/trainer/KitchenSkillsTrainerSessionDetail';
import { KitchenSkillsCombinedTrainerSessionDetail } from '@/products/kitchen-skills-challenge/surfaces/trainer/KitchenSkillsCombinedTrainerSessionDetail';
import { TrainerStatusChip } from '@/products/kitchen-skills-challenge/surfaces/trainer/TrainerStatusChip';
import {
  hasAnyUnsavedReviewDraft,
  type KitchenSkillsReviewFormDraft,
} from '@/products/kitchen-skills-challenge/surfaces/trainer/reviewDrafts';
import { postKitchenSkillsChallengeExit } from '@/products/kitchen-skills-challenge/gamebus/postExit';
import {
  kitchenDayTutorCombinedHashFor,
  kitchenDayTutorHashFor,
  parseKitchenDaySelectedActorId,
  parseKitchenDaySelectedSessionId,
} from '@/app/routes';
import { formatOperationalTime } from '@/shared/time/dates';

const UNSAVED_DRAFT_CONFIRM =
  'You have an unsaved tutor assessment draft. Leave without submitting?';

type LegacyStaffSessionTab = 'needs' | 'awaiting' | 'reviewed';
type CombinedStaffSessionTab = 'needs' | 'submitted';
type StaffSessionTab = LegacyStaffSessionTab | CombinedStaffSessionTab;
export type KitchenSkillsTrainerVariant = 'per-module' | 'combined';

type TutorHashFor = typeof kitchenDayTutorHashFor;

function combinedSessionListLabel(state: ReturnType<typeof sessionAssessmentStatus>): string {
  return state === 'needs_assessment' ? 'Needs assessment' : 'Submitted';
}

function earliestSubmittedAt(session: KitchenSkillsTrainerSession): string | null {
  const stamps = [
    ...session.trimEntries.map((entry) => entry.submittedAt),
    ...session.rescueEntries.map((entry) => entry.submittedAt),
    ...session.portionEntries.map((entry) => entry.submittedAt),
  ].filter(Boolean);
  if (stamps.length === 0) return null;
  return [...stamps].sort((left, right) => left.localeCompare(right))[0] ?? null;
}

function sortSessionsNewestFirst(sessions: readonly KitchenSkillsTrainerSession[]): KitchenSkillsTrainerSession[] {
  return [...sessions].sort((left, right) => {
    const byDate = right.sessionDate.localeCompare(left.sessionDate);
    if (byDate !== 0) return byDate;
    const leftTime = earliestSubmittedAt(left) ?? '';
    const rightTime = earliestSubmittedAt(right) ?? '';
    return rightTime.localeCompare(leftTime);
  });
}

function plural(count: number, one: string, many = `${one}s`): string {
  return `${count} ${count === 1 ? one : many}`;
}

function staffCountsLabel(
  staff: KitchenSkillsTrainerStaffSummary,
  variant: KitchenSkillsTrainerVariant = 'per-module',
): string {
  if (variant === 'combined') {
    return plural(staff.sessionCount, 'session');
  }
  return [
    plural(staff.sessionCount, 'session'),
    `${staff.sessionsNeedingAssessment} to assess`,
    `${staff.sessionsAwaitingConfirmation} awaiting`,
    `${staff.sessionsReviewed} reviewed`,
  ].join(' · ');
}

function KitchenSkillsTrainerBody({
  variant,
  hashFor,
}: {
  variant: KitchenSkillsTrainerVariant;
  hashFor: TutorHashFor;
}) {
  const { session, groupSessions } = useKitchenSkillsSession();
  const sessions = groupSessions;
  const [selectedSessionId, setSelectedSessionId] = useState(() => parseKitchenDaySelectedSessionId());
  const [selectedActorId, setSelectedActorId] = useState(() => parseKitchenDaySelectedActorId());
  const [staffQuery, setStaffQuery] = useState('');
  const [reviewDrafts, setReviewDrafts] = useState<Record<string, KitchenSkillsReviewFormDraft>>({});
  const [staffSessionTab, setStaffSessionTab] = useState<StaffSessionTab | null>(null);
  const hasUnsavedDrafts = hasAnyUnsavedReviewDraft(reviewDrafts);
  const pageTestId =
    variant === 'combined' ? 'kitchen-day-tutor-combined-page' : 'kitchen-day-tutor-page';
  const title =
    variant === 'combined'
      ? 'Kitchen Skills Trainer (Combined)'
      : 'Kitchen Skills Trainer';

  useEffect(() => {
    const sync = () => {
      // Do not clear drafts on hashchange — navigation confirmations own discard.
      setSelectedSessionId(parseKitchenDaySelectedSessionId());
      setSelectedActorId(parseKitchenDaySelectedActorId());
      setStaffSessionTab(null);
    };
    window.addEventListener('hashchange', sync);
    return () => window.removeEventListener('hashchange', sync);
  }, []);

  const confirmLeaveUnsaved = (): boolean => {
    if (!hasUnsavedDrafts) return true;
    return window.confirm(UNSAVED_DRAFT_CONFIRM);
  };

  const guardNavigationClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (!hasUnsavedDrafts) return;
    if (!window.confirm(UNSAVED_DRAFT_CONFIRM)) {
      event.preventDefault();
    }
  };

  const staffSummaries = useMemo(
    () => buildKitchenSkillsTrainerStaffSummaries(sessions),
    [sessions],
  );
  const filteredStaff = useMemo(() => {
    const query = staffQuery.trim().toLowerCase();
    if (!query) return staffSummaries;
    return staffSummaries.filter((staff) => staff.actorName.toLowerCase().includes(query));
  }, [staffQuery, staffSummaries]);

  const selectedStaff = selectedActorId
    ? staffSummaries.find((staff) => staff.actorId === selectedActorId)
    : undefined;
  const selected = findKitchenSkillsTrainerSession(sessions, selectedSessionId, selectedActorId);

  const closeTrainer = () => {
    if (!confirmLeaveUnsaved()) return;
    postKitchenSkillsChallengeExit();
  };

  const updateReviewDraft = (key: string, draft: KitchenSkillsReviewFormDraft) => {
    setReviewDrafts((current) => {
      const empty =
        draft.timeScore.trim().length === 0 &&
        draft.qualityScore.trim().length === 0 &&
        draft.feedback.trim().length === 0;
      if (empty) {
        if (!(key in current)) return current;
        const next = { ...current };
        delete next[key];
        return next;
      }
      return { ...current, [key]: draft };
    });
  };

  if (!session) {
    return (
      <div className="chef-results-page kitchen-mgmt-page kitchen-day-tutor-page" data-testid="kitchen-day-tutor-initializing">
        <header className="kitchen-day-tutor-header kitchen-day-tutor-header--sticky">
          <div className="kitchen-day-tutor-header__main">
            <h1 className="kitchen-day-tutor-header__title">Kitchen Skills Trainer</h1>
            <p className="kitchen-day-tutor-header__lead kitchen-day-tutor-header__lead--intro">
              Getting the tutor workspace ready.
            </p>
          </div>
        </header>
      </div>
    );
  }

  const sessionSelected = Boolean(selectedSessionId && selected);
  const staffSelected = !selectedSessionId && Boolean(selectedActorId && selectedStaff);

  let headerLead: { text: string; testId?: string; intro?: boolean };
  if (sessionSelected && selected) {
    const earliest = earliestSubmittedAt(selected);
    headerLead = {
      text: `${selected.actorName} · ${formatSessionDate(selected.sessionDate)}${earliest ? ` · ${formatOperationalTime(earliest)}` : ''}`,
      testId: 'kitchen-day-tutor-header-session',
    };
  } else if (staffSelected && selectedStaff) {
    headerLead = { text: selectedStaff.actorName, testId: 'kitchen-day-tutor-header-staff' };
  } else {
    headerLead = { text: 'Review student evidence, then add a tutor assessment.', intro: true };
  }

  return (
    <div className="chef-results-page kitchen-mgmt-page kitchen-day-tutor-page" data-testid={pageTestId}>
      <header className="kitchen-day-tutor-header kitchen-day-tutor-header--sticky" data-testid="kitchen-day-tutor-header">
        <div className="kitchen-day-tutor-header__main">
          <h1 className="kitchen-day-tutor-header__title">{title}</h1>
          <p
            className={
              headerLead.intro
                ? 'kitchen-day-tutor-header__lead kitchen-day-tutor-header__lead--intro'
                : 'kitchen-day-tutor-header__lead kitchen-day-tutor-header__lead--identity'
            }
            data-testid={headerLead.testId}
          >
            {headerLead.text}
          </p>
        </div>
        <div className="kitchen-day-tutor-header__actions">
          {sessionSelected && selected ? (
            <a
              href={hashFor({ actorId: selected.actorId })}
              className="kitchen-day-button kitchen-day-button--ghost"
              data-testid="kitchen-day-tutor-back-staff"
              onClick={guardNavigationClick}
            >
              Back
            </a>
          ) : staffSelected ? (
            <a
              href={hashFor()}
              className="kitchen-day-button kitchen-day-button--ghost"
              data-testid="kitchen-day-tutor-back-staff-list"
              onClick={guardNavigationClick}
            >
              Back
            </a>
          ) : null}
          <button
            type="button"
            className="kitchen-day-button kitchen-day-button--ghost"
            data-testid="kitchen-day-tutor-close"
            onClick={closeTrainer}
          >
            Close
          </button>
        </div>
      </header>

      {selectedSessionId && selected ? (
        variant === 'combined' ? (
          <KitchenSkillsCombinedTrainerSessionDetail
            key={`${selected.actorId}:${selected.sessionId}:combined`}
            selected={selected}
            reviewDrafts={reviewDrafts}
            onReviewDraftChange={updateReviewDraft}
            onAssessAnother={() => {
              if (!confirmLeaveUnsaved()) return;
              window.location.hash = hashFor({ actorId: selected.actorId });
            }}
            onCloseTrainer={closeTrainer}
          />
        ) : (
          <KitchenSkillsTrainerSessionDetail
            key={`${selected.actorId}:${selected.sessionId}`}
            selected={selected}
            drafts={reviewDrafts}
            onDraftChange={updateReviewDraft}
          />
        )
      ) : selectedSessionId ? (
        <p className="chef-results-empty">That student session was not found.</p>
      ) : selectedActorId && selectedStaff ? (
        <>
          {variant === 'combined' ? null : (
            <p className="kitchen-day-tutor-staff-summary" data-testid="kitchen-day-tutor-staff-session-count">
              {staffCountsLabel(selectedStaff)}
            </p>
          )}
          <StaffSessionWorkspace
            sessions={sortSessionsNewestFirst(selectedStaff.sessions)}
            activeTab={staffSessionTab}
            onTabChange={setStaffSessionTab}
            hashFor={hashFor}
            variant={variant}
          />
        </>
      ) : selectedActorId ? (
        <p className="chef-results-empty">That staff member was not found.</p>
      ) : sessions.length === 0 ? (
        <p className="chef-results-empty" data-testid="kitchen-day-tutor-empty">
          No completed student sessions yet.
        </p>
      ) : (
        <StaffOverview
          staff={filteredStaff}
          query={staffQuery}
          onQueryChange={setStaffQuery}
          hashFor={hashFor}
          variant={variant}
        />
      )}
    </div>
  );
}

function CountCell({
  value,
  label,
  tone,
}: {
  value: number;
  label: string;
  tone: 'needs' | 'awaiting' | 'reviewed' | 'plain';
}) {
  return (
    <span
      className={
        value > 0 && tone !== 'plain'
          ? `kitchen-day-tutor-count kitchen-day-tutor-count--${tone}`
          : 'kitchen-day-tutor-count'
      }
    >
      <span className="kitchen-day-tutor-count__value">{value}</span>{' '}
      <span className="kitchen-day-tutor-count__label">{label}</span>
    </span>
  );
}

function StaffOverview({
  staff,
  query,
  onQueryChange,
  hashFor,
  variant,
}: {
  staff: readonly KitchenSkillsTrainerStaffSummary[];
  query: string;
  onQueryChange: (value: string) => void;
  hashFor: TutorHashFor;
  variant: KitchenSkillsTrainerVariant;
}) {
  const combined = variant === 'combined';
  return (
    <div data-testid="kitchen-day-tutor-staff-list">
      <label className="kitchen-day-field kitchen-day-tutor-staff-search">
        Search staff
        <input
          className="kitchen-day-input"
          data-testid="kitchen-day-tutor-staff-search"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Name"
        />
      </label>
      <div
        className={
          combined
            ? 'kitchen-day-tutor-table-head kitchen-day-tutor-table-head--combined'
            : 'kitchen-day-tutor-table-head'
        }
        aria-hidden="true"
      >
        <span>Staff</span>
        <span>Sessions</span>
        <span>To assess</span>
        {combined ? <span>Submitted</span> : (
          <>
            <span>Awaiting</span>
            <span>Reviewed</span>
          </>
        )}
      </div>
      {staff.length === 0 ? (
        <p className="chef-results-empty">No staff match that name.</p>
      ) : (
        <ul className="kitchen-day-tutor-rows">
          {staff.map((item) => {
            const submittedCount =
              item.sessionsAwaitingConfirmation + item.sessionsReviewed;
            return (
              <li key={item.actorId}>
                <a
                  href={hashFor({ actorId: item.actorId })}
                  data-testid={`kitchen-day-tutor-staff-${item.actorId}`}
                  className={
                    item.sessionsNeedingAssessment > 0
                      ? `kitchen-day-tutor-row kitchen-day-tutor-row--staff kitchen-day-tutor-row--needs${combined ? ' kitchen-day-tutor-row--combined' : ''}`
                      : `kitchen-day-tutor-row kitchen-day-tutor-row--staff${combined ? ' kitchen-day-tutor-row--combined' : ''}`
                  }
                  aria-label={`${item.actorName}: ${staffCountsLabel(item, variant)}`}
                >
                  <span className="kitchen-day-tutor-row__name">{item.actorName}</span>
                  <CountCell
                    value={item.sessionCount}
                    label={item.sessionCount === 1 ? 'session' : 'sessions'}
                    tone="plain"
                  />
                  <CountCell value={item.sessionsNeedingAssessment} label="to assess" tone="needs" />
                  {combined ? (
                    <CountCell value={submittedCount} label="submitted" tone="reviewed" />
                  ) : (
                    <>
                      <CountCell
                        value={item.sessionsAwaitingConfirmation}
                        label="awaiting"
                        tone="awaiting"
                      />
                      <CountCell value={item.sessionsReviewed} label="reviewed" tone="reviewed" />
                    </>
                  )}
                  <span className="kitchen-day-tutor-row__chevron" aria-hidden="true">
                    →
                  </span>
                </a>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

const LEGACY_SESSION_TABS: { id: LegacyStaffSessionTab; label: string; empty: string }[] = [
  { id: 'needs', label: 'To assess', empty: 'No sessions need assessment.' },
  {
    id: 'awaiting',
    label: 'Awaiting confirmation',
    empty: 'No sessions are waiting for GameBus confirmation.',
  },
  { id: 'reviewed', label: 'Reviewed', empty: 'No fully reviewed sessions yet.' },
];

const COMBINED_SESSION_TABS: { id: CombinedStaffSessionTab; label: string; empty: string }[] = [
  { id: 'needs', label: 'To assess', empty: 'No sessions need assessment.' },
  { id: 'submitted', label: 'Submitted', empty: 'No submitted sessions yet.' },
];

function StaffSessionWorkspace({
  sessions,
  activeTab,
  onTabChange,
  hashFor,
  variant,
}: {
  sessions: readonly KitchenSkillsTrainerSession[];
  /** Null until the tutor picks one: open the first tab that has sessions. */
  activeTab: StaffSessionTab | null;
  onTabChange: (tab: StaffSessionTab) => void;
  hashFor: TutorHashFor;
  variant: KitchenSkillsTrainerVariant;
}) {
  const partition = partitionTrainerSessionsByAssessment(sessions);
  const combined = variant === 'combined';
  const tabs = combined ? COMBINED_SESSION_TABS : LEGACY_SESSION_TABS;
  const byTab: Record<StaffSessionTab, KitchenSkillsTrainerSession[]> = {
    needs: partition.needsAssessment,
    awaiting: partition.awaitingConfirmation,
    reviewed: partition.reviewed,
    submitted: [...partition.awaitingConfirmation, ...partition.reviewed],
  };
  const fallbackTab = tabs.find((item) => byTab[item.id].length > 0)?.id ?? 'needs';
  const tab =
    activeTab && tabs.some((item) => item.id === activeTab) ? activeTab : fallbackTab;
  const visible = byTab[tab];

  return (
    <div data-testid="kitchen-day-tutor-staff-sessions">
      <div
        className="kitchen-day-tutor-session-tabs"
        role="tablist"
        aria-label="Session assessment status"
        data-testid="kitchen-day-tutor-session-tabs"
      >
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            className={
              tab === item.id
                ? 'kitchen-day-tutor-session-tabs__tab kitchen-day-tutor-session-tabs__tab--active'
                : 'kitchen-day-tutor-session-tabs__tab'
            }
            aria-selected={tab === item.id}
            data-testid={`kitchen-day-tutor-session-tab-${item.id}`}
            onClick={() => onTabChange(item.id)}
          >
            {combined ? item.label : `${item.label} (${byTab[item.id].length})`}
          </button>
        ))}
      </div>

      <div role="tabpanel" data-testid={`kitchen-day-tutor-sessions-${tab}`}>
        {visible.length === 0 ? (
          <p className="chef-results-empty">{tabs.find((item) => item.id === tab)?.empty}</p>
        ) : (
          <ul className="kitchen-day-tutor-rows">
            {visible.map((item) => (
              <li key={`${item.actorId}:${item.sessionId}`}>
                <SessionRow session={item} hashFor={hashFor} variant={variant} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function SessionRow({
  session,
  hashFor,
  variant,
}: {
  session: KitchenSkillsTrainerSession;
  hashFor: TutorHashFor;
  variant: KitchenSkillsTrainerVariant;
}) {
  const status = sessionAssessmentStatus(session);
  const counts = sessionAssessmentCounts(session);
  const earliest = earliestSubmittedAt(session);
  const recipeIds = listSessionRecipeIds(session);
  const recipeCount = recipeIds.length;
  const recipeLabel =
    recipeCount === 1
      ? recipeDisplayName(session, recipeIds[0]!)
      : recipeCount > 0
        ? plural(recipeCount, 'recipe')
        : 'No recipe id';
  const modules = sessionRecordedModuleLabels(session);
  const combined = variant === 'combined';
  return (
    <a
      href={hashFor({ actorId: session.actorId, sessionId: session.sessionId })}
      data-testid={`kitchen-day-chef-session-${session.sessionId}`}
      className={
        combined
          ? 'kitchen-day-tutor-row kitchen-day-tutor-row--session kitchen-day-tutor-row--session-combined'
          : 'kitchen-day-tutor-row kitchen-day-tutor-row--session'
      }
    >
      <span className="kitchen-day-tutor-row__when">
        <span className="kitchen-day-tutor-row__date">{formatSessionDate(session.sessionDate)}</span>
        {earliest ? <span className="kitchen-day-tutor-row__time">{formatOperationalTime(earliest)}</span> : null}
      </span>
      <span className="kitchen-day-tutor-row__what">
        <span>{recipeLabel}</span>
        <span className="kitchen-day-tutor-row__modules">{modules.join(' · ')}</span>
      </span>
      {combined ? null : (
        <span
          className="kitchen-day-tutor-row__counts"
          data-testid={`kitchen-day-tutor-session-counts-${session.sessionId}`}
        >
          {counts.confirmed} confirmed · {counts.awaiting} awaiting · {counts.outstanding} to assess
        </span>
      )}
      <TrainerStatusChip
        state={status}
        testId={`kitchen-day-tutor-session-status-${session.sessionId}`}
        label={combined ? combinedSessionListLabel(status) : undefined}
      />
      <span className="kitchen-day-tutor-row__open">
        Open session →
      </span>
    </a>
  );
}

export function KitchenSkillsTrainerApp({
  variant = 'per-module',
}: {
  variant?: KitchenSkillsTrainerVariant;
} = {}) {
  const hashFor = variant === 'combined' ? kitchenDayTutorCombinedHashFor : kitchenDayTutorHashFor;
  return (
    <KitchenSkillsSessionProvider>
      <KitchenSkillsTrainerBody variant={variant} hashFor={hashFor} />
    </KitchenSkillsSessionProvider>
  );
}

export function KitchenSkillsCombinedTrainerApp() {
  return <KitchenSkillsTrainerApp variant="combined" />;
}
