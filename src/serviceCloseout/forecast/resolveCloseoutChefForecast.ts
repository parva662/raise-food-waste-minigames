import {
  extractGroupActivities,
  filterActivitiesByTemplateReference,
  getRawKitchenGroupActivitiesInput,
} from '../../gamebus/groupActivities';
import type { GameBusInputCollectionsPayload } from '../../gamebus/types';
import type { CloseoutChefForecastResolution } from './gameBusChefForecastTypes';
import { NO_CLOSEOUT_FORECAST_MESSAGE } from './gameBusChefForecastTypes';
import { parseGameBusChefForecastActivities } from './parseGameBusChefForecast';
import { selectForecastsForDate } from './selectCloseoutForecast';
import { buildSyntheticCloseoutChefForecast } from './syntheticCloseoutChefForecast';

const CHEF_FORECAST_TEMPLATE = 'chefForecast';

function parseChefForecastsFromGroupActivities(rawActivities: unknown) {
  const activities = extractGroupActivities(rawActivities);
  const chefForecastActivities = filterActivitiesByTemplateReference(
    activities,
    CHEF_FORECAST_TEMPLATE,
  );
  return parseGameBusChefForecastActivities(chefForecastActivities);
}

export function resolveCloseoutChefForecast(
  rawGroupActivities: unknown,
  closeoutDate: string,
): CloseoutChefForecastResolution {
  const { valid } = parseChefForecastsFromGroupActivities(rawGroupActivities);
  const forecasts = selectForecastsForDate(valid, closeoutDate);

  if (forecasts.length === 0) {
    return {
      status: 'no_forecast',
      forecasts: [],
      message: NO_CLOSEOUT_FORECAST_MESSAGE,
    };
  }

  return { status: 'matched', forecasts, isSynthetic: false };
}

export interface ResolveCloseoutChefForecastOptions {
  syntheticForecastFallback?: boolean;
}

export function resolveCloseoutChefForecastFromInputCollections(
  inputCollections: GameBusInputCollectionsPayload | null,
  closeoutDate: string,
  embedded: boolean,
  inputCollectionsReady: boolean,
  options: ResolveCloseoutChefForecastOptions = {},
): CloseoutChefForecastResolution {
  if (!embedded) {
    return { status: 'standalone', forecasts: [] };
  }

  if (!inputCollectionsReady) {
    return { status: 'pending', forecasts: [] };
  }

  const raw = getRawKitchenGroupActivitiesInput(inputCollections);
  const realResolution = resolveCloseoutChefForecast(raw, closeoutDate);
  if (realResolution.status === 'matched') {
    return realResolution;
  }

  if (options.syntheticForecastFallback) {
    return {
      status: 'matched',
      forecasts: [buildSyntheticCloseoutChefForecast(closeoutDate)],
      isSynthetic: true,
    };
  }

  return realResolution;
}
