import { useEffect, useMemo, useState } from 'react';
import {
  KitchenSkillsSessionProvider,
  useKitchenSkillsSession,
} from '@/products/kitchen-skills-challenge/domain/session/KitchenSkillsSessionContext';
import { formatSessionDate } from '@/products/kitchen-skills-challenge/format';
import {
  buildKitchenSkillsTrainerStaffSummaries,
  findKitchenSkillsTrainerSession,
  findModuleReview,
  partitionTrainerSessionsByAssessment,
  sessionAssessmentStatus,
  sessionPendingStatusPhrases,
  sessionReviewedScorePhrases,
} from '@/products/kitchen-skills-challenge/read/trainerSessions';
import type { KitchenSkillsTrainerSession } from '@/products/kitchen-skills-challenge/domain/types';
import { KITCHEN_SKILLS_REVIEWED_MODULES } from '@/products/kitchen-skills-challenge/domain/types';
import { KitchenSkillsTrainerSessionDetail } from '@/products/kitchen-skills-challenge/surfaces/trainer/KitchenSkillsTrainerSessionDetail';
import { postKitchenSkillsChallengeExit } from '@/products/kitchen-skills-challenge/gamebus/postExit';
import {
  kitchenDayTutorHashFor,
  parseKitchenDaySelectedActorId,
  parseKitchenDaySelectedSessionId,
} from '@/app/routes';
import { formatOperationalTime } from '@/shared/time/dates';

type StaffSessionTab = 'needs' | 'reviewed';

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

function assessmentStatusLabel(status: ReturnType<typeof sessionAssessmentStatus>): string {
  switch (status) {
    case 'reviewed':
      return 'Reviewed';
    case 'partially_reviewed':
      return 'Partially reviewed';
    case 'needs_assessment':
      return 'Needs assessment';
  }
}

function pendingSessionSummary(session: KitchenSkillsTrainerSession): string {
  const earliest = earliestSubmittedAt(session);
  const dateLabel = formatSessionDate(session.sessionDate);
  const timeLabel = earliest ? ` · ${formatOperationalTime(earliest)}` : '';
  return [dateLabel + timeLabel, ...sessionPendingStatusPhrases(session)].join(' · ');
}

function feedbackPreview(session: KitchenSkillsTrainerSession): string | null {
  for (const module of KITCHEN_SKILLS_REVIEWED_MODULES) {
    const feedback = findModuleReview(session, module)?.chefFeedback?.trim();
    if (feedback) {
      return feedback.length > 72 ? `${feedback.slice(0, 72).trimEnd()}…` : feedback;
    }
  }
  return null;
}

function KitchenSkillsTrainerBody() {
  const { session, groupSessions } = useKitchenSkillsSession();
  const sessions = groupSessions;
  const [selectedSessionId, setSelectedSessionId] = useState(() => parseKitchenDaySelectedSessionId());
  const [selectedActorId, setSelectedActorId] = useState(() => parseKitchenDaySelectedActorId());
  const [staffQuery, setStaffQuery] = useState('');
  const [reviewDraftDirty, setReviewDraftDirty] = useState(false);
  const [staffSessionTab, setStaffSessionTab] = useState<StaffSessionTab>('needs');

  useEffect(() => {
    const sync = () => {
      setSelectedSessionId(parseKitchenDaySelectedSessionId());
      setSelectedActorId(parseKitchenDaySelectedActorId());
      setReviewDraftDirty(false);
      setStaffSessionTab('needs');
    };
    window.addEventListener('hashchange', sync);
    return () => window.removeEventListener('hashchange', sync);
  }, []);

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
    if (reviewDraftDirty) {
      const leave = window.confirm(
        'You have an unsaved tutor assessment draft. Close without submitting?',
      );
      if (!leave) return;
    }
    postKitchenSkillsChallengeExit();
  };

  if (!session) {
    return (
      <div className="chef-results-page kitchen-mgmt-page kitchen-day-tutor-page" data-testid="kitchen-day-tutor-initializing">
        <header className="kitchen-day-tutor-header kitchen-day-tutor-header--sticky">
          <div className="kitchen-day-tutor-header__main">
            <h1 className="kitchen-day-tutor-header__title">Kitchen Skills Trainer</h1>
            <p className="kitchen-day-tutor-header__lead">Getting the tutor workspace ready.</p>
          </div>
        </header>
      </div>
    );
  }

  return (
    <div className="chef-results-page kitchen-mgmt-page kitchen-day-tutor-page" data-testid="kitchen-day-tutor-page">
      <header className="kitchen-day-tutor-header kitchen-day-tutor-header--sticky" data-testid="kitchen-day-tutor-header">
        <div className="kitchen-day-tutor-header__main">
          <h1 className="kitchen-day-tutor-header__title">Kitchen Skills Trainer</h1>
          <p className="kitchen-day-tutor-header__lead">
            Review student evidence by module, then add a tutor assessment.
          </p>
        </div>
        <div className="kitchen-day-tutor-header__actions">
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
        <>
          <p className="kitchen-day-tutor-back">
            <a
              href={kitchenDayTutorHashFor({ actorId: selected.actorId })}
              data-testid="kitchen-day-tutor-back-staff"
            >
              ← Back to {selected.actorName}
            </a>
          </p>
          <KitchenSkillsTrainerSessionDetail
            key={`${selected.actorId}:${selected.sessionId}`}
            selected={selected}
            onDraftChange={setReviewDraftDirty}
          />
        </>
      ) : selectedSessionId ? (
        <p className="chef-results-empty">That student session was not found.</p>
      ) : selectedActorId && selectedStaff ? (
        <>
          <p className="kitchen-day-tutor-back">
            <a href={kitchenDayTutorHashFor()} data-testid="kitchen-day-tutor-back-staff-list">
              ← Back to staff
            </a>
          </p>
          <div className="kitchen-day-tutor-staff-heading">
            <h2 className="kitchen-day-tutor-staff-heading__title">{selectedStaff.actorName}</h2>
            <p className="kitchen-day-tutor-staff-heading__meta" data-testid="kitchen-day-tutor-staff-session-count">
              {selectedStaff.sessionCount} session{selectedStaff.sessionCount === 1 ? '' : 's'}
              {selectedStaff.modulesAwaitingAssessment > 0
                ? ` · ${selectedStaff.modulesAwaitingAssessment} awaiting assessment`
                : ''}
            </p>
          </div>
          <StaffSessionWorkspace
            sessions={sortSessionsNewestFirst(selectedStaff.sessions)}
            activeTab={staffSessionTab}
            onTabChange={setStaffSessionTab}
          />
        </>
      ) : selectedActorId ? (
        <p className="chef-results-empty">That staff member was not found.</p>
      ) : sessions.length === 0 ? (
        <p className="chef-results-empty" data-testid="kitchen-day-tutor-empty">
          No completed student sessions yet.
        </p>
      ) : (
        <div data-testid="kitchen-day-tutor-staff-list">
          <label className="kitchen-day-field kitchen-day-tutor-staff-search">
            Search staff
            <input
              className="kitchen-day-input"
              data-testid="kitchen-day-tutor-staff-search"
              value={staffQuery}
              onChange={(event) => setStaffQuery(event.target.value)}
              placeholder="Name"
            />
          </label>
          <ul className="kitchen-day-staff-list">
            {filteredStaff.map((staff) => {
              const awaiting = staff.modulesAwaitingAssessment;
              return (
                <li key={staff.actorId}>
                  <a
                    href={kitchenDayTutorHashFor({ actorId: staff.actorId })}
                    data-testid={`kitchen-day-tutor-staff-${staff.actorId}`}
                    className={
                      awaiting > 0
                        ? 'kitchen-day-staff-list__link kitchen-day-staff-list__link--needs'
                        : 'kitchen-day-staff-list__link'
                    }
                  >
                    <span className="kitchen-day-staff-list__name">{staff.actorName}</span>
                    <span className="kitchen-day-staff-list__meta">
                      {staff.sessionCount} session{staff.sessionCount === 1 ? '' : 's'}
                      {awaiting > 0 ? (
                        <span className="kitchen-day-tutor-status kitchen-day-tutor-status--needs">
                          {awaiting} awaiting
                        </span>
                      ) : (
                        <span className="kitchen-day-tutor-status kitchen-day-tutor-status--reviewed">
                          Reviewed
                        </span>
                      )}
                    </span>
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

function StaffSessionWorkspace({
  sessions,
  activeTab,
  onTabChange,
}: {
  sessions: readonly KitchenSkillsTrainerSession[];
  activeTab: StaffSessionTab;
  onTabChange: (tab: StaffSessionTab) => void;
}) {
  const { needsAssessment, reviewed } = partitionTrainerSessionsByAssessment(sessions);
  const visible = activeTab === 'needs' ? needsAssessment : reviewed;

  return (
    <div data-testid="kitchen-day-tutor-staff-sessions">
      <div
        className="kitchen-day-tutor-session-tabs"
        role="tablist"
        aria-label="Session assessment status"
        data-testid="kitchen-day-tutor-session-tabs"
      >
        <button
          type="button"
          role="tab"
          className={
            activeTab === 'needs'
              ? 'kitchen-day-tutor-session-tabs__tab kitchen-day-tutor-session-tabs__tab--active'
              : 'kitchen-day-tutor-session-tabs__tab'
          }
          aria-selected={activeTab === 'needs'}
          data-testid="kitchen-day-tutor-session-tab-needs"
          onClick={() => onTabChange('needs')}
        >
          Needs assessment ({needsAssessment.length})
        </button>
        <button
          type="button"
          role="tab"
          className={
            activeTab === 'reviewed'
              ? 'kitchen-day-tutor-session-tabs__tab kitchen-day-tutor-session-tabs__tab--active'
              : 'kitchen-day-tutor-session-tabs__tab'
          }
          aria-selected={activeTab === 'reviewed'}
          data-testid="kitchen-day-tutor-session-tab-reviewed"
          onClick={() => onTabChange('reviewed')}
        >
          Reviewed ({reviewed.length})
        </button>
      </div>

      <div
        role="tabpanel"
        data-testid={
          activeTab === 'needs'
            ? 'kitchen-day-tutor-sessions-needs'
            : 'kitchen-day-tutor-sessions-reviewed'
        }
      >
        {visible.length === 0 ? (
          <p className="chef-results-empty">
            {activeTab === 'needs'
              ? 'No sessions need assessment.'
              : 'No fully reviewed sessions yet.'}
          </p>
        ) : (
          <ul className="kitchen-day-session-list">
            {visible.map((item) => (
              <li key={`${item.actorId}:${item.sessionId}`}>
                {activeTab === 'needs' ? (
                  <PendingSessionCard session={item} />
                ) : (
                  <ReviewedSessionCard session={item} />
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function PendingSessionCard({ session }: { session: KitchenSkillsTrainerSession }) {
  const status = sessionAssessmentStatus(session);
  return (
    <a
      href={kitchenDayTutorHashFor({ actorId: session.actorId, sessionId: session.sessionId })}
      data-testid={`kitchen-day-chef-session-${session.sessionId}`}
      className="kitchen-day-tutor-session-card"
    >
      <span className="kitchen-day-tutor-session-card__row">
        <span className="kitchen-day-tutor-session-card__summary">{pendingSessionSummary(session)}</span>
        <span
          className={
            status === 'partially_reviewed'
              ? 'kitchen-day-tutor-status kitchen-day-tutor-status--partial'
              : 'kitchen-day-tutor-status kitchen-day-tutor-status--needs'
          }
          data-testid={`kitchen-day-tutor-session-status-${session.sessionId}`}
        >
          {assessmentStatusLabel(status)}
        </span>
      </span>
    </a>
  );
}

function ReviewedSessionCard({ session }: { session: KitchenSkillsTrainerSession }) {
  const moduleLines = sessionReviewedScorePhrases(session);
  const feedback = feedbackPreview(session);
  const earliest = earliestSubmittedAt(session);

  return (
    <a
      href={kitchenDayTutorHashFor({ actorId: session.actorId, sessionId: session.sessionId })}
      data-testid={`kitchen-day-chef-session-${session.sessionId}`}
      className="kitchen-day-tutor-session-card kitchen-day-tutor-session-card--reviewed"
    >
      <span className="kitchen-day-tutor-session-card__row">
        <span className="kitchen-day-tutor-session-card__date">
          {formatSessionDate(session.sessionDate)}
          {earliest ? ` · ${formatOperationalTime(earliest)}` : ''}
        </span>
        <span
          className="kitchen-day-tutor-status kitchen-day-tutor-status--reviewed"
          data-testid={`kitchen-day-tutor-session-status-${session.sessionId}`}
        >
          Reviewed
        </span>
      </span>
      <span className="kitchen-day-tutor-session-card__scores" data-testid={`kitchen-day-tutor-session-scores-${session.sessionId}`}>
        {moduleLines.join(' · ')}
      </span>
      {feedback ? (
        <span className="kitchen-day-tutor-session-card__feedback" data-testid={`kitchen-day-tutor-session-feedback-${session.sessionId}`}>
          {feedback}
        </span>
      ) : null}
    </a>
  );
}

export function KitchenSkillsTrainerApp() {
  return (
    <KitchenSkillsSessionProvider>
      <KitchenSkillsTrainerBody />
    </KitchenSkillsSessionProvider>
  );
}
