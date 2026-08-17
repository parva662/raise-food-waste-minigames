import { getRawChefForecastsInput } from '../../gamebus/inputCollections';
import type { GameBusInputCollectionsPayload } from '../../gamebus/types';
import type { CloseoutChefForecastResolution } from './gameBusChefForecastTypes';
import { NO_CLOSEOUT_FORECAST_MESSAGE } from './gameBusChefForecastTypes';
import { parseGameBusChefForecastActivities } from './parseGameBusChefForecast';
import { selectLatestForecastForDate } from './selectCloseoutForecast';
import { buildSyntheticCloseoutChefForecast } from './syntheticCloseoutChefForecast';

export function resolveCloseoutChefForecast(
  rawChefForecasts: unknown,
  closeoutDate: string,
): CloseoutChefForecastResolution {
  const { valid } = parseGameBusChefForecastActivities(rawChefForecasts);
  const forecast = selectLatestForecastForDate(valid, closeoutDate);

  if (!forecast) {
    return {
      status: 'no_forecast',
      forecast: null,
      message: NO_CLOSEOUT_FORECAST_MESSAGE,
    };
  }

  return { status: 'matched', forecast, isSynthetic: false };
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
    return { status: 'standalone', forecast: null };
  }

  if (!inputCollectionsReady) {
    return { status: 'pending', forecast: null };
  }

  const raw = getRawChefForecastsInput(inputCollections);
  const realResolution = resolveCloseoutChefForecast(raw, closeoutDate);
  if (realResolution.status === 'matched') {
    return realResolution;
  }

  if (options.syntheticForecastFallback) {
    return {
      status: 'matched',
      forecast: buildSyntheticCloseoutChefForecast(closeoutDate),
      isSynthetic: true,
    };
  }

  return realResolution;
}
