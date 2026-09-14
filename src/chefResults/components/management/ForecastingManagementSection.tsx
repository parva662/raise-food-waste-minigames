import { useMemo, useState } from 'react';
import type { DailyServiceResults } from '../../types';
import { buildManagementTrendPoints } from '../../managementTrendsData';
import { ManagementTabNav, type ManagementPrimaryTab } from './ManagementTabNav';
import { ManagementTrendsSection } from './ManagementTrendsSection';
import { OverviewSection } from './OverviewSection';
import { StaffDetailPanel } from './StaffDetailPanel';
import { StaffResultsTable } from './StaffResultsTable';

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
  const [activeTab, setActiveTab] = useState<ManagementPrimaryTab>('overview');
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);

  const selectedStaff = useMemo(
    () => dailyResults.staffResults.find((result) => result.userId === selectedStaffId) ?? null,
    [dailyResults.staffResults, selectedStaffId],
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
    <ManagementTabNav activeTab={activeTab} onTabChange={setActiveTab}>
      {(tab) => {
        if (tab === 'overview') {
          return <OverviewSection dailyResults={dailyResults} />;
        }
        if (tab === 'staff') {
          return (
            <>
              <StaffResultsTable
                serviceDate={dailyResults.serviceDate}
                staffResults={dailyResults.staffResults}
                selectedStaffId={selectedStaffId}
                onSelectStaff={setSelectedStaffId}
              />
              {selectedStaff ? (
                <StaffDetailPanel
                  result={selectedStaff}
                  serviceDate={dailyResults.serviceDate}
                  onClose={() => setSelectedStaffId(null)}
                />
              ) : null}
            </>
          );
        }
        return (
          <ManagementTrendsSection trendPoints={trendPoints} asOfServiceDate={dailyResults.serviceDate} />
        );
      }}
    </ManagementTabNav>
  );
}
