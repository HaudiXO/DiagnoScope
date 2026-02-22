/**
 * config.ts
 * ---------
 * Centralised environment configuration.
 * UI code should import values from here — never read process.env directly.
 */

const raw = (key: string, fallback = ''): string =>
    (typeof process !== 'undefined' ? process.env[key] : undefined) ?? fallback;

/** Base URL of the backend API (no trailing slash). */
export const API_BASE_URL: string =
    (raw('NEXT_PUBLIC_API_URL') || raw('NEXT_PUBLIC_API_BASE', '')).replace(/\/$/, '');

/**
 * Deprecated mock flag.
 * Forced off to keep the frontend in real API mode.
 */
export const USE_MOCK = false;

/** Request timeout in milliseconds. */
export const REQUEST_TIMEOUT_MS: number =
    Number(raw('NEXT_PUBLIC_REQUEST_TIMEOUT_MS', '10000')) || 10_000;
