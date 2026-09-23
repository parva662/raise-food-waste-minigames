import { useMemo } from 'react';
import { getGameBusInputCollections } from '../gamebus/bridge';
import { extractGroupActivities, getRawKitchenGroupActivitiesInput } from '../gamebus/groupActivities';
import { useReadyKitchenDaySession } from './KitchenDaySessionContext';
import { KitchenDayChefReviewForm } from './KitchenDayChefReviewForm';
import { SessionEvidence } from './SessionEvidence';
import { buildKitchenDayChefSessions, findKitchenDayChefSession } from './read/chefSessions';
import { kitchenDayChefHashFor, parseKitchenDaySelectedSessionId } from './routes';
import type { KitchenDayChefSession } from './types';

function sessionsFromLocalAndGroup(local: KitchenDayChefSession | null): KitchenDayChefSession[] {
  const grouped = buildKitchenDayChefSessions(
    extractGroupActivities(getRawKitchenGroupActivitiesInput(getGameBusInputCollections())),
  );
  if (!local) return grouped;
  if (grouped.some((session) => session.sessionId === local.sessionId && session.actorId === local.actorId)) {
    return grouped;
  }
  return [...grouped, local];
}

export function KitchenDayChefView({ selectedSessionId }: { selectedSessionId: string | null }) {
  const { session, trimEntries, rescueEntries, portionEntries, findReviewBySessionId } =
    useReadyKitchenDaySession();
  const sessions = useMemo(() => {
    const local: KitchenDayChefSession | null =
      trimEntries.length + rescueEntries.length + portionEntries.length > 0
        ? {
            actorId: 'local-student',
            actorName: 'This Kitchen Day',
            sessionId: session.sessionId,
            sessionDate: session.sessionDate,
            trimEntries,
            rescueEntries,
            portionEntries,
            review: findReviewBySessionId(session.sessionId) ?? null,
          }
        : null;
    return sessionsFromLocalAndGroup(local).map((item) => ({
      ...item,
      review: item.review ?? findReviewBySessionId(item.sessionId) ?? null,
    }));
  }, [
    findReviewBySessionId,
    portionEntries,
    rescueEntries,
    session.sessionDate,
    session.sessionId,
    trimEntries,
  ]);

  const selected = findKitchenDayChefSession(sessions, selectedSessionId);

  return (
    <section className="kd-card" data-testid="kitchen-day-chef">
      <h2 className="kd-card__title">Chef overview</h2>
      <p className="kd-card__copy">
        Student Kitchen Day sessions grouped by participant and session. Measurements are evidence only.
      </p>
      <p className="kd-helper" data-testid="kitchen-day-no-leaderboard">
        This overview is not a competitive leaderboard.
      </p>
      {sessions.length === 0 ? (
        <p className="kd-helper" data-testid="kitchen-day-chef-empty">
          No completed student sessions yet.
        </p>
      ) : (
        <ul className="kd-list" data-testid="kitchen-day-chef-session-list">
          {sessions.map((item) => (
            <li key={`${item.actorId}:${item.sessionId}`}>
              <a
                className="kd-nav__link"
                href={kitchenDayChefHashFor(item.sessionId)}
                data-testid={`kitchen-day-chef-session-${item.sessionId}`}
              >
                {item.actorName} · {item.sessionDate}
              </a>
              <span className="kd-helper">{item.sessionId}</span>
            </li>
          ))}
        </ul>
      )}

      {selected ? (
        <div data-testid="kitchen-day-chef-selected">
          <h3 className="kd-subtitle">
            {selected.actorName} · {selected.sessionDate}
          </h3>
          <p className="kd-helper" data-testid="kitchen-day-chef-readonly">
            Student measurements are read-only.
          </p>
          <SessionEvidence
            trimEntries={selected.trimEntries}
            rescueEntries={selected.rescueEntries}
            portionEntries={selected.portionEntries}
            testIdPrefix="kitchen-day-chef"
          />
          <KitchenDayChefReviewForm selected={selected} />
        </div>
      ) : selectedSessionId ? (
        <p className="kd-helper">That student session was not found.</p>
      ) : (
        <p className="kd-helper">Open a student session to inspect the day.</p>
      )}
    </section>
  );
}

export function kitchenDaySelectedSessionFromLocation(): string | null {
  return parseKitchenDaySelectedSessionId();
}
