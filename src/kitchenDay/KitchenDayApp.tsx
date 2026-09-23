import { useEffect, useState } from 'react';
import '../styles.css';
import { KitchenDayNav } from './KitchenDayNav';
import { KitchenDaySessionProvider, useKitchenDaySession } from './KitchenDaySessionContext';
import { MyDayView } from './MyDayView';
import { KitchenDayPortionView } from './portion/KitchenDayPortionView';
import { KitchenDayRescueView } from './rescue/KitchenDayRescueView';
import { parseKitchenDaySection } from './routes';
import { KitchenDayTrimView } from './trim/KitchenDayTrimView';
import { KITCHEN_DAY_LIVE_BLOCK_REASON, canPostKitchenDayToGameBus } from './liveIntegration';

function KitchenDayInitializing() {
  return (
    <div className="kd-page" data-testid="kitchen-day-initializing">
      <h1 className="kd-header__title">Kitchen Day</h1>
      <p className="kd-card__copy">
        Waiting for the GameBus task and authenticated participant before locking this session.
      </p>
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
    <div className="kd-page" data-testid="kitchen-day-page">
      <header className="kd-header">
        <p className="kd-header__eyebrow">Practical kitchen</p>
        <h1 className="kd-header__title">Kitchen Day</h1>
        <p className="kd-header__meta" data-testid="kitchen-day-header-session">
          {session.sessionDate} · one student session
        </p>
        {!canPostKitchenDayToGameBus() ? (
          <p className="kd-live-banner" data-testid="kitchen-day-live-blocked">
            {KITCHEN_DAY_LIVE_BLOCK_REASON}
          </p>
        ) : null}
      </header>
      <KitchenDayNav section={section} />
      {section === 'trim' ? <KitchenDayTrimView /> : null}
      {section === 'reuse' ? <KitchenDayRescueView /> : null}
      {section === 'portion' ? <KitchenDayPortionView /> : null}
      {section === 'my-day' ? <MyDayView /> : null}
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
