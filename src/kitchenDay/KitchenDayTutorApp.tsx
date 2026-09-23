import { useEffect, useMemo, useState } from 'react';
import '../styles.css';
import { KitchenDayChefReviewForm } from './KitchenDayChefReviewForm';
import { KitchenDaySessionProvider, useKitchenDaySession } from './KitchenDaySessionContext';
import { SessionEvidence } from './SessionEvidence';
import { formatSessionDate } from './format';
import { findKitchenDayChefSession } from './read/chefSessions';
import {
  kitchenDayTutorHashFor,
  parseKitchenDaySelectedSessionId,
} from './routes';
function KitchenDayTutorBody() {
  const { session, findReviewBySessionId, groupSessions } = useKitchenDaySession();
  const sessions = groupSessions;
  const [selectedSessionId, setSelectedSessionId] = useState(() => parseKitchenDaySelectedSessionId());

  useEffect(() => {
    const sync = () => setSelectedSessionId(parseKitchenDaySelectedSessionId());
    window.addEventListener('hashchange', sync);
    return () => window.removeEventListener('hashchange', sync);
  }, []);

  const listed = useMemo(
    () =>
      sessions.map((item) => ({
        ...item,
        review: item.review ?? findReviewBySessionId(item.sessionId) ?? null,
      })),
    [findReviewBySessionId, sessions],
  );
  const selected = findKitchenDayChefSession(listed, selectedSessionId);

  if (!session) {
    return (
      <div className="kitchen-mgmt-page" data-testid="kitchen-day-tutor-initializing">
        <h1 className="kitchen-mgmt-header__title">Kitchen Day tutor</h1>
        <p className="kitchen-mgmt-header__lead">Getting the tutor workspace ready.</p>
      </div>
    );
  }

  return (
    <div className="chef-results-page kitchen-mgmt-page" data-testid="kitchen-day-tutor-page">
      <header className="kitchen-mgmt-header">
        <div className="kitchen-mgmt-header__main">
          <h1 className="kitchen-mgmt-header__title">Kitchen Day tutor</h1>
          <p className="kitchen-mgmt-header__lead">
            Review student Kitchen Day evidence, then add one qualitative assessment.
          </p>
        </div>
      </header>

      {listed.length === 0 ? (
        <p className="chef-results-empty" data-testid="kitchen-day-tutor-empty">
          No completed student sessions yet.
        </p>
      ) : (
        <ul className="kitchen-day-session-list" data-testid="kitchen-day-chef-session-list">
          {listed.map((item) => (
            <li key={`${item.actorId}:${item.sessionId}`}>
              <a
                href={kitchenDayTutorHashFor(item.sessionId)}
                data-testid={`kitchen-day-chef-session-${item.sessionId}`}
              >
                {item.actorName} · {formatSessionDate(item.sessionDate)}
              </a>
            </li>
          ))}
        </ul>
      )}

      {selected ? (
        <div data-testid="kitchen-day-chef-selected">
          <h2 className="kitchen-mgmt-module-title">
            {selected.actorName} · {formatSessionDate(selected.sessionDate)}
          </h2>
          <p className="chef-results-empty" data-testid="kitchen-day-chef-readonly">
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
        <p className="chef-results-empty">That student session was not found.</p>
      ) : (
        <p className="chef-results-empty">Open a student session to inspect the day.</p>
      )}
    </div>
  );
}

export function KitchenDayTutorApp() {
  return (
    <KitchenDaySessionProvider>
      <KitchenDayTutorBody />
    </KitchenDaySessionProvider>
  );
}
