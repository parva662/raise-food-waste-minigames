import { useEffect, useMemo, useState } from 'react';
import { ManagementDetailDrawer } from '@/products/forecast-results/admin/components/ManagementDetailDrawer';
import { formatServiceDateLong } from '@/products/forecast-results/displayFormat';
import { RESULT_CATEGORY_KEYS, RESULT_CATEGORY_LABELS } from '@/products/forecast-results/types';
import type { ChefForecastForCalculation } from '@/products/forecast-results/types';

interface ForecastPendingStaffTableProps {
  serviceDate: string;
  staffForecasts: readonly ChefForecastForCalculation[];
}

export function ForecastPendingStaffTable({
  serviceDate,
  staffForecasts,
}: ForecastPendingStaffTableProps) {
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const rows = [...staffForecasts].sort((left, right) =>
      left.userName.localeCompare(right.userName),
    );
    if (!needle) return rows;
    return rows.filter((row) => row.userName.toLowerCase().includes(needle));
  }, [query, staffForecasts]);

  const selected = filtered.find((row) => row.userId === selectedStaffId) ?? null;

  useEffect(() => {
    setSelectedStaffId(null);
  }, [serviceDate]);

  useEffect(() => {
    if (selectedStaffId && !selected) {
      setSelectedStaffId(null);
    }
  }, [selected, selectedStaffId]);

  return (
    <section className="kitchen-mgmt-staff-tab" data-testid="kitchen-mgmt-staff-results">
      <header className="kitchen-mgmt-staff-tab__header">
        <h3 className="kitchen-mgmt-surface__title">Staff forecasts</h3>
        <p className="kitchen-mgmt-staff-tab__context" data-testid="kitchen-mgmt-staff-context">
          {formatServiceDateLong(serviceDate)}
          <span className="kitchen-mgmt-staff-tab__context-sep">·</span>
          {staffForecasts.length} forecast{staffForecasts.length === 1 ? '' : 's'} submitted
        </p>
        <p className="kitchen-mgmt-helper">
          Simulated surplus, shortage, and customer error appear after service closeout.
        </p>
        <label className="kitchen-mgmt-search">
          <span className="kitchen-mgmt-search__label">Search staff</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            data-testid="kitchen-mgmt-staff-search"
            placeholder="Search by name"
          />
        </label>
      </header>

      <div className="chef-results-table-wrap kitchen-mgmt-table-wrap">
        <table className="chef-results-table kitchen-mgmt-table" data-testid="kitchen-mgmt-staff-table">
          <thead>
            <tr>
              <th scope="col">Staff</th>
              <th scope="col" className="kitchen-mgmt-table__num">
                Expected customers
              </th>
              <th scope="col">Forecasted quantities</th>
              <th scope="col" className="kitchen-mgmt-table__num">
                Customer error
              </th>
              <th scope="col" className="kitchen-mgmt-table__num">
                Estimated surplus
              </th>
              <th scope="col" className="kitchen-mgmt-table__num">
                Estimated shortage
              </th>
              <th scope="col">Details</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((forecast) => {
              const isSelected = selectedStaffId === forecast.userId;
              return (
                <tr
                  key={forecast.userId}
                  data-testid={`staff-result-row-${forecast.userId}`}
                  className={isSelected ? 'kitchen-mgmt-table__row--selected' : undefined}
                  aria-selected={isSelected}
                >
                  <th scope="row" data-testid={`staff-result-name-${forecast.userId}`}>
                    {forecast.userName}
                  </th>
                  <td
                    className="kitchen-mgmt-table__num"
                    data-testid={`staff-forecast-cell-${forecast.userId}`}
                  >
                    {forecast.forecastTotalCustomers}
                  </td>
                  <td>
                    {RESULT_CATEGORY_KEYS.map((key) => (
                      <span key={key} className="kitchen-mgmt-qty-chip">
                        {RESULT_CATEGORY_LABELS[key]} {forecast[key].forecastQuantity}
                      </span>
                    ))}
                  </td>
                  <td className="kitchen-mgmt-table__num">Unavailable</td>
                  <td className="kitchen-mgmt-table__num">Unavailable</td>
                  <td className="kitchen-mgmt-table__num">Unavailable</td>
                  <td>
                    <button
                      type="button"
                      className="kitchen-mgmt-detail-button"
                      data-testid={`staff-view-details-${forecast.userId}`}
                      aria-expanded={isSelected}
                      aria-controls="kitchen-mgmt-staff-detail"
                      onClick={() => setSelectedStaffId(forecast.userId)}
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

      <ManagementDetailDrawer
        open={Boolean(selected)}
        title={selected?.userName ?? 'Staff detail'}
        subtitle={`Submitted forecast — ${formatServiceDateLong(serviceDate)}`}
        onClose={() => setSelectedStaffId(null)}
        testId="kitchen-mgmt-staff-detail"
        titleTestId="kitchen-mgmt-staff-detail-title"
        closeTestId="kitchen-mgmt-staff-detail-close"
      >
        {selected ? (
          <>
            <p className="kitchen-mgmt-sr-only" data-testid="staff-detail-service-context">
              Submitted forecast — {formatServiceDateLong(serviceDate)}
            </p>
            <div className="kitchen-mgmt-detail-cards">
              <article className="kitchen-mgmt-detail-card">
                <h4>Customer estimate</h4>
                <dl>
                  <div>
                    <dt>Expected customers</dt>
                    <dd data-testid="staff-detail-predicted">{selected.forecastTotalCustomers}</dd>
                  </div>
                  <div>
                    <dt>Customer error</dt>
                    <dd>Unavailable until closeout</dd>
                  </div>
                </dl>
              </article>
              <article className="kitchen-mgmt-detail-card">
                <h4>Forecasted quantities</h4>
                <dl>
                  {RESULT_CATEGORY_KEYS.map((key) => (
                    <div key={key}>
                      <dt>{RESULT_CATEGORY_LABELS[key]}</dt>
                      <dd>{selected[key].forecastQuantity}</dd>
                    </div>
                  ))}
                </dl>
              </article>
            </div>
          </>
        ) : null}
      </ManagementDetailDrawer>
    </section>
  );
}
