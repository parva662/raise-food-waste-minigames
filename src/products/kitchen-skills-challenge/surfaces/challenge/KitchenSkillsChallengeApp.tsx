import { useEffect, useState } from 'react';
import { KitchenSkillsNav } from '@/products/kitchen-skills-challenge/surfaces/challenge/KitchenSkillsNav';
import { KitchenSkillsSessionProvider, useKitchenSkillsSession } from '@/products/kitchen-skills-challenge/domain/session/KitchenSkillsSessionContext';
import { KitchenSkillsPortionView } from '@/products/kitchen-skills-challenge/surfaces/challenge/PortionView';
import { KitchenSkillsReuseView } from '@/products/kitchen-skills-challenge/surfaces/challenge/ReuseView';
import { goToKitchenDaySection, parseKitchenDaySection } from '@/app/routes';
import {
  isKitchenSkillsNavEnabled,
  unsavedKitchenSkillsDraftMessage,
} from '@/products/kitchen-skills-challenge/domain/session/challengeGate';
import { SessionReviewView } from '@/products/kitchen-skills-challenge/surfaces/challenge/SessionReviewView';
import { KitchenSkillsTrimView } from '@/products/kitchen-skills-challenge/surfaces/challenge/TrimView';
import { KitchenSkillsFinishSummary } from '@/products/kitchen-skills-challenge/surfaces/challenge/KitchenSkillsFinishSummary';
import { formatSessionDate } from '@/products/kitchen-skills-challenge/format';
import { getKitchenSkillsSessionDate } from '@/products/kitchen-skills-challenge/domain/session/identity';

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

/** Ask before an unsaved Trim or Rescue measurement is abandoned. */
export function confirmLeavingKitchenSkillsDraft(message: string | null): boolean {
  if (!message) return true;
  return window.confirm(message);
}

function KitchenSkillsHeader({ sessionDate, recipeName }: { sessionDate: string; recipeName?: string }) {
  return (
    <header className="kitchen-mgmt-header">
      <div className="kitchen-mgmt-header__main">
        <p className="game-status-header__eyebrow">Practical kitchen</p>
        <h1 className="kitchen-mgmt-header__title">Kitchen Skills Challenge</h1>
        <p className="kitchen-mgmt-header__lead" data-testid="kitchen-day-header-session">
          {recipeName ? `${recipeName} · ` : ''}
          {formatSessionDate(sessionDate)}
        </p>
      </div>
    </header>
  );
}

function KitchenSkillsFinished({ sessionDate, recipeName }: { sessionDate: string; recipeName?: string }) {
  return (
    <div className="kitchen-mgmt-page kitchen-day-activity" data-testid="kitchen-day-page">
      <KitchenSkillsHeader sessionDate={sessionDate} recipeName={recipeName} />
      <section className="kitchen-day-card" data-testid="kitchen-day-finished">
        <h2 className="kitchen-day-card__title">Challenge finished</h2>
        <p className="kitchen-day-card__copy">
          You can close this window. Opening the challenge again starts a new attempt.
        </p>
      </section>
    </div>
  );
}

function KitchenSkillsBody() {
  const {
    session,
    showFinishSummary,
    taskProgress,
    requiredSection,
    reviewAllowed,
    canFinish,
    finished,
    closedElsewhere,
    resumed,
    activePortionEntry,
    openFinishSummary,
  } = useKitchenSkillsSession();
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
  if (finished) {
    return <KitchenSkillsFinished sessionDate={session.sessionDate} recipeName={activePortionEntry?.recipeName} />;
  }

  const visibleSection =
    section === 'review'
      ? reviewAllowed
        ? 'review'
        : requiredSection
      : isKitchenSkillsNavEnabled(section, taskProgress)
        ? section
        : requiredSection;
  const draftMessage = unsavedKitchenSkillsDraftMessage(taskProgress);
  const fromEarlierDate = session.sessionDate !== getKitchenSkillsSessionDate();

  return (
    <div className="kitchen-mgmt-page kitchen-day-activity" data-testid="kitchen-day-page">
      <KitchenSkillsHeader sessionDate={session.sessionDate} recipeName={activePortionEntry?.recipeName} />
      {closedElsewhere ? (
        <p className="kitchen-day-error" role="alert" data-testid="kitchen-day-closed-elsewhere">
          This challenge was finished or restarted in another window. Close this window and open
          the challenge again.
        </p>
      ) : null}
      {resumed && !closedElsewhere ? (
        <p className="kitchen-day-card__copy kitchen-day-resumed-note" data-testid="kitchen-day-resumed">
          {fromEarlierDate
            ? `Unfinished challenge from ${formatSessionDate(session.sessionDate)}. Finish it to start a new one.`
            : 'Continuing your unfinished challenge.'}
        </p>
      ) : null}
      <KitchenSkillsNav section={visibleSection} progress={taskProgress} draftMessage={draftMessage} />
      {visibleSection === 'trim' ? <KitchenSkillsTrimView /> : null}
      {visibleSection === 'reuse' ? <KitchenSkillsReuseView /> : null}
      {visibleSection === 'portion' ? <KitchenSkillsPortionView /> : null}
      {visibleSection === 'review' ? <SessionReviewView /> : null}
      {canFinish && !closedElsewhere ? (
        <div className="kitchen-day-finish-bar" data-testid="kitchen-day-finish-bar">
          {reviewAllowed && visibleSection !== 'review' ? (
            <a
              className="kitchen-day-review-link"
              href="#/kitchen-day/review"
              data-testid="kitchen-day-nav-review"
              onClick={(event) => {
                if (!confirmLeavingKitchenSkillsDraft(draftMessage)) event.preventDefault();
              }}
            >
              Session review
            </a>
          ) : null}
          <button
            type="button"
            className="kitchen-day-button kitchen-day-button--primary"
            data-testid="kitchen-day-open-finish-summary"
            onClick={() => {
              if (confirmLeavingKitchenSkillsDraft(draftMessage)) openFinishSummary();
            }}
          >
            Review and finish
          </button>
        </div>
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
    <KitchenSkillsSessionProvider now={now} trackAttempt>
      <KitchenSkillsGate />
    </KitchenSkillsSessionProvider>
  );
}
