import { useCallback, type KeyboardEvent, type ReactNode } from 'react';

export type ManagementPrimaryTab = 'overview' | 'staff' | 'trends' | 'history';

const TABS: { id: ManagementPrimaryTab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'staff', label: 'Staff' },
  { id: 'trends', label: 'Trends' },
  { id: 'history', label: 'History' },
];

interface ManagementTabNavProps {
  activeTab: ManagementPrimaryTab;
  onTabChange: (tab: ManagementPrimaryTab) => void;
  children: (activeTab: ManagementPrimaryTab) => ReactNode;
}

export function ManagementTabNav({ activeTab, onTabChange, children }: ManagementTabNavProps) {
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
    <div className="kitchen-mgmt-forecasting" data-testid="kitchen-mgmt-forecasting">
      <div
        className="kitchen-mgmt-primary-tabs"
        role="tablist"
        aria-label="Forecast and service views"
        data-testid="kitchen-mgmt-primary-tabs"
      >
        {TABS.map((tab, index) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            id={`kitchen-mgmt-primary-tab-${tab.id}`}
            aria-selected={activeTab === tab.id}
            aria-controls={`kitchen-mgmt-primary-panel-${tab.id}`}
            className={
              activeTab === tab.id
                ? 'kitchen-mgmt-primary-tabs__tab kitchen-mgmt-primary-tabs__tab--active'
                : 'kitchen-mgmt-primary-tabs__tab'
            }
            data-testid={`kitchen-mgmt-primary-tab-${tab.id}`}
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
          id={`kitchen-mgmt-primary-panel-${tab.id}`}
          aria-labelledby={`kitchen-mgmt-primary-tab-${tab.id}`}
          hidden={activeTab !== tab.id}
          data-testid={`kitchen-mgmt-primary-panel-${tab.id}`}
          className="kitchen-mgmt-primary-panel"
        >
          {activeTab === tab.id ? children(tab.id) : null}
        </div>
      ))}
    </div>
  );
}
