import type { DailyMealSlots } from '../types/mealChoice';
import type { ChefForecastCompleteDraft, ChefForecastDraft, ChefForecastSubmission } from '../chef/types';
import { hasChefConfidenceAnswer, hasChefNotesAnswer, trimChefNotes } from '../chef/optionalFields';

/** Required property references for chefForecast ACTIVITY. */
export const CHEF_FORECAST_REQUIRED_REFS = [
  'targetDate',
  'forecastTotalCustomers',
  'mainItemId',
  'forecastMeat',
  'vegetarianItemId',
  'forecastVegetarian',
  'soupItemId',
  'forecastSoup',
  'dessertItemId',
  'forecastDessert',
  'timingStatus',
  'submittedAt',
] as const;

/** Optional property references — included only when the chef entered a value. */
export const CHEF_FORECAST_OPTIONAL_REFS = ['confidence', 'notes'] as const;

export type ChefForecastRequiredRef = (typeof CHEF_FORECAST_REQUIRED_REFS)[number];
export type ChefForecastOptionalRef = (typeof CHEF_FORECAST_OPTIONAL_REFS)[number];
export type ChefForecastPropertyRef = ChefForecastRequiredRef | ChefForecastOptionalRef;

export type ChefForecastRequiredValueMap = {
  targetDate: { value: string };
  forecastTotalCustomers: { value: number };
  mainItemId: { value: string };
  forecastMeat: { value: number };
  vegetarianItemId: { value: string };
  forecastVegetarian: { value: number };
  soupItemId: { value: string };
  forecastSoup: { value: number };
  dessertItemId: { value: string };
  forecastDessert: { value: number };
  timingStatus: { value: ChefForecastSubmission['timingStatus'] };
  submittedAt: { value: string };
};

export type ChefForecastOptionalValueMap = {
  confidence?: { value: number };
  notes?: { value: string };
};

export type ChefForecastValueMap = ChefForecastRequiredValueMap & ChefForecastOptionalValueMap;

/** Canonical required property order for chefForecast. */
export function orderedChefForecastRequiredPropertyRefs(): readonly ChefForecastRequiredRef[] {
  return CHEF_FORECAST_REQUIRED_REFS;
}

/** Optional refs to include for a draft (after required properties). */
export function optionalChefForecastPropertyRefsForDraft(
  draft: ChefForecastDraft,
): ChefForecastOptionalRef[] {
  const refs: ChefForecastOptionalRef[] = [];
  if (hasChefConfidenceAnswer(draft.confidence)) {
    refs.push('confidence');
  }
  if (hasChefNotesAnswer(draft.notes)) {
    refs.push('notes');
  }
  return refs;
}

/**
 * Maps required chefForecast property values.
 * All four item IDs and all four forecast quantities are always included (including zeros).
 */
export function mapChefForecastRequired(
  submission: ChefForecastSubmission,
  draft: ChefForecastCompleteDraft,
  slots: DailyMealSlots,
): ChefForecastRequiredValueMap {
  return {
    targetDate: { value: submission.targetDate },
    forecastTotalCustomers: { value: draft.expectedCustomers },
    mainItemId: { value: slots.main.id },
    forecastMeat: { value: draft.mainQuantity },
    vegetarianItemId: { value: slots.vegetarian.id },
    forecastVegetarian: { value: draft.vegetarianQuantity },
    soupItemId: { value: slots.soup.id },
    forecastSoup: { value: draft.soupQuantity },
    dessertItemId: { value: slots.dessert.id },
    forecastDessert: { value: draft.dessertQuantity },
    timingStatus: { value: submission.timingStatus },
    submittedAt: { value: submission.submittedAt },
  };
}

export function mapChefForecastOptional(draft: ChefForecastDraft): ChefForecastOptionalValueMap {
  const values: ChefForecastOptionalValueMap = {};
  if (hasChefConfidenceAnswer(draft.confidence)) {
    values.confidence = { value: draft.confidence as number };
  }
  if (hasChefNotesAnswer(draft.notes)) {
    values.notes = { value: trimChefNotes(draft.notes) };
  }
  return values;
}

/** @deprecated Use mapChefForecastRequired + mapChefForecastOptional */
export function mapChefForecast(
  submission: ChefForecastSubmission,
  draft: ChefForecastCompleteDraft,
  slots: DailyMealSlots,
): ChefForecastValueMap {
  return {
    ...mapChefForecastRequired(submission, draft, slots),
    ...mapChefForecastOptional(draft),
  };
}
