/**
 * config.ts
 * ---------
 * Centralised environment configuration.
 * UI code should import values from here — never read process.env directly.
 */

/** Base URL of the backend API (no trailing slash). */
export const API_BASE_URL: string =
    (
        process.env.NEXT_PUBLIC_API_BASE ||
        process.env.NEXT_PUBLIC_API_URL ||
        'http://127.0.0.1:8080'
    ).replace(/\/$/, '');

/**
 * Deprecated mock flag.
 * Forced off to keep the frontend in real API mode.
 */
export const USE_MOCK = false;

/** Request timeout in milliseconds. */
export const REQUEST_TIMEOUT_MS: number =
    Number(process.env.NEXT_PUBLIC_REQUEST_TIMEOUT_MS || '10000') || 10_000;
