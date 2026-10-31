/**
 * Next.js signals "this page must be rendered dynamically" by throwing an
 * error with `digest: 'DYNAMIC_SERVER_USAGE'`. Helpers that intentionally
 * swallow database/auth errors must let this one bubble up, otherwise the
 * page could be cached as an empty static page.
 */
export const isNextDynamicError = (error: unknown): boolean =>
  typeof error === 'object' &&
  error !== null &&
  'digest' in error &&
  (error as { digest?: unknown }).digest === 'DYNAMIC_SERVER_USAGE';
