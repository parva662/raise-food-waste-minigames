import { useEffect, useState } from 'react';
import { KitchenSkillsNav } from '@/products/kitchen-skills-challenge/surfaces/challenge/KitchenSkillsNav';
import { KitchenSkillsSessionProvider, useKitchenSkillsSession } from '@/products/kitchen-skills-challenge/domain/session/KitchenSkillsSessionContext';
import { KitchenSkillsPortionView } from '@/products/kitchen-skills-challenge/surfaces/challenge/PortionView';
import { KitchenSkillsReuseView } from '@/products/kitchen-skills-challenge/surfaces/challenge/ReuseView';
import { parseKitchenDaySection } from '@/app/routes';
import { SessionReviewView } from '@/products/kitchen-skills-challenge/surfaces/challenge/SessionReviewView';
import { KitchenSkillsTrimView } from '@/products/kitchen-skills-challenge/surfaces/challenge/TrimView';
import {
  KitchenSkillsFinishActions,
  KitchenSkillsFinishSummary,
} from '@/products/kitchen-skills-challenge/surfaces/challenge/KitchenSkillsFinishSummary';
import { formatSessionDate } from '@/products/kitchen-skills-challenge/format';

function KitchenSkillsInitializing() {
  return (
    <div className="kitchen-mgmt-page kitchen-day-activity" data-testid="kitchen-day-initializing">
      <header className="kitchen-mgmt-header">
        <div className="kitchen-mgmt-header__main">
          <h1 className="kitchen-mgmt-header__title">Kitchen Skills Challenge</h1>
          <p className="kitchen-mgmt-header__lead">Getting your kitchen session ready.</p>
        </div>
      </header>
    </div>
  );
}

function KitchenSkillsBody() {
  const { session, showFinishSummary, rescueEntries } = useKitchenSkillsSession();
  const [section, setSection] = useState(() => parseKitchenDaySection());

  useEffect(() => {
    const sync = () => setSection(parseKitchenDaySection());
    window.addEventListener('hashchange', sync);
    return () => window.removeEventListener('hashchange', sync);
  }, []);

  if (!session) return <KitchenSkillsInitializing />;

  return (
    <div className="kitchen-mgmt-page kitchen-day-activity" data-testid="kitchen-day-page">
      <header className="kitchen-mgmt-header">
        <div className="kitchen-mgmt-header__main">
          <p className="game-status-header__eyebrow">Practical kitchen</p>
          <h1 className="kitchen-mgmt-header__title">Kitchen Skills Challenge</h1>
          <p className="kitchen-mgmt-header__lead" data-testid="kitchen-day-header-session">
            {formatSessionDate(session.sessionDate)}
          </p>
        </div>
      </header>
      <KitchenSkillsNav section={section} />
      {section === 'trim' ? <KitchenSkillsTrimView /> : null}
      {section === 'reuse' ? <KitchenSkillsReuseView /> : null}
      {section === 'portion' ? <KitchenSkillsPortionView /> : null}
      {section === 'review' ? <SessionReviewView /> : null}
      {section !== 'review' ? (
        <a className="kitchen-day-review-link" href="#/kitchen-day/review" data-testid="kitchen-day-nav-review">
          Session review
        </a>
      ) : null}
      {showFinishSummary ? <KitchenSkillsFinishSummary /> : null}
      {!showFinishSummary && rescueEntries.length > 0 && section !== 'review' ? (
        <div
          className="kitchen-day-form-actions kitchen-day-form-actions--sticky"
          data-testid="kitchen-day-finish-bar"
        >
          <KitchenSkillsFinishActions
            finishTestId="kitchen-day-finish-challenge"
            addMoreTestId="kitchen-day-finish-add-more-ingredients"
          />
        </div>
      ) : null}
    </div>
  );
}

function KitchenSkillsGate() {
  const { status } = useKitchenSkillsSession();
  if (status === 'initializing') {
    return <KitchenSkillsInitializing />;
  }
  return <KitchenSkillsBody />;
}

export function KitchenSkillsChallengeApp({ now }: { now?: Date } = {}) {
  return (
    <KitchenSkillsSessionProvider now={now}>
      <KitchenSkillsGate />
    </KitchenSkillsSessionProvider>
  );
}
