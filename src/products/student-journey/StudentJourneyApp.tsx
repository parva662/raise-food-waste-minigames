import { useState } from 'react';
import { JourneyOverviewSection } from '@/products/student-journey/components/JourneyOverviewSection';
import { JourneyProgressSection } from '@/products/student-journey/components/JourneyProgressSection';
import {
  JourneyTabNav,
  type StudentJourneyTab,
} from '@/products/student-journey/components/JourneyTabNav';
import { useStudentJourneyData } from '@/products/student-journey/read/useStudentJourneyData';

export function StudentJourneyApp() {
  const { embedded, ready, actorId, actorName, history, summary } = useStudentJourneyData();
  const [primaryTab, setPrimaryTab] = useState<StudentJourneyTab>('overview');

  return (
    <div className="kitchen-mgmt-page student-journey-page" data-testid="student-journey-page">
      <header className="student-journey-header" data-testid="student-journey-header">
        <p className="student-journey-header__eyebrow">Personal dashboard</p>
        <h1 className="student-journey-header__title">My Food Journey</h1>
        <p className="student-journey-header__lead">
          Follow your canteen lunch declarations over time. This page is read-only and never submits
          GameBus activities.
        </p>
      </header>

      {!ready ? (
        <p className="student-journey-loading" data-testid="student-journey-loading">
          Loading your journey…
        </p>
      ) : (
        <JourneyTabNav activeTab={primaryTab} onTabChange={setPrimaryTab}>
          {(tab) =>
            tab === 'overview' ? (
              <JourneyOverviewSection
                actorName={actorName}
                summary={summary}
                latestEntry={history[0] ?? null}
              />
            ) : (
              <JourneyProgressSection history={history} />
            )
          }
        </JourneyTabNav>
      )}

      {embedded && ready && !actorId ? (
        <p className="chef-results-empty" data-testid="student-journey-identity-missing">
          Your GameBus identity could not be confirmed from Input Collections. Personal history stays
          hidden until `inputCollectionPari.me` is available.
        </p>
      ) : null}
    </div>
  );
}

export default StudentJourneyApp;
