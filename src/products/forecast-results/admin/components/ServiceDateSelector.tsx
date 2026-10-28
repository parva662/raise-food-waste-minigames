import { formatServiceDateLong, formatServiceDateShort } from '@/products/forecast-results/displayFormat';

interface ServiceDateSelectorProps {
  serviceDates: readonly string[];
  selectedDate: string;
  onSelectDate: (date: string) => void;
  compact?: boolean;
  selectedDateIsUpcoming?: boolean;
  todayIso?: string;
}

export function ServiceDateSelector({
  serviceDates,
  selectedDate,
  onSelectDate,
  compact = false,
  selectedDateIsUpcoming = false,
  todayIso,
}: ServiceDateSelectorProps) {
  if (serviceDates.length === 0) {
    return (
      <p className="kitchen-mgmt-empty" data-testid="chef-results-admin-no-dates">
        No completed forecasting results are available yet.
      </p>
    );
  }

  return (
    <div
      className={compact ? 'kitchen-mgmt-date-picker kitchen-mgmt-date-picker--compact' : 'kitchen-mgmt-toolbar'}
      data-testid="kitchen-mgmt-service-date-selector"
    >
      <label className="kitchen-mgmt-date-picker__label">
        <span className="kitchen-mgmt-date-picker__title">Service date</span>
        <select
          value={selectedDate}
          onChange={(event) => onSelectDate(event.target.value)}
          data-testid="chef-results-admin-date-select"
          aria-describedby={selectedDateIsUpcoming ? 'kitchen-mgmt-upcoming-service' : undefined}
        >
          {serviceDates.map((date) => {
            const upcoming = todayIso ? date > todayIso : false;
            return (
              <option key={date} value={date}>
                {formatServiceDateShort(date)}
                {upcoming ? ' (upcoming)' : ''}
              </option>
            );
          })}
        </select>
      </label>
      {selectedDateIsUpcoming ? (
        <p
          id="kitchen-mgmt-upcoming-service"
          className="kitchen-mgmt-date-picker__upcoming"
          data-testid="kitchen-mgmt-upcoming-service"
        >
          Upcoming service
        </p>
      ) : null}
      {selectedDate && !compact ? (
        <p className="kitchen-mgmt-date-picker__readable" data-testid="kitchen-mgmt-selected-date">
          {formatServiceDateShort(selectedDate)}
        </p>
      ) : null}
      {selectedDate && compact ? (
        <span className="kitchen-mgmt-date-picker__sr" data-testid="kitchen-mgmt-selected-date">
          {formatServiceDateLong(selectedDate)}
        </span>
      ) : null}
    </div>
  );
}
