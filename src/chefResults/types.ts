import type { CloseoutCategoryKey } from '../serviceCloseout/types';

export type ResultCategoryKey = CloseoutCategoryKey;

export const RESULT_CATEGORY_KEYS: readonly ResultCategoryKey[] = [
  'main',
  'vegetarian',
  'soup',
  'dessert',
] as const;

export const RESULT_CATEGORY_LABELS: Record<ResultCategoryKey, string> = {
  main: 'Main',
  vegetarian: 'Vegetarian',
  soup: 'Soup',
  dessert: 'Dessert',
};

/** Shared observed service reality for one category on a service date. */
export type ObservedCategoryReality = {
  itemId: string;
  actualPreparedQuantity: number;
  portionWeightGrams: number;
  actualPreparedWeightGrams: number;
  measuredOverproductionGrams: number;
  observedDemandWeightGrams: number;
};

/** Whole-canteen observed reality — identical for every staff evaluation on a date. */
export type ObservedServiceReality = {
  serviceDate: string;
  actualCustomers: number;
  main: ObservedCategoryReality;
  vegetarian: ObservedCategoryReality;
  soup: ObservedCategoryReality;
  dessert: ObservedCategoryReality;
};

/** Per-staff simulated category outcome against shared observed demand. */
export type StaffCategorySimulation = {
  itemId: string;
  forecastQuantity: number;
  portionWeightGrams: number;
  forecastProductionWeightGrams: number;
  actualPreparedQuantity: number;
  actualPreparedWeightGrams: number;
  measuredOverproductionGrams: number;
  observedDemandWeightGrams: number;
  simulatedOverproductionGrams: number;
  simulatedShortageGrams: number;
};

export type StaffDailyResult = {
  serviceDate: string;
  userId: string;
  userName: string;
  forecastCustomers: number;
  actualCustomers: number;
  customerForecastDifference: number;
  customerForecastAbsoluteError: number;
  main: StaffCategorySimulation;
  vegetarian: StaffCategorySimulation;
  soup: StaffCategorySimulation;
  dessert: StaffCategorySimulation;
  totalSimulatedOverproductionGrams: number;
  totalSimulatedShortageGrams: number;
};

export type DailyServiceResults = {
  serviceDate: string;
  observed: ObservedServiceReality;
  staffResults: StaffDailyResult[];
};

export type ChefForecastForCalculation = {
  userId: string;
  userName: string;
  targetDate: string;
  forecastTotalCustomers: number;
  main: CategoryForecastInput;
  vegetarian: CategoryForecastInput;
  soup: CategoryForecastInput;
  dessert: CategoryForecastInput;
};

export type CategoryForecastInput = {
  itemId: string;
  forecastQuantity: number;
  portionWeightGrams: number;
};

export type CloseoutCategoryForCalculation = {
  itemId: string;
  preparedQuantity: number;
  portionWeightGrams: number;
  overproductionGrams: number;
};

export type CloseoutForCalculation = {
  targetDate: string;
  actualCustomers: number;
  main: CloseoutCategoryForCalculation;
  vegetarian: CloseoutCategoryForCalculation;
  soup: CloseoutCategoryForCalculation;
  dessert: CloseoutCategoryForCalculation;
};

export type ServiceDayParticipation = {
  targetDate: string;
  participantUserIds: readonly string[];
};

export type StaffWeeklySummary = {
  userId: string;
  userName: string;
  participatedServiceCount: number;
  totalSimulatedOverproductionGrams: number;
  totalSimulatedShortageGrams: number;
  meanAbsoluteCustomerForecastError: number;
};
