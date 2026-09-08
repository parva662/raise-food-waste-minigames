import { formatServiceDateLong, formatServiceDateShort } from '../../displayFormat';

interface ServiceDateSelectorProps {
  serviceDates: readonly string[];
  selectedDate: string;
  onSelectDate: (date: string) => void;
}

export function ServiceDateSelector({
  serviceDates,
  selectedDate,
  onSelectDate,
}: ServiceDateSelectorProps) {
  if (serviceDates.length === 0) {
    return (
      <p className="kitchen-mgmt-empty" data-testid="chef-results-admin-no-dates">
        No completed forecasting results are available yet.
      </p>
    );
  }

  return (
    <div className="kitchen-mgmt-toolbar" data-testid="kitchen-mgmt-service-date-selector">
      <label className="kitchen-mgmt-date-picker">
        <span>Service date</span>
        <select
          value={selectedDate}
          onChange={(event) => onSelectDate(event.target.value)}
          data-testid="chef-results-admin-date-select"
        >
          {serviceDates.map((date) => (
            <option key={date} value={date}>
              {formatServiceDateShort(date)}
            </option>
          ))}
        </select>
      </label>
      {selectedDate ? (
        <p className="kitchen-mgmt-date-picker__readable" data-testid="kitchen-mgmt-selected-date">
          {formatServiceDateLong(selectedDate)}
        </p>
      ) : null}
    </div>
  );
}
