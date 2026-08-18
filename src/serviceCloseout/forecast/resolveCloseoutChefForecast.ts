import {
  extractGroupActivities,
  filterActivitiesByTemplateReference,
  getRawKitchenGroupActivitiesInput,
} from '../../gamebus/groupActivities';
import { getAuthenticatedGameBusUser } from '../../gamebus/inputCollections';
import type { GameBusInputCollectionsPayload } from '../../gamebus/types';
import type { CloseoutChefForecastResolution } from './gameBusChefForecastTypes';
import { NO_CLOSEOUT_FORECAST_MESSAGE } from './gameBusChefForecastTypes';
import { parseGameBusChefForecastActivities } from './parseGameBusChefForecast';
import { selectCurrentUserForecastForDate } from './selectCloseoutForecast';
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

function toMatchedForecast(forecast: NonNullable<ReturnType<typeof selectCurrentUserForecastForDate>>) {
  return {
    status: 'matched' as const,
    forecasts: [forecast],
    isSynthetic: false as const,
  };
}

export function resolveCloseoutChefForecast(
  rawGroupActivities: unknown,
  closeoutDate: string,
  authenticatedUserId: string | null,
): CloseoutChefForecastResolution {
  if (!authenticatedUserId) {
    return {
      status: 'no_forecast',
      forecasts: [],
      message: NO_CLOSEOUT_FORECAST_MESSAGE,
    };
  }

  const { valid } = parseChefForecastsFromGroupActivities(rawGroupActivities);
  const forecast = selectCurrentUserForecastForDate(valid, closeoutDate, authenticatedUserId);

  if (!forecast) {
    return {
      status: 'no_forecast',
      forecasts: [],
      message: NO_CLOSEOUT_FORECAST_MESSAGE,
    };
  }

  return toMatchedForecast(forecast);
}

export interface ResolveCloseoutChefForecastOptions {
  syntheticForecastFallback?: boolean;
  authenticatedUserId?: string | null;
  authenticatedUserName?: string | null;
}

function resolveSyntheticActor(
  inputCollections: GameBusInputCollectionsPayload | null,
  authenticatedUserId: string,
  options: ResolveCloseoutChefForecastOptions,
): { id: string; name: string } {
  const fromMe = getAuthenticatedGameBusUser(inputCollections);
  if (fromMe?.id === authenticatedUserId) {
    return { id: fromMe.id, name: fromMe.name };
  }
  if (options.authenticatedUserName) {
    return { id: authenticatedUserId, name: options.authenticatedUserName };
  }
  return { id: authenticatedUserId, name: authenticatedUserId };
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

  const authenticatedUserId =
    options.authenticatedUserId ?? getAuthenticatedGameBusUser(inputCollections)?.id ?? null;
  const raw = getRawKitchenGroupActivitiesInput(inputCollections);
  const realResolution = resolveCloseoutChefForecast(raw, closeoutDate, authenticatedUserId);
  if (realResolution.status === 'matched') {
    return realResolution;
  }

  if (options.syntheticForecastFallback && authenticatedUserId) {
    return {
      status: 'matched',
      forecasts: [
        buildSyntheticCloseoutChefForecast(
          closeoutDate,
          resolveSyntheticActor(inputCollections, authenticatedUserId, options),
        ),
      ],
      isSynthetic: true,
    };
  }

  return realResolution;
}
