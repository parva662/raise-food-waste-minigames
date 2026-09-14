import { useCallback, type KeyboardEvent, type ReactNode } from 'react';

export type ParticipantPrimaryTab = 'overview' | 'progress';

const TABS: { id: ParticipantPrimaryTab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'progress', label: 'Progress' },
];

interface ParticipantTabNavProps {
  activeTab: ParticipantPrimaryTab;
  onTabChange: (tab: ParticipantPrimaryTab) => void;
  children: (activeTab: ParticipantPrimaryTab) => ReactNode;
}

export function ParticipantTabNav({ activeTab, onTabChange, children }: ParticipantTabNavProps) {
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
    <div className="kitchen-mgmt-forecasting" data-testid="participant-forecasting">
      <h2 className="kitchen-mgmt-module-title">Forecasting</h2>

      <div
        className="kitchen-mgmt-primary-tabs"
        role="tablist"
        aria-label="Staff dashboard views"
        data-testid="participant-primary-tabs"
      >
        {TABS.map((tab, index) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            id={`participant-primary-tab-${tab.id}`}
            aria-selected={activeTab === tab.id}
            aria-controls={`participant-primary-panel-${tab.id}`}
            className={
              activeTab === tab.id
                ? 'kitchen-mgmt-primary-tabs__tab kitchen-mgmt-primary-tabs__tab--active'
                : 'kitchen-mgmt-primary-tabs__tab'
            }
            data-testid={`participant-primary-tab-${tab.id}`}
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
          id={`participant-primary-panel-${tab.id}`}
          aria-labelledby={`participant-primary-tab-${tab.id}`}
          hidden={activeTab !== tab.id}
          data-testid={`participant-primary-panel-${tab.id}`}
          className="kitchen-mgmt-primary-panel"
        >
          {activeTab === tab.id ? children(tab.id) : null}
        </div>
      ))}
    </div>
  );
}
