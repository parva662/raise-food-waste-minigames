import { parseISO } from 'date-fns';
import { fromZonedTime } from 'date-fns-tz';
import { CHEF_CONFIG } from '../config/chef';
import type { GameBusChefForecast } from '../serviceCloseout/forecast/gameBusChefForecastTypes';

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

/** 09:00:00 Europe/Helsinki on the target service date — forecasts must be submitted before this instant. */
export function getChefForecastCutoffInstant(targetDate: string): Date {
  const local = `${targetDate} ${pad(CHEF_CONFIG.forecastCutoffHour)}:${pad(CHEF_CONFIG.forecastCutoffMinute)}:${pad(CHEF_CONFIG.forecastCutoffSecond)}`;
  return fromZonedTime(local, CHEF_CONFIG.timezone);
}

export function isChefForecastSubmissionInstantEligible(
  instant: Date,
  targetDate: string,
): boolean {
  return instant.getTime() < getChefForecastCutoffInstant(targetDate).getTime();
}

export function getChefForecastSubmissionInstant(forecast: GameBusChefForecast): Date | null {
  const iso = forecast.submittedAt ?? forecast.createdAt;
  if (!iso) return null;
  return parseISO(iso);
}

export function isChefForecastActivityEligible(forecast: GameBusChefForecast): boolean {
  const instant = getChefForecastSubmissionInstant(forecast);
  if (!instant) return false;
  return isChefForecastSubmissionInstantEligible(instant, forecast.targetDate);
}

export function chefForecastSubmissionSortKey(forecast: GameBusChefForecast): string {
  return forecast.submittedAt ?? forecast.createdAt ?? '';
}

export function formatChefForecastDeadlineLabel(): string {
  return `${pad(CHEF_CONFIG.forecastCutoffHour)}:${pad(CHEF_CONFIG.forecastCutoffMinute)} on service day`;
}
