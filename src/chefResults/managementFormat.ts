import { buildCustomerEstimateDifferenceLabel } from './forecastInterpretation';
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
