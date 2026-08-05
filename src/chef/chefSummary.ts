import type { ChefForecastCompleteDraft } from './types';

export function isAllZeroForecast(draft: ChefForecastCompleteDraft): boolean {
  return (
    draft.expectedCustomers === 0 &&
    draft.mainQuantity === 0 &&
    draft.vegetarianQuantity === 0 &&
    draft.soupQuantity === 0 &&
    draft.dessertQuantity === 0
  );
}
