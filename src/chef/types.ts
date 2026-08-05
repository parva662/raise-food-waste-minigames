import type { TimingStatus } from '../types/declaration';

export type ChefForecastDraft = {
  /** null = unanswered; explicit number includes intentional zero */
  expectedCustomers: number | null;
  mainQuantity: number | null;
  vegetarianQuantity: number | null;
  soupQuantity: number | null;
  dessertQuantity: number | null;
  /** null = unanswered; omitted from ACTIVITY when null */
  confidence: number | null;
  notes: string;
};

export type ChefForecastCompleteDraft = {
  expectedCustomers: number;
  mainQuantity: number;
  vegetarianQuantity: number;
  soupQuantity: number;
  dessertQuantity: number;
  confidence: number | null;
  notes: string;
};

export type ChefForecastSubmission = {
  targetDate: string;
  timingStatus: TimingStatus;
  submittedAt: string;
};

export const CHEF_NOT_ENTERED_LABEL = 'Not entered';

export const CHEF_INCOMPLETE_FORM_MESSAGE =
  'Enter expected customers and all four menu-item forecasts to continue.';

export function createEmptyChefDraft(): ChefForecastDraft {
  return {
    expectedCustomers: null,
    mainQuantity: null,
    vegetarianQuantity: null,
    soupQuantity: null,
    dessertQuantity: null,
    confidence: null,
    notes: '',
  };
}

export function isChefForecastComplete(draft: ChefForecastDraft): draft is ChefForecastCompleteDraft {
  return (
    draft.expectedCustomers !== null &&
    draft.mainQuantity !== null &&
    draft.vegetarianQuantity !== null &&
    draft.soupQuantity !== null &&
    draft.dessertQuantity !== null
  );
}
