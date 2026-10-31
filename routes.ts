/**
 * An array of routes that are accessible to the public
 * These routes do not require authentication
 * @type {string[]}
 */
export const publicRoutes = ['/', '/auth/new-verification'];

/**
 * Route prefixes that are accessible to the public.
 * Used for the marketing/docs area which is generated dynamically.
 * @type {string[]}
 */
export const publicPrefixes = ['/docs'];

/**
 * An array of routes that are used for authentication
 * These routes will redirect logged in users to the platform
 * @type {string[]}
 */
export const authRoutes = [
  '/auth/login',
  '/auth/register',
  '/auth/error',
  '/auth/reset',
  '/auth/new-password',
];

/**
 * The prefix for API authentication routes.
 * Only these API routes bypass middleware auth checks; every other API
 * route performs its own `auth()` check.
 * @type {string}
 */
export const apiAuthPrefix = '/api/auth';

/**
 * The default redirect path after logging in
 * @type {string}
 */
export const DEFAULT_LOGIN_REDIRECT = '/inbox';
export const LOGIN_PATH = '/auth/login';

export const isPublicRoute = (pathname: string) =>
  publicRoutes.includes(pathname) ||
  publicPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
