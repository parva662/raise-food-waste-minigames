import { fromZonedTime, toZonedTime } from 'date-fns-tz';
import { CHEF_CONFIG } from '../config/chef';
import { addDaysToIsoDate } from '../utils/dates';

function secondsOfDay(time: string): number {
  const [hours, minutes, seconds] = time.split(':').map(Number);
  return (hours ?? 0) * 3600 + (minutes ?? 0) * 60 + (seconds ?? 0);
}

const GRACE_WINDOW_OPENS_SECONDS = secondsOfDay(CHEF_CONFIG.graceWindowOpensAt);
const WINDOW_SWITCH_SECONDS = secondsOfDay(CHEF_CONFIG.windowSwitchAt);

/** 08:00 — the same-day grace window opening time. */
export const CHEF_GRACE_WINDOW_OPENS_LABEL = CHEF_CONFIG.graceWindowOpensAt.slice(0, 5);

/** 08:30 — grace window closes, advance window for the next service opens. */
export const CHEF_WINDOW_SWITCH_LABEL = CHEF_CONFIG.windowSwitchAt.slice(0, 5);

/** Seconds since midnight Europe/Helsinki for an absolute instant. */
export function getChefHelsinkiSecondsOfDay(instant: Date): number {
  const zoned = toZonedTime(instant, CHEF_CONFIG.timezone);
  return zoned.getHours() * 3600 + zoned.getMinutes() * 60 + zoned.getSeconds();
}

/** 08:00:00–08:29:59 Helsinki — the same-day grace window for that day's own service. */
export function isWithinChefGraceWindowTime(instant: Date): boolean {
  const seconds = getChefHelsinkiSecondsOfDay(instant);
  return seconds >= GRACE_WINDOW_OPENS_SECONDS && seconds < WINDOW_SWITCH_SECONDS;
}

/** 08:30:00–23:59:59 Helsinki — the advance window for the next operational service. */
export function isWithinChefAdvanceWindowTime(instant: Date): boolean {
  return getChefHelsinkiSecondsOfDay(instant) >= WINDOW_SWITCH_SECONDS;
}

/** True while the day's own service is still the target, i.e. before 08:30 Helsinki. */
export function isBeforeChefWindowSwitch(instant: Date): boolean {
  return getChefHelsinkiSecondsOfDay(instant) < WINDOW_SWITCH_SECONDS;
}

/** 08:30:00 Helsinki on the given service date — the end of its grace window. */
export function getChefGraceWindowEndInstant(isoDate: string): Date {
  return fromZonedTime(`${isoDate} ${CHEF_CONFIG.windowSwitchAt}`, CHEF_CONFIG.timezone);
}

/** Midnight Helsinki closing the given operational day — the end of its advance window. */
export function getChefAdvanceWindowEndInstant(isoDate: string): Date {
  return fromZonedTime(`${addDaysToIsoDate(isoDate, 1)} 00:00:00`, CHEF_CONFIG.timezone);
}
