/**
 * Shared timezone constants.
 *
 * Kept free of `next/headers` so client components can import the cookie
 * name without pulling server-only APIs into the client bundle.
 */
export const TIMEZONE_COOKIE = 'teamflow-tz';
