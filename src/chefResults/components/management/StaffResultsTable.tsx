import { useMemo, useState } from 'react';
import { formatServiceDateLong } from '../../displayFormat';
import {
  formatCustomerErrorCount,
  formatNormalizedRate,
  formatStaffTableCustomerForecast,
} from '../../managementFormat';
import {
  shortageRateGramsPerCustomer,
  surplusRateGramsPerCustomer,
} from '../../teamComparison';
import type { StaffDailyResult } from '../../types';

type SortKey = 'name' | 'customerError' | 'surplus' | 'shortage';
type SortDirection = 'asc' | 'desc';

interface StaffResultsTableProps {
  serviceDate: string;
  staffResults: readonly StaffDailyResult[];
  selectedStaffId: string | null;
  onSelectStaff: (userId: string) => void;
}

function compareStaff(
  left: StaffDailyResult,
  right: StaffDailyResult,
  sortKey: SortKey,
  direction: SortDirection,
): number {
  const multiplier = direction === 'asc' ? 1 : -1;

  if (sortKey === 'name') {
    return multiplier * left.userName.localeCompare(right.userName);
  }

  if (sortKey === 'customerError') {
    return multiplier * (left.customerForecastAbsoluteError - right.customerForecastAbsoluteError);
  }

  if (sortKey === 'surplus') {
    const leftRate = surplusRateGramsPerCustomer(left);
    const rightRate = surplusRateGramsPerCustomer(right);
    if (leftRate === null && rightRate === null) return 0;
    if (leftRate === null) return 1;
    if (rightRate === null) return -1;
    return multiplier * (leftRate - rightRate);
  }

  const leftRate = shortageRateGramsPerCustomer(left);
  const rightRate = shortageRateGramsPerCustomer(right);
  if (leftRate === null && rightRate === null) return 0;
  if (leftRate === null) return 1;
  if (rightRate === null) return -1;
  return multiplier * (leftRate - rightRate);
}

function sortIndicator(active: boolean, direction: SortDirection): string {
  if (!active) return '';
  return direction === 'asc' ? ' ↑' : ' ↓';
}

export function StaffResultsTable({
  serviceDate,
  staffResults,
  selectedStaffId,
  onSelectStaff,
}: StaffResultsTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const sortedResults = useMemo(() => {
    return [...staffResults].sort((left, right) =>
      compareStaff(left, right, sortKey, sortDirection),
    );
  }, [staffResults, sortKey, sortDirection]);

  function toggleSort(nextKey: SortKey) {
    if (sortKey === nextKey) {
      setSortDirection((current) => (current === 'asc' ? 'desc' : 'asc'));
      return;
    }
    setSortKey(nextKey);
    setSortDirection(nextKey === 'name' ? 'asc' : 'asc');
  }

  return (
    <section className="kitchen-mgmt-staff-tab" data-testid="kitchen-mgmt-staff-results">
      <header className="kitchen-mgmt-staff-tab__header">
        <h3 className="kitchen-mgmt-surface__title">Staff forecasts</h3>
        <p className="kitchen-mgmt-staff-tab__context" data-testid="kitchen-mgmt-staff-context">
          {formatServiceDateLong(serviceDate)}
          <span className="kitchen-mgmt-staff-tab__context-sep">·</span>
          {staffResults.length} forecast{staffResults.length === 1 ? '' : 's'} submitted
        </p>
        <p className="kitchen-mgmt-helper">
          The aim is to keep both estimated surplus and shortage low.
        </p>
      </header>

      <div className="chef-results-table-wrap kitchen-mgmt-table-wrap">
        <table className="chef-results-table kitchen-mgmt-table" data-testid="kitchen-mgmt-staff-table">
          <thead>
            <tr>
              <th scope="col">
                <button
                  type="button"
                  className="kitchen-mgmt-sort-button"
                  onClick={() => toggleSort('name')}
                  aria-label={`Sort by staff name${sortIndicator(sortKey === 'name', sortDirection)}`}
                >
                  Staff{sortIndicator(sortKey === 'name', sortDirection)}
                </button>
              </th>
              <th scope="col">Customer forecast</th>
              <th scope="col" className="kitchen-mgmt-table__num">
                <button
                  type="button"
                  className="kitchen-mgmt-sort-button"
                  onClick={() => toggleSort('surplus')}
                  aria-label={`Sort by estimated surplus${sortIndicator(sortKey === 'surplus', sortDirection)}`}
                >
                  Estimated surplus{sortIndicator(sortKey === 'surplus', sortDirection)}
                </button>
              </th>
              <th scope="col" className="kitchen-mgmt-table__num">
                <button
                  type="button"
                  className="kitchen-mgmt-sort-button"
                  onClick={() => toggleSort('shortage')}
                  aria-label={`Sort by estimated shortage${sortIndicator(sortKey === 'shortage', sortDirection)}`}
                >
                  Estimated shortage{sortIndicator(sortKey === 'shortage', sortDirection)}
                </button>
              </th>
              <th scope="col" className="kitchen-mgmt-table__num">
                <button
                  type="button"
                  className="kitchen-mgmt-sort-button"
                  onClick={() => toggleSort('customerError')}
                  aria-label={`Sort by customer error${sortIndicator(sortKey === 'customerError', sortDirection)}`}
                >
                  Customer error{sortIndicator(sortKey === 'customerError', sortDirection)}
                </button>
              </th>
              <th scope="col">Details</th>
            </tr>
          </thead>
          <tbody>
            {sortedResults.map((result) => {
              const forecast = formatStaffTableCustomerForecast(result);
              const isSelected = selectedStaffId === result.userId;
              return (
                <tr
                  key={result.userId}
                  data-testid={`staff-result-row-${result.userId}`}
                  className={isSelected ? 'kitchen-mgmt-table__row--selected' : undefined}
                  aria-selected={isSelected}
                >
                  <th scope="row" data-testid={`staff-result-name-${result.userId}`}>
                    {result.userName}
                  </th>
                  <td data-testid={`staff-forecast-cell-${result.userId}`}>
                    <span className="kitchen-mgmt-forecast-cell__primary">{forecast.primary}</span>
                    <span className="kitchen-mgmt-forecast-cell__secondary">{forecast.secondary}</span>
                  </td>
                  <td className="kitchen-mgmt-table__num">
                    {formatNormalizedRate(surplusRateGramsPerCustomer(result))}
                  </td>
                  <td className="kitchen-mgmt-table__num">
                    {formatNormalizedRate(shortageRateGramsPerCustomer(result))}
                  </td>
                  <td className="kitchen-mgmt-table__num">
                    {formatCustomerErrorCount(result.customerForecastAbsoluteError)}
                  </td>
                  <td>
                    <button
                      type="button"
                      className="kitchen-mgmt-detail-button"
                      data-testid={`staff-view-details-${result.userId}`}
                      aria-expanded={isSelected}
                      aria-controls="kitchen-mgmt-staff-detail"
                      onClick={() => onSelectStaff(result.userId)}
                    >
                      View
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
