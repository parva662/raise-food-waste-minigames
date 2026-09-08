import { useMemo, useState } from 'react';
import type { DailyServiceResults } from '../../types';
import {
  buildManagementTrendPoints,
  buildServiceTeamOverview,
} from '../../managementTrendsData';
import { ManagementTrendsSection } from './ManagementTrendsSection';
import { ServiceOverviewSection } from './ServiceOverviewSection';
import { StaffDetailPanel } from './StaffDetailPanel';
import { StaffResultsTable } from './StaffResultsTable';
import { TeamOverviewSection } from './TeamOverviewSection';

interface ForecastingManagementSectionProps {
  dailyResults: DailyServiceResults;
  embedded: boolean;
  inputCollectionsReady: boolean;
  inputCollections: unknown;
}

export function ForecastingManagementSection({
  dailyResults,
  embedded,
  inputCollectionsReady,
  inputCollections,
}: ForecastingManagementSectionProps) {
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);

  const selectedStaff = useMemo(
    () => dailyResults.staffResults.find((result) => result.userId === selectedStaffId) ?? null,
    [dailyResults.staffResults, selectedStaffId],
  );

  const teamOverview = useMemo(
    () => buildServiceTeamOverview(dailyResults.staffResults),
    [dailyResults.staffResults],
  );

  const trendPoints = useMemo(() => {
    if (embedded && inputCollectionsReady) {
      return buildManagementTrendPoints(
        dailyResults.serviceDate,
        inputCollections as import('../../../gamebus/types').GameBusInputCollectionsPayload | null,
      );
    }
    return buildManagementTrendPoints(dailyResults.serviceDate);
  }, [dailyResults.serviceDate, embedded, inputCollections, inputCollectionsReady]);

  return (
    <div className="kitchen-mgmt-forecasting" data-testid="kitchen-mgmt-forecasting">
      <h2 className="kitchen-mgmt-module-title">Forecasting</h2>
      <p className="kitchen-mgmt-module-intro">
        Compare staff forecasts with observed service demand and review performance over time.
      </p>

      <ServiceOverviewSection dailyResults={dailyResults} />
      <StaffResultsTable
        staffResults={dailyResults.staffResults}
        selectedStaffId={selectedStaffId}
        onSelectStaff={setSelectedStaffId}
      />

      {selectedStaff ? (
        <StaffDetailPanel result={selectedStaff} onClose={() => setSelectedStaffId(null)} />
      ) : null}

      <TeamOverviewSection overview={teamOverview} />
      <ManagementTrendsSection trendPoints={trendPoints} asOfServiceDate={dailyResults.serviceDate} />
    </div>
  );
}
