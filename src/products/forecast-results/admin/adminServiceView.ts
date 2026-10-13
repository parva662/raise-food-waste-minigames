import type { AdminServicePartialState } from '@/products/forecast-results/adapters/groupCalculationSource';
import type {
  ChefForecastForCalculation,
  DailyServiceResults,
} from '@/products/forecast-results/types';

/** Unified view model for one selected service on the management dashboard. */
export type AdminServiceView =
  | { kind: 'complete'; serviceDate: string; dailyResults: DailyServiceResults }
  | { kind: 'closeout_only'; serviceDate: string; dailyResults: DailyServiceResults }
  | {
      kind: 'forecast_only';
      serviceDate: string;
      staffForecasts: readonly ChefForecastForCalculation[];
    }
  | { kind: 'empty'; serviceDate: string }
  | { kind: 'none' };

export type AdminHistoryServiceStatus =
  | 'complete'
  | 'forecast_only'
  | 'closeout_only'
  | 'empty';

export type AdminHistoryServiceRow = {
  serviceDate: string;
  status: AdminHistoryServiceStatus;
  forecastCount: number;
  hasCloseout: boolean;
};

export function adminServiceViewFromPartial(
  selectedDate: string,
  partial: AdminServicePartialState | null,
  dailyResults: DailyServiceResults | null,
): AdminServiceView {
  if (!selectedDate) return { kind: 'none' };
  if (dailyResults) {
    return { kind: 'complete', serviceDate: selectedDate, dailyResults };
  }
  if (!partial) {
    return { kind: 'empty', serviceDate: selectedDate };
  }
  if (partial.kind === 'complete') {
    return { kind: 'complete', serviceDate: selectedDate, dailyResults: partial.dailyResults };
  }
  if (partial.kind === 'closeout_only') {
    return { kind: 'closeout_only', serviceDate: selectedDate, dailyResults: partial.dailyResults };
  }
  if (partial.kind === 'forecast_only') {
    return {
      kind: 'forecast_only',
      serviceDate: partial.serviceDate,
      staffForecasts: partial.staffForecasts,
    };
  }
  return { kind: 'empty', serviceDate: selectedDate };
}

export function serviceStatusLabel(status: AdminHistoryServiceStatus): string {
  switch (status) {
    case 'complete':
      return 'Completed';
    case 'forecast_only':
      return 'Waiting for service closeout';
    case 'closeout_only':
      return 'Closeout only';
    case 'empty':
      return 'No data';
  }
}
