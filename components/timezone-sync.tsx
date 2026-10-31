'use client';

import * as React from 'react';

import { TIMEZONE_COOKIE } from '@/lib/util/timezone-shared';

/**
 * Stores the browser timezone in a cookie so server components can compute
 * "today" in the same timezone the user sees.
 */
export default function TimezoneSync() {
  React.useEffect(() => {
    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (!timezone) return;

      const existing = document.cookie
        .split('; ')
        .find((cookie) => cookie.startsWith(`${TIMEZONE_COOKIE}=`));

      if (existing === `${TIMEZONE_COOKIE}=${encodeURIComponent(timezone)}`) {
        return;
      }

      document.cookie = `${TIMEZONE_COOKIE}=${encodeURIComponent(
        timezone,
      )}; path=/; max-age=31536000; samesite=lax`;
    } catch {
      // Ignore browsers that don't expose the timezone.
    }
  }, []);

  return null;
}
