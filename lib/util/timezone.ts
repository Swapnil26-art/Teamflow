import { cookies } from 'next/headers';

import { TIMEZONE_COOKIE } from '@/lib/util/timezone-shared';

export { TIMEZONE_COOKIE };

/**
 * Timezone configured by the browser (see `components/timezone-sync.tsx`).
 * Falls back to the server timezone when the cookie is not present yet.
 */
export const getTimeZone = (): string => {
  const cookieStore = cookies();
  const value = cookieStore.get(TIMEZONE_COOKIE)?.value;

  if (value) {
    try {
      // Validate the value before handing it to Intl.
      Intl.DateTimeFormat('en-US', { timeZone: value });
      return value;
    } catch {
      // Invalid timezone, fall through to the default.
    }
  }

  return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
};

/** Today's calendar day (`yyyy-MM-dd`) in the user's timezone. */
export const getTodayKey = (): string =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: getTimeZone(),
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
