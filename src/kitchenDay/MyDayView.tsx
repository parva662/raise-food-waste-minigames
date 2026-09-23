import { SessionEvidence } from './SessionEvidence';
import { useReadyKitchenDaySession } from './KitchenDaySessionContext';

export function MyDayView() {
  const { session, trimEntries, rescueEntries, portionEntries } = useReadyKitchenDaySession();

  return (
    <section className="kd-card" data-testid="kitchen-day-overview">
      <h2 className="kd-card__title">My day</h2>
      <p className="kd-card__copy">
        Read-only record of this kitchen session. Submitted measurements cannot be edited here.
      </p>
      <dl className="kd-meta" data-testid="kitchen-day-session-meta">
        <div>
          <dt>Session date</dt>
          <dd>{session.sessionDate}</dd>
        </div>
        <div>
          <dt>Session id</dt>
          <dd>{session.sessionId}</dd>
        </div>
      </dl>
      <SessionEvidence
        trimEntries={trimEntries}
        rescueEntries={rescueEntries}
        portionEntries={portionEntries}
      />
    </section>
  );
}
