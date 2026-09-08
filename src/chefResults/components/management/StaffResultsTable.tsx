import { useMemo, useState } from 'react';
import {
  formatCustomerErrorCount,
  formatNormalizedRate,
  formatStaffTableCustomerDifference,
} from '../../managementFormat';
import {
  shortageRateGramsPerCustomer,
  surplusRateGramsPerCustomer,
} from '../../teamComparison';
import type { StaffDailyResult } from '../../types';

type SortKey = 'name' | 'customerError' | 'surplus' | 'shortage';
type SortDirection = 'asc' | 'desc';

interface StaffResultsTableProps {
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
    <section className="kitchen-mgmt-section" data-testid="kitchen-mgmt-staff-results">
      <h2 className="kitchen-mgmt-section__title">Staff results</h2>
      <p className="kitchen-mgmt-section__intro">
        Forecast results for staff who submitted a forecast for this service.
      </p>
      <p className="kitchen-mgmt-helper">
        The aim is to keep both estimated surplus and shortage low.
      </p>

      <div className="chef-results-table-wrap">
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
              <th scope="col">Customer estimate</th>
              <th scope="col">Difference</th>
              <th scope="col">
                <button
                  type="button"
                  className="kitchen-mgmt-sort-button"
                  onClick={() => toggleSort('surplus')}
                  aria-label={`Sort by estimated surplus${sortIndicator(sortKey === 'surplus', sortDirection)}`}
                >
                  Estimated surplus{sortIndicator(sortKey === 'surplus', sortDirection)}
                </button>
              </th>
              <th scope="col">
                <button
                  type="button"
                  className="kitchen-mgmt-sort-button"
                  onClick={() => toggleSort('shortage')}
                  aria-label={`Sort by estimated shortage${sortIndicator(sortKey === 'shortage', sortDirection)}`}
                >
                  Estimated shortage{sortIndicator(sortKey === 'shortage', sortDirection)}
                </button>
              </th>
              <th scope="col">
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
            {sortedResults.map((result) => (
              <tr
                key={result.userId}
                data-testid={`staff-result-row-${result.userId}`}
                aria-selected={selectedStaffId === result.userId}
              >
                <th scope="row" data-testid={`staff-result-name-${result.userId}`}>
                  {result.userName}
                </th>
                <td>{result.forecastCustomers}</td>
                <td>{formatStaffTableCustomerDifference(result)}</td>
                <td>{formatNormalizedRate(surplusRateGramsPerCustomer(result))}</td>
                <td>{formatNormalizedRate(shortageRateGramsPerCustomer(result))}</td>
                <td>{formatCustomerErrorCount(result.customerForecastAbsoluteError)}</td>
                <td>
                  <button
                    type="button"
                    className="kitchen-mgmt-detail-button"
                    data-testid={`staff-view-details-${result.userId}`}
                    aria-expanded={selectedStaffId === result.userId}
                    aria-controls="kitchen-mgmt-staff-detail"
                    onClick={() => onSelectStaff(result.userId)}
                  >
                    View details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
