import { useEffect, useState } from 'react';
import { msUntilNextHelsinkiMidnight } from '@/shared/calendar/operationalServiceCalendar';

/**
 * Keep a React clock aligned to Europe/Helsinki midnight without a fixed 24h timer
 * (DST-safe) or waiting for a full page reload.
 */
export function useHelsinkiDashboardClock(): Date {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    let midnightTimeoutId: number | undefined;
    let cancelled = false;

    const refresh = () => {
      if (cancelled) return;
      setNow(new Date());
    };

    const scheduleMidnight = () => {
      if (midnightTimeoutId !== undefined) {
        window.clearTimeout(midnightTimeoutId);
      }
      const delayMs = Math.max(msUntilNextHelsinkiMidnight(new Date()) + 1, 25);
      midnightTimeoutId = window.setTimeout(() => {
        refresh();
        scheduleMidnight();
      }, delayMs);
    };

    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        refresh();
        scheduleMidnight();
      }
    };

    scheduleMidnight();
    const intervalId = window.setInterval(refresh, 60_000);
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      cancelled = true;
      if (midnightTimeoutId !== undefined) {
        window.clearTimeout(midnightTimeoutId);
      }
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  return now;
}
