/** Management-dashboard-only presentation helpers (do not change participant wording). */

export function formatCountLabel(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

export function formatAdminCustomerErrorCount(value: number): string {
  const rounded = Math.round(value);
  return formatCountLabel(rounded, 'customer', 'customers');
}

export function formatAdminCustomerDifference(magnitude: number, direction: 'high' | 'low'): string {
  const unit = magnitude === 1 ? 'customer' : 'customers';
  return `${magnitude} ${unit} ${direction}`;
}
