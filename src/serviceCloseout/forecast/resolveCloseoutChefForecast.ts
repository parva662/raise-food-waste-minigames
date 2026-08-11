import { getRawChefForecastsInput } from '../../gamebus/inputCollections';
import type { GameBusInputCollectionsPayload } from '../../gamebus/types';
import type { CloseoutChefForecastResolution } from './gameBusChefForecastTypes';
import { NO_CLOSEOUT_FORECAST_MESSAGE } from './gameBusChefForecastTypes';
import { parseGameBusChefForecastActivities } from './parseGameBusChefForecast';
import { selectLatestForecastForDate } from './selectCloseoutForecast';

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

  return { status: 'matched', forecast };
}

export function resolveCloseoutChefForecastFromInputCollections(
  inputCollections: GameBusInputCollectionsPayload | null,
  closeoutDate: string,
  embedded: boolean,
  inputCollectionsReady: boolean,
): CloseoutChefForecastResolution {
  if (!embedded) {
    return { status: 'standalone', forecast: null };
  }

  if (!inputCollectionsReady) {
    return { status: 'pending', forecast: null };
  }

  const raw = getRawChefForecastsInput(inputCollections);
  return resolveCloseoutChefForecast(raw, closeoutDate);
}
