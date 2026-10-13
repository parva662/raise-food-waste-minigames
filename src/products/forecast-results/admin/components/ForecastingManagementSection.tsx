import { useMemo, useState } from 'react';
import type { GameBusInputCollectionsPayload } from '@/platform/gamebus/types';
import type { AdminHistoryServiceRow } from '@/products/forecast-results/admin/adminServiceView';
import type { AdminServiceView } from '@/products/forecast-results/admin/adminServiceView';
import { ForecastPendingStaffTable } from '@/products/forecast-results/admin/components/ForecastPendingStaffTable';
import { HistorySection } from '@/products/forecast-results/admin/components/HistorySection';
import { ManagementTabNav, type ManagementPrimaryTab } from '@/products/forecast-results/admin/components/ManagementTabNav';
import { ManagementTrendsSection } from '@/products/forecast-results/admin/components/ManagementTrendsSection';
import { OverviewSection } from '@/products/forecast-results/admin/components/OverviewSection';
import { StaffDetailPanel } from '@/products/forecast-results/admin/components/StaffDetailPanel';
import { StaffResultsTable } from '@/products/forecast-results/admin/components/StaffResultsTable';
import { buildManagementTrendPoints } from '@/products/forecast-results/calculations/managementTrendsData';

interface ForecastingManagementSectionProps {
  view: AdminServiceView;
  historyRows: readonly AdminHistoryServiceRow[];
  selectedDate: string;
  onSelectDate: (date: string) => void;
  embedded: boolean;
  inputCollectionsReady: boolean;
  inputCollections: unknown;
}

export function ForecastingManagementSection({
  view,
  historyRows,
  selectedDate,
  onSelectDate,
  embedded,
  inputCollectionsReady,
  inputCollections,
}: ForecastingManagementSectionProps) {
  const [activeTab, setActiveTab] = useState<ManagementPrimaryTab>('overview');
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);

  const completeResults =
    view.kind === 'complete' || view.kind === 'closeout_only' ? view.dailyResults : null;

  const selectedStaff = useMemo(() => {
    if (!completeResults) return null;
    return completeResults.staffResults.find((result) => result.userId === selectedStaffId) ?? null;
  }, [completeResults, selectedStaffId]);

  const trendAsOf =
    selectedDate ||
    (view.kind !== 'none' && 'serviceDate' in view ? view.serviceDate : '') ||
    historyRows[historyRows.length - 1]?.serviceDate ||
    '';

  const trendPoints = useMemo(() => {
    if (!trendAsOf) return [];
    if (embedded && inputCollectionsReady) {
      return buildManagementTrendPoints(
        trendAsOf,
        inputCollections as GameBusInputCollectionsPayload | null,
      );
    }
    return buildManagementTrendPoints(trendAsOf);
  }, [embedded, inputCollections, inputCollectionsReady, trendAsOf]);

  return (
    <ManagementTabNav activeTab={activeTab} onTabChange={setActiveTab}>
      {(tab) => {
        if (tab === 'overview') {
          return <OverviewSection view={view} />;
        }

        if (tab === 'staff') {
          if (view.kind === 'forecast_only') {
            return (
              <ForecastPendingStaffTable
                serviceDate={view.serviceDate}
                staffForecasts={view.staffForecasts}
              />
            );
          }
          if (completeResults && completeResults.staffResults.length > 0) {
            return (
              <>
                <StaffResultsTable
                  serviceDate={completeResults.serviceDate}
                  staffResults={completeResults.staffResults}
                  selectedStaffId={selectedStaffId}
                  onSelectStaff={setSelectedStaffId}
                />
                {selectedStaff ? (
                  <StaffDetailPanel
                    result={selectedStaff}
                    serviceDate={completeResults.serviceDate}
                    onClose={() => setSelectedStaffId(null)}
                  />
                ) : null}
              </>
            );
          }
          return (
            <p className="kitchen-mgmt-empty" data-testid="kitchen-mgmt-staff-empty">
              {view.kind === 'closeout_only'
                ? 'No eligible staff forecasts are available for this service.'
                : 'No staff forecasts are available for this service.'}
            </p>
          );
        }

        if (tab === 'trends') {
          if (!trendAsOf) {
            return (
              <p className="kitchen-mgmt-empty" data-testid="kitchen-mgmt-trends-empty">
                No service dates are available for trend analysis.
              </p>
            );
          }
          return <ManagementTrendsSection trendPoints={trendPoints} asOfServiceDate={trendAsOf} />;
        }

        return (
          <HistorySection
            rows={historyRows}
            selectedDate={selectedDate}
            onSelectDate={(date) => {
              onSelectDate(date);
              setActiveTab('overview');
            }}
          />
        );
      }}
    </ManagementTabNav>
  );
}
