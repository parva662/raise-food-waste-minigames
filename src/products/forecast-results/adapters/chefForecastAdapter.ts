import { resolveMealSlotsForDate } from '@/shared/menu/mealSlots';
import { getPortionWeightGrams } from '@/products/service-closeout/portionWeight';
import type { CloseoutCategoryKey } from '@/products/service-closeout/types';
import type { GameBusChefForecast } from '@/products/service-closeout/forecast/gameBusChefForecastTypes';
import { forecastCategoryQuantity } from '@/products/service-closeout/forecast/parseGameBusChefForecast';
import type { ChefForecastForCalculation } from '@/products/forecast-results/types';

function categoryInput(
  key: CloseoutCategoryKey,
  itemId: string,
  forecastQuantity: number,
): ChefForecastForCalculation[CloseoutCategoryKey] {
  return {
    itemId,
    forecastQuantity,
    portionWeightGrams: getPortionWeightGrams(itemId, key),
  };
}

export function gameBusChefForecastToCalculationInput(
  forecast: GameBusChefForecast,
): ChefForecastForCalculation | null {
  const slots = resolveMealSlotsForDate(forecast.targetDate);
  if (!slots) return null;

  const itemIdFor = (key: CloseoutCategoryKey): string => {
    const fromForecast =
      key === 'main'
        ? forecast.mainItemId
        : key === 'vegetarian'
          ? forecast.vegetarianItemId
          : key === 'soup'
            ? forecast.soupItemId
            : forecast.dessertItemId;
    return fromForecast ?? slots[key].id;
  };

  const mainQuantity = forecastCategoryQuantity(forecast, 'main');
  const vegetarianQuantity = forecastCategoryQuantity(forecast, 'vegetarian');
  const soupQuantity = forecastCategoryQuantity(forecast, 'soup');
  const dessertQuantity = forecastCategoryQuantity(forecast, 'dessert');

  if (mainQuantity === null || vegetarianQuantity === null || soupQuantity === null) {
    return null;
  }

  // Approved Kitchen Forecast rule: soup and dessert are one soup-menu quantity.
  // Pilot activities may omit forecastDessert; never invent a deliberate zero dessert.
  const resolvedDessertQuantity = dessertQuantity ?? soupQuantity;

  return {
    userId: forecast.actorId,
    userName: forecast.actorName,
    targetDate: forecast.targetDate,
    forecastTotalCustomers: forecast.forecastTotalCustomers,
    main: categoryInput('main', itemIdFor('main'), mainQuantity),
    vegetarian: categoryInput('vegetarian', itemIdFor('vegetarian'), vegetarianQuantity),
    soup: categoryInput('soup', itemIdFor('soup'), soupQuantity),
    dessert: categoryInput('dessert', itemIdFor('dessert'), resolvedDessertQuantity),
  };
}
