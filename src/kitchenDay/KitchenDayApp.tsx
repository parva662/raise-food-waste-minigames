import { useEffect, useState } from 'react';
import '../styles.css';
import { KitchenDayNav } from './KitchenDayNav';
import { KitchenDaySessionProvider, useKitchenDaySession } from './KitchenDaySessionContext';
import { KitchenDayPortionView } from './portion/KitchenDayPortionView';
import { KitchenDayRescueView } from './rescue/KitchenDayRescueView';
import { parseKitchenDaySection } from './routes';
import { SessionReviewView } from './SessionReviewView';
import { KitchenDayTrimView } from './trim/KitchenDayTrimView';
import { formatSessionDate } from './format';

function KitchenDayInitializing() {
  return (
    <div className="kitchen-mgmt-page kitchen-day-activity" data-testid="kitchen-day-initializing">
      <header className="kitchen-mgmt-header">
        <div className="kitchen-mgmt-header__main">
          <h1 className="kitchen-mgmt-header__title">Kitchen Day</h1>
          <p className="kitchen-mgmt-header__lead">Getting your kitchen session ready.</p>
        </div>
      </header>
    </div>
  );
}

function KitchenDayBody() {
  const { session } = useKitchenDaySession();
  if (!session) return <KitchenDayInitializing />;
  const [section, setSection] = useState(() => parseKitchenDaySection());

  useEffect(() => {
    const sync = () => setSection(parseKitchenDaySection());
    window.addEventListener('hashchange', sync);
    return () => window.removeEventListener('hashchange', sync);
  }, []);

  return (
    <div className="kitchen-mgmt-page kitchen-day-activity" data-testid="kitchen-day-page">
      <header className="kitchen-mgmt-header">
        <div className="kitchen-mgmt-header__main">
          <p className="game-status-header__eyebrow">Practical kitchen</p>
          <h1 className="kitchen-mgmt-header__title">Kitchen Day</h1>
          <p className="kitchen-mgmt-header__lead" data-testid="kitchen-day-header-session">
            {formatSessionDate(session.sessionDate)}
          </p>
        </div>
      </header>
      <KitchenDayNav section={section} />
      {section === 'trim' ? <KitchenDayTrimView /> : null}
      {section === 'reuse' ? <KitchenDayRescueView /> : null}
      {section === 'portion' ? <KitchenDayPortionView /> : null}
      {section === 'review' ? <SessionReviewView /> : null}
      {section !== 'review' ? (
        <a className="kitchen-day-review-link" href="#/kitchen-day/review" data-testid="kitchen-day-nav-review">
          Session review
        </a>
      ) : null}
    </div>
  );
}

function KitchenDayGate() {
  const { status } = useKitchenDaySession();
  if (status === 'initializing') {
    return <KitchenDayInitializing />;
  }
  return <KitchenDayBody />;
}

export function KitchenDayApp() {
  return (
    <KitchenDaySessionProvider>
      <KitchenDayGate />
    </KitchenDaySessionProvider>
  );
}
