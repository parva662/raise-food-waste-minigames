import { useEffect, useMemo, useState } from 'react';
import { getGroupResultServiceDates } from './adapters/groupCalculationSource';
import { getFixtureServiceDates } from './adapters/fixtureCalculationSource';
import { ObservedServicePanel } from './components/ObservedServicePanel';
import { StaffResultCard } from './components/StaffResultCard';
import { WeeklySummaryPanel } from './components/WeeklySummaryPanel';
import { useChefResultsData } from './useChefResultsData';
import { useGameBusEmbed } from '../gamebus/useGameBusEmbed';

/**
 * Research/admin view — full staff-level results with real actor names when embedded.
 * Route: #/chef-results-admin (hidden; route-level authorization still required before production).
 */
export function ChefResultsAdminApp() {
  const { embedded, inputCollections, inputCollectionsReady } = useGameBusEmbed();
  const fixtureDates = useMemo(() => getFixtureServiceDates(), []);
  const groupDates = useMemo(() => {
    if (!embedded || !inputCollectionsReady) return [];
    return getGroupResultServiceDates(inputCollections);
  }, [embedded, inputCollections, inputCollectionsReady]);

  const serviceDates = embedded && inputCollectionsReady ? groupDates : fixtureDates;
  const [selectedDate, setSelectedDate] = useState<string>('');

  useEffect(() => {
    if (serviceDates.length === 0) {
      setSelectedDate('');
      return;
    }
    setSelectedDate((current) =>
      current && serviceDates.includes(current) ? current : serviceDates[serviceDates.length - 1]!,
    );
  }, [serviceDates]);

  const resultsState = useChefResultsData(selectedDate);
  const dailyResults = resultsState.status === 'ready' ? resultsState.dailyResults : null;
  const weeklySummaries = resultsState.status === 'ready' ? resultsState.weeklySummaries : [];

  return (
    <div className="chef-results-page chef-results-page--admin" data-testid="chef-results-admin-page">
      <header className="chef-results-header">
        <p className="chef-results-header__eyebrow">Kitchen admin results</p>
        <h1 className="chef-results-header__title">Daily simulation results</h1>
        <p className="chef-results-header__intro">
          Research/admin view showing all participating kitchen staff with real actor names when
          embedded in GameBus. Not linked from participant navigation. Route-level authorization is
          still required before production.
        </p>
      </header>

      {resultsState.status === 'pending' ? (
        <p className="chef-results-empty" data-testid="chef-results-admin-pending">
          Loading kitchen group activities…
        </p>
      ) : null}

      <div className="chef-results-toolbar">
        <label className="chef-results-date-picker">
          <span>Service date</span>
          <select
            value={selectedDate}
            onChange={(event) => setSelectedDate(event.target.value)}
            data-testid="chef-results-admin-date-select"
            disabled={serviceDates.length === 0}
          >
            {serviceDates.map((date) => (
              <option key={date} value={date}>
                {date}
              </option>
            ))}
          </select>
        </label>
      </div>

      {resultsState.status === 'ready' && !dailyResults ? (
        <p className="chef-results-empty" data-testid="chef-results-admin-empty">
          No closeout data for this service date.
        </p>
      ) : null}

      {dailyResults ? (
        <>
          <ObservedServicePanel observed={dailyResults.observed} />
          <section className="chef-results-panel">
            <h2 className="chef-results-panel__title">Staff simulations</h2>
            <p className="chef-results-panel__intro">
              Each staff member with a forecast for this service date is evaluated independently
              against the shared observed closeout.
            </p>
            <div className="chef-results-staff-grid">
              {dailyResults.staffResults.map((result) => (
                <StaffResultCard key={result.userId} result={result} />
              ))}
            </div>
          </section>
        </>
      ) : null}

      <WeeklySummaryPanel summaries={weeklySummaries} />
    </div>
  );
}
