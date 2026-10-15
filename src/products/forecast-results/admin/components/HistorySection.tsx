import { useMemo, useState } from 'react';
import {
  type AdminHistoryServiceRow,
  type AdminHistoryServiceStatus,
  serviceStatusLabel,
} from '@/products/forecast-results/admin/adminServiceView';
import { formatServiceDateLong } from '@/products/forecast-results/displayFormat';

const PAGE_SIZE = 8;

interface HistorySectionProps {
  rows: readonly AdminHistoryServiceRow[];
  selectedDate: string;
  onSelectDate: (date: string) => void;
}

export function HistorySection({ rows, selectedDate, onSelectDate }: HistorySectionProps) {
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | AdminHistoryServiceStatus>('all');
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return [...rows]
      .sort((left, right) => right.serviceDate.localeCompare(left.serviceDate))
      .filter((row) => (statusFilter === 'all' ? true : row.status === statusFilter))
      .filter((row) => {
        if (!needle) return true;
        const label = formatServiceDateLong(row.serviceDate).toLowerCase();
        return row.serviceDate.includes(needle) || label.includes(needle);
      });
  }, [query, rows, statusFilter]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const pageRows = filtered.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);

  return (
    <section className="kitchen-mgmt-history" data-testid="kitchen-mgmt-history">
      <header className="kitchen-mgmt-staff-tab__header">
        <h3 className="kitchen-mgmt-surface__title">Service history</h3>
        <p className="kitchen-mgmt-helper">
          Incomplete services remain visible. Selecting a row updates Forecast &amp; Service for that
          date.
        </p>
        <div className="kitchen-mgmt-filters">
          <label className="kitchen-mgmt-search">
            <span className="kitchen-mgmt-search__label">Search dates</span>
            <input
              type="search"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setPage(0);
              }}
              data-testid="kitchen-mgmt-history-search"
              placeholder="Search by date"
            />
          </label>
          <label className="kitchen-mgmt-search">
            <span className="kitchen-mgmt-search__label">Status</span>
            <select
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(event.target.value as 'all' | AdminHistoryServiceStatus);
                setPage(0);
              }}
              data-testid="kitchen-mgmt-history-status-filter"
            >
              <option value="all">All statuses</option>
              <option value="complete">Completed</option>
              <option value="forecast_only">Waiting for closeout</option>
              <option value="closeout_only">Closeout only</option>
              <option value="empty">No data</option>
            </select>
          </label>
        </div>
      </header>

      {filtered.length === 0 ? (
        <p className="kitchen-mgmt-empty" data-testid="kitchen-mgmt-history-empty">
          No services match the current filters.
        </p>
      ) : (
        <div className="chef-results-table-wrap kitchen-mgmt-table-wrap">
          <table className="chef-results-table kitchen-mgmt-table" data-testid="kitchen-mgmt-history-table">
            <thead>
              <tr>
                <th scope="col">Service date</th>
                <th scope="col">Status</th>
                <th scope="col" className="kitchen-mgmt-table__num">
                  Forecasts
                </th>
                <th scope="col">Closeout</th>
                <th scope="col">Open</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.map((row) => {
                const isSelected = row.serviceDate === selectedDate;
                return (
                  <tr
                    key={row.serviceDate}
                    data-testid={`kitchen-mgmt-history-row-${row.serviceDate}`}
                    className={isSelected ? 'kitchen-mgmt-table__row--selected' : undefined}
                  >
                    <th scope="row">{formatServiceDateLong(row.serviceDate)}</th>
                    <td>
                      <span
                        className={`kitchen-mgmt-status-pill kitchen-mgmt-status-pill--${row.status}`}
                        data-testid={`kitchen-mgmt-history-status-${row.serviceDate}`}
                      >
                        {serviceStatusLabel(row.status)}
                      </span>
                    </td>
                    <td className="kitchen-mgmt-table__num">{row.forecastCount}</td>
                    <td>{row.hasCloseout ? 'Recorded' : 'Missing'}</td>
                    <td>
                      <button
                        type="button"
                        className="kitchen-mgmt-detail-button"
                        data-testid={`kitchen-mgmt-history-open-${row.serviceDate}`}
                        onClick={() => onSelectDate(row.serviceDate)}
                      >
                        {isSelected ? 'Selected' : 'View'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {filtered.length > PAGE_SIZE ? (
        <div className="kitchen-mgmt-pagination" data-testid="kitchen-mgmt-history-pagination">
          <button
            type="button"
            className="kitchen-mgmt-detail-button"
            disabled={safePage === 0}
            onClick={() => setPage((current) => Math.max(0, current - 1))}
          >
            Previous
          </button>
          <span>
            Page {safePage + 1} of {pageCount}
          </span>
          <button
            type="button"
            className="kitchen-mgmt-detail-button"
            disabled={safePage >= pageCount - 1}
            onClick={() => setPage((current) => Math.min(pageCount - 1, current + 1))}
          >
            Next
          </button>
        </div>
      ) : null}
    </section>
  );
}
