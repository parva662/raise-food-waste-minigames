import { formatGrams } from './useChefResultsData';
import { buildCustomerEstimateDifferenceLabel, getCategoryOutcomeKind } from './forecastInterpretation';
import type { StaffDailyResult } from './types';

export function formatStaffTableCustomerDifference(result: StaffDailyResult): string {
  const label = buildCustomerEstimateDifferenceLabel(
    result.forecastCustomers,
    result.actualCustomers,
  );
  if (label.primary === 'On target') return 'On target';
  const magnitude = Math.abs(result.customerForecastDifference);
  if (label.secondary === 'customers high') return `${magnitude} high`;
  if (label.secondary === 'customers low') return `${magnitude} low`;
  return label.primary;
}

export function formatStaffDetailCustomerDifference(result: StaffDailyResult): string {
  const label = buildCustomerEstimateDifferenceLabel(
    result.forecastCustomers,
    result.actualCustomers,
  );
  if (!label.secondary) return label.primary;
  const magnitude = Math.abs(result.customerForecastDifference);
  return `${magnitude} customers ${label.secondary.replace('customers ', '')}`;
}

export function formatNormalizedRate(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return 'Unavailable';
  return `${value.toFixed(1)} g/customer`;
}

export function formatCustomerErrorCount(value: number): string {
  return `${value.toFixed(0)} customers`;
}

export function formatStaffTableCustomerForecast(result: StaffDailyResult): {
  primary: string;
  secondary: string;
} {
  const primary = String(result.forecastCustomers);
  const label = buildCustomerEstimateDifferenceLabel(
    result.forecastCustomers,
    result.actualCustomers,
  );
  if (label.primary === 'On target') {
    return { primary, secondary: 'On target' };
  }
  const magnitude = Math.abs(result.customerForecastDifference);
  const direction = label.secondary === 'customers high' ? 'high' : 'low';
  return {
    primary,
    secondary: `${magnitude} ${direction} vs ${result.actualCustomers} actual`,
  };
}

export function formatManagementCategoryOutcome(
  simulatedOverproductionGrams: number,
  simulatedShortageGrams: number,
): string {
  const kind = getCategoryOutcomeKind(simulatedOverproductionGrams, simulatedShortageGrams);
  const grams =
    kind === 'shortage' ? simulatedShortageGrams : simulatedOverproductionGrams;
  if (kind === 'on-target') return 'On target';
  const formatted = formatGrams(grams);
  return kind === 'shortage' ? `${formatted} shortage` : `${formatted} surplus`;
}
