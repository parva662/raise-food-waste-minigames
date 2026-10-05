import { useEffect, useMemo, useState } from 'react';
import {
  KitchenSkillsSessionProvider,
  useKitchenSkillsSession,
} from '@/products/kitchen-skills-challenge/domain/session/KitchenSkillsSessionContext';
import { formatSessionDate } from '@/products/kitchen-skills-challenge/format';
import {
  buildKitchenSkillsTrainerStaffSummaries,
  findKitchenSkillsTrainerSession,
} from '@/products/kitchen-skills-challenge/read/trainerSessions';
import type { KitchenSkillsTrainerSession } from '@/products/kitchen-skills-challenge/domain/types';
import { KitchenSkillsTrainerSessionDetail } from '@/products/kitchen-skills-challenge/surfaces/trainer/KitchenSkillsTrainerSessionDetail';
import { postKitchenSkillsChallengeExit } from '@/products/kitchen-skills-challenge/gamebus/postExit';
import {
  kitchenDayTutorHashFor,
  parseKitchenDaySelectedActorId,
  parseKitchenDaySelectedSessionId,
} from '@/app/routes';
import { addDaysToIsoDate, formatOperationalTime, getOperationalDateIso } from '@/shared/time/dates';

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

function KitchenSkillsTrainerBody() {
  const { session, groupSessions } = useKitchenSkillsSession();
  const sessions = groupSessions;
  const [selectedSessionId, setSelectedSessionId] = useState(() => parseKitchenDaySelectedSessionId());
  const [selectedActorId, setSelectedActorId] = useState(() => parseKitchenDaySelectedActorId());
  const [staffQuery, setStaffQuery] = useState('');
  const [reviewDraftDirty, setReviewDraftDirty] = useState(false);

  useEffect(() => {
    const sync = () => {
      setSelectedSessionId(parseKitchenDaySelectedSessionId());
      setSelectedActorId(parseKitchenDaySelectedActorId());
      setReviewDraftDirty(false);
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
      <div className="kitchen-mgmt-page" data-testid="kitchen-day-tutor-initializing">
        <h1 className="kitchen-mgmt-header__title">Kitchen Skills Challenge Trainer</h1>
        <p className="kitchen-mgmt-header__lead">Getting the tutor workspace ready.</p>
      </div>
    );
  }

  const recentCutoff = addDaysToIsoDate(getOperationalDateIso(), -6);

  return (
    <div className="chef-results-page kitchen-mgmt-page" data-testid="kitchen-day-tutor-page">
      <header className="kitchen-mgmt-header">
        <div className="kitchen-mgmt-header__main">
          <h1 className="kitchen-mgmt-header__title">Kitchen Skills Challenge Trainer</h1>
          <p className="kitchen-mgmt-header__lead">
            Review student Kitchen Skills Challenge evidence by module, then add a qualitative assessment.
          </p>
        </div>
        <div className="kitchen-mgmt-header__actions">
          <button
            type="button"
            className="kitchen-day-button kitchen-day-button--secondary"
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
          <h2 className="kitchen-mgmt-module-title">{selectedStaff.actorName}</h2>
          <p className="chef-results-empty" data-testid="kitchen-day-tutor-staff-session-count">
            {selectedStaff.sessionCount} session{selectedStaff.sessionCount === 1 ? '' : 's'}
            {selectedStaff.modulesAwaitingAssessment > 0
              ? ` · ${selectedStaff.modulesAwaitingAssessment} awaiting assessment`
              : ''}
          </p>
          <StaffSessionGroups
            sessions={sortSessionsNewestFirst(selectedStaff.sessions)}
            recentCutoff={recentCutoff}
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
            {filteredStaff.map((staff) => (
              <li key={staff.actorId}>
                <a
                  href={kitchenDayTutorHashFor({ actorId: staff.actorId })}
                  data-testid={`kitchen-day-tutor-staff-${staff.actorId}`}
                >
                  <span className="kitchen-day-staff-list__name">{staff.actorName}</span>
                  <span className="kitchen-day-staff-list__meta">
                    {staff.sessionCount} session{staff.sessionCount === 1 ? '' : 's'}
                    {staff.modulesAwaitingAssessment > 0
                      ? ` · ${staff.modulesAwaitingAssessment} awaiting`
                      : ''}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function StaffSessionGroups({
  sessions,
  recentCutoff,
}: {
  sessions: readonly KitchenSkillsTrainerSession[];
  recentCutoff: string;
}) {
  const recent = sessions.filter((session) => session.sessionDate >= recentCutoff);
  const earlier = sessions.filter((session) => session.sessionDate < recentCutoff);
  const dateCounts = sessions.reduce<Record<string, number>>((counts, session) => {
    counts[session.sessionDate] = (counts[session.sessionDate] ?? 0) + 1;
    return counts;
  }, {});

  const renderSession = (item: KitchenSkillsTrainerSession) => {
    const earliest = earliestSubmittedAt(item);
    const showTime = (dateCounts[item.sessionDate] ?? 0) > 1 && earliest;
    return (
      <li key={`${item.actorId}:${item.sessionId}`}>
        <a
          href={kitchenDayTutorHashFor({ actorId: item.actorId, sessionId: item.sessionId })}
          data-testid={`kitchen-day-chef-session-${item.sessionId}`}
        >
          {formatSessionDate(item.sessionDate)}
          {showTime ? ` · ${formatOperationalTime(earliest)}` : ''}
        </a>
      </li>
    );
  };

  return (
    <div data-testid="kitchen-day-tutor-staff-sessions">
      {recent.length > 0 ? (
        <section data-testid="kitchen-day-tutor-sessions-recent">
          <h3 className="kitchen-day-tutor-session-group__title">Recent</h3>
          <ul className="kitchen-day-session-list">{recent.map(renderSession)}</ul>
        </section>
      ) : null}
      {earlier.length > 0 ? (
        <section data-testid="kitchen-day-tutor-sessions-earlier">
          <h3 className="kitchen-day-tutor-session-group__title">Earlier</h3>
          <ul className="kitchen-day-session-list">{earlier.map(renderSession)}</ul>
        </section>
      ) : null}
      {recent.length === 0 && earlier.length === 0 ? (
        <p className="chef-results-empty">No sessions for this staff member.</p>
      ) : null}
    </div>
  );
}

export function KitchenSkillsTrainerApp() {
  return (
    <KitchenSkillsSessionProvider>
      <KitchenSkillsTrainerBody />
    </KitchenSkillsSessionProvider>
  );
}
