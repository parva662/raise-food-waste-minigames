import { resolveMealSlotsForDate } from '../../services/mealSlots';
import { getPortionWeightGrams } from '../../serviceCloseout/portionWeight';
import type { CloseoutCategoryKey } from '../../serviceCloseout/types';
import type { GameBusChefForecast } from '../../serviceCloseout/forecast/gameBusChefForecastTypes';
import { forecastCategoryQuantity } from '../../serviceCloseout/forecast/parseGameBusChefForecast';
import type { ChefForecastForCalculation } from '../types';

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

  return {
    userId: forecast.actorId,
    userName: forecast.actorName,
    targetDate: forecast.targetDate,
    forecastTotalCustomers: forecast.forecastTotalCustomers,
    main: categoryInput('main', itemIdFor('main'), mainQuantity),
    vegetarian: categoryInput('vegetarian', itemIdFor('vegetarian'), vegetarianQuantity),
    soup: categoryInput('soup', itemIdFor('soup'), soupQuantity),
    dessert: categoryInput('dessert', itemIdFor('dessert'), dessertQuantity ?? 0),
  };
}
