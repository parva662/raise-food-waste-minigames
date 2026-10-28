import { useCallback, type KeyboardEvent, type ReactNode } from 'react';

export type StudentJourneyTab = 'overview' | 'progress';

const TABS: { id: StudentJourneyTab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'progress', label: 'My Progress' },
];

interface JourneyTabNavProps {
  activeTab: StudentJourneyTab;
  onTabChange: (tab: StudentJourneyTab) => void;
  children: (activeTab: StudentJourneyTab) => ReactNode;
}

export function JourneyTabNav({ activeTab, onTabChange, children }: JourneyTabNavProps) {
  const handleTabKeyDown = useCallback(
    (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        onTabChange(TABS[(index + 1) % TABS.length]!.id);
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        onTabChange(TABS[(index - 1 + TABS.length) % TABS.length]!.id);
      } else if (event.key === 'Home') {
        event.preventDefault();
        onTabChange(TABS[0]!.id);
      } else if (event.key === 'End') {
        event.preventDefault();
        onTabChange(TABS[TABS.length - 1]!.id);
      }
    },
    [onTabChange],
  );

  return (
    <div className="student-journey-tabs" data-testid="student-journey-tabs">
      <div
        className="kitchen-mgmt-primary-tabs"
        role="tablist"
        aria-label="My Food Journey views"
      >
        {TABS.map((tab, index) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            id={`student-journey-tab-${tab.id}`}
            aria-selected={activeTab === tab.id}
            aria-controls={`student-journey-panel-${tab.id}`}
            className={
              activeTab === tab.id
                ? 'kitchen-mgmt-primary-tabs__tab kitchen-mgmt-primary-tabs__tab--active'
                : 'kitchen-mgmt-primary-tabs__tab'
            }
            data-testid={`student-journey-tab-${tab.id}`}
            onClick={() => onTabChange(tab.id)}
            onKeyDown={(event) => handleTabKeyDown(event, index)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {TABS.map((tab) => (
        <div
          key={tab.id}
          role="tabpanel"
          id={`student-journey-panel-${tab.id}`}
          aria-labelledby={`student-journey-tab-${tab.id}`}
          hidden={activeTab !== tab.id}
          data-testid={`student-journey-panel-${tab.id}`}
          className="kitchen-mgmt-primary-panel"
        >
          {activeTab === tab.id ? children(tab.id) : null}
        </div>
      ))}
    </div>
  );
}
