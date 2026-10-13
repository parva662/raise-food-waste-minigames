import { useCallback, type KeyboardEvent, type ReactNode } from 'react';

export type ManagementAreaTab = 'forecast' | 'skills';

const AREAS: { id: ManagementAreaTab; label: string }[] = [
  { id: 'forecast', label: 'Forecast & Service' },
  { id: 'skills', label: 'Kitchen Skills' },
];

interface ManagementAreaNavProps {
  activeArea: ManagementAreaTab;
  onAreaChange: (area: ManagementAreaTab) => void;
  children: (activeArea: ManagementAreaTab) => ReactNode;
}

export function ManagementAreaNav({
  activeArea,
  onAreaChange,
  children,
}: ManagementAreaNavProps) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        onAreaChange(AREAS[(index + 1) % AREAS.length]!.id);
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        onAreaChange(AREAS[(index - 1 + AREAS.length) % AREAS.length]!.id);
      } else if (event.key === 'Home') {
        event.preventDefault();
        onAreaChange(AREAS[0]!.id);
      } else if (event.key === 'End') {
        event.preventDefault();
        onAreaChange(AREAS[AREAS.length - 1]!.id);
      }
    },
    [onAreaChange],
  );

  return (
    <div className="kitchen-mgmt-areas" data-testid="kitchen-mgmt-areas">
      <div
        className="kitchen-mgmt-area-tabs"
        role="tablist"
        aria-label="Kitchen management areas"
        data-testid="kitchen-mgmt-area-tabs"
      >
        {AREAS.map((area, index) => (
          <button
            key={area.id}
            type="button"
            role="tab"
            id={`kitchen-mgmt-area-tab-${area.id}`}
            aria-selected={activeArea === area.id}
            aria-controls={`kitchen-mgmt-area-panel-${area.id}`}
            className={
              activeArea === area.id
                ? 'kitchen-mgmt-area-tabs__tab kitchen-mgmt-area-tabs__tab--active'
                : 'kitchen-mgmt-area-tabs__tab'
            }
            data-testid={`kitchen-mgmt-area-tab-${area.id}`}
            onClick={() => onAreaChange(area.id)}
            onKeyDown={(event) => handleKeyDown(event, index)}
          >
            {area.label}
          </button>
        ))}
      </div>

      {AREAS.map((area) => (
        <div
          key={area.id}
          role="tabpanel"
          id={`kitchen-mgmt-area-panel-${area.id}`}
          aria-labelledby={`kitchen-mgmt-area-tab-${area.id}`}
          hidden={activeArea !== area.id}
          data-testid={`kitchen-mgmt-area-panel-${area.id}`}
          className="kitchen-mgmt-area-panel"
        >
          {activeArea === area.id ? children(area.id) : null}
        </div>
      ))}
    </div>
  );
}
