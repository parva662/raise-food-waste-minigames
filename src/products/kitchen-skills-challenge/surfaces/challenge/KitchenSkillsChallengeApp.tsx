import { useEffect, useState } from 'react';
import { KitchenSkillsNav } from '@/products/kitchen-skills-challenge/surfaces/challenge/KitchenSkillsNav';
import { KitchenSkillsSessionProvider, useKitchenSkillsSession } from '@/products/kitchen-skills-challenge/domain/session/KitchenSkillsSessionContext';
import { KitchenSkillsPortionView } from '@/products/kitchen-skills-challenge/surfaces/challenge/PortionView';
import { KitchenSkillsReuseView } from '@/products/kitchen-skills-challenge/surfaces/challenge/ReuseView';
import { goToKitchenDaySection, parseKitchenDaySection } from '@/app/routes';
import { isKitchenSkillsNavEnabled } from '@/products/kitchen-skills-challenge/domain/session/challengeGate';
import { SessionReviewView } from '@/products/kitchen-skills-challenge/surfaces/challenge/SessionReviewView';
import { KitchenSkillsTrimView } from '@/products/kitchen-skills-challenge/surfaces/challenge/TrimView';
import { KitchenSkillsFinishSummary } from '@/products/kitchen-skills-challenge/surfaces/challenge/KitchenSkillsFinishSummary';
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
  const { session, showFinishSummary, taskProgress, requiredSection, reviewAllowed } =
    useKitchenSkillsSession();
  const [section, setSection] = useState(() => parseKitchenDaySection());

  useEffect(() => {
    const sync = () => setSection(parseKitchenDaySection());
    window.addEventListener('hashchange', sync);
    return () => window.removeEventListener('hashchange', sync);
  }, []);

  useEffect(() => {
    if (section === 'review') {
      if (!reviewAllowed) goToKitchenDaySection(requiredSection);
      return;
    }
    if (!isKitchenSkillsNavEnabled(section, taskProgress)) {
      goToKitchenDaySection(requiredSection);
    }
  }, [section, requiredSection, reviewAllowed, taskProgress]);

  if (!session) return <KitchenSkillsInitializing />;

  const visibleSection =
    section === 'review'
      ? reviewAllowed
        ? 'review'
        : requiredSection
      : isKitchenSkillsNavEnabled(section, taskProgress)
        ? section
        : requiredSection;

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
      <KitchenSkillsNav section={visibleSection} progress={taskProgress} />
      {visibleSection === 'trim' ? <KitchenSkillsTrimView /> : null}
      {visibleSection === 'reuse' ? <KitchenSkillsReuseView /> : null}
      {visibleSection === 'portion' ? <KitchenSkillsPortionView /> : null}
      {visibleSection === 'review' ? <SessionReviewView /> : null}
      {reviewAllowed && visibleSection !== 'review' ? (
        <a className="kitchen-day-review-link" href="#/kitchen-day/review" data-testid="kitchen-day-nav-review">
          Session review
        </a>
      ) : null}
      {showFinishSummary ? <KitchenSkillsFinishSummary /> : null}
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
