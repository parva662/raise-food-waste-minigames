import { useMemo, useState } from 'react';
import { getFixtureServiceDates } from './adapters/fixtureCalculationSource';
import { ObservedServicePanel } from './components/ObservedServicePanel';
import { StaffResultCard } from './components/StaffResultCard';
import { WeeklySummaryPanel } from './components/WeeklySummaryPanel';
import { useChefResultsFixtureData } from './useChefResultsData';

/**
 * Research/admin view — full staff-level fixture results.
 * Route: #/chef-results-admin (hidden; route-level authorization still required before production).
 */
export function ChefResultsAdminApp() {
  const serviceDates = useMemo(() => getFixtureServiceDates(), []);
  const [selectedDate, setSelectedDate] = useState<string>(() => serviceDates[0] ?? '');
  const { dailyResults, weeklySummaries } = useChefResultsFixtureData(selectedDate);

  return (
    <div className="chef-results-page chef-results-page--admin" data-testid="chef-results-admin-page">
      <header className="chef-results-header">
        <p className="chef-results-header__eyebrow">Kitchen admin results</p>
        <h1 className="chef-results-header__title">Daily simulation results</h1>
        <p className="chef-results-header__intro">
          Research/admin view using development fixtures. Shows all participating staff, head-chef
          rotation, and full calculation detail. Not linked from participant navigation. Route-level
          authorization is still required before production.
        </p>
      </header>

      <div className="chef-results-toolbar">
        <label className="chef-results-date-picker">
          <span>Service date</span>
          <select
            value={selectedDate}
            onChange={(event) => setSelectedDate(event.target.value)}
            data-testid="chef-results-admin-date-select"
          >
            {serviceDates.map((date) => (
              <option key={date} value={date}>
                {date}
              </option>
            ))}
          </select>
        </label>
      </div>

      {!dailyResults ? (
        <p className="chef-results-empty" data-testid="chef-results-admin-empty">
          No fixture closeout data for this service date.
        </p>
      ) : (
        <>
          <ObservedServicePanel observed={dailyResults.observed} />
          <section className="chef-results-panel">
            <h2 className="chef-results-panel__title">Staff simulations</h2>
            <p className="chef-results-panel__intro">
              Each participating staff member is evaluated with the same method, including the
              rotating head chef.
            </p>
            <div className="chef-results-staff-grid">
              {dailyResults.staffResults.map((result) => (
                <StaffResultCard key={result.userId} result={result} />
              ))}
            </div>
          </section>
        </>
      )}

      <WeeklySummaryPanel summaries={weeklySummaries} />
    </div>
  );
}
