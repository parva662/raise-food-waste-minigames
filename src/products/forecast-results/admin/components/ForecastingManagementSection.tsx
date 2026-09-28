import { useMemo, useState } from 'react';
import type { DailyServiceResults } from '@/products/forecast-results/types';
import { buildManagementTrendPoints } from '@/products/forecast-results/calculations/managementTrendsData';
import { ManagementTabNav, type ManagementPrimaryTab } from '@/products/forecast-results/admin/components/ManagementTabNav';
import { ManagementTrendsSection } from '@/products/forecast-results/admin/components/ManagementTrendsSection';
import { OverviewSection } from '@/products/forecast-results/admin/components/OverviewSection';
import { StaffDetailPanel } from '@/products/forecast-results/admin/components/StaffDetailPanel';
import { StaffResultsTable } from '@/products/forecast-results/admin/components/StaffResultsTable';

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
        inputCollections as import('@/platform/gamebus/types').GameBusInputCollectionsPayload | null,
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
