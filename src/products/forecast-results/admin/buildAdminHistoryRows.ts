import {
  resolveAdminServicePartialState,
} from '@/products/forecast-results/adapters/groupCalculationSource';
import type { GameBusInputCollectionsPayload } from '@/platform/gamebus/types';
import type { AdminHistoryServiceRow } from '@/products/forecast-results/admin/adminServiceView';
import { buildFixtureDailyServiceResults } from '@/products/forecast-results/adapters/fixtureCalculationSource';

export function buildAdminHistoryRowsFromGroup(
  inputCollections: GameBusInputCollectionsPayload | null,
  serviceDates: readonly string[],
): AdminHistoryServiceRow[] {
  return serviceDates.map((serviceDate) => {
    const state = resolveAdminServicePartialState(inputCollections, serviceDate);
    if (state.kind === 'complete') {
      return {
        serviceDate,
        status: 'complete',
        forecastCount: state.dailyResults.staffResults.length,
        hasCloseout: true,
      };
    }
    if (state.kind === 'closeout_only') {
      return {
        serviceDate,
        status: 'closeout_only',
        forecastCount: 0,
        hasCloseout: true,
      };
    }
    if (state.kind === 'forecast_only') {
      return {
        serviceDate,
        status: 'forecast_only',
        forecastCount: state.staffForecasts.length,
        hasCloseout: false,
      };
    }
    return {
      serviceDate,
      status: 'empty',
      forecastCount: 0,
      hasCloseout: false,
    };
  });
}

export function buildAdminHistoryRowsFromFixtures(
  serviceDates: readonly string[],
): AdminHistoryServiceRow[] {
  return serviceDates.map((serviceDate) => {
    const daily = buildFixtureDailyServiceResults(serviceDate);
    if (!daily) {
      return {
        serviceDate,
        status: 'empty',
        forecastCount: 0,
        hasCloseout: false,
      };
    }
    return {
      serviceDate,
      status: 'complete',
      forecastCount: daily.staffResults.length,
      hasCloseout: true,
    };
  });
}
