/**
 * demoMode.ts
 * -----------
 * Reads NEXT_PUBLIC_USE_MOCK at module initialisation time (fallback to USE_MOCK).
 * Accepts "1" or "true" (case-insensitive) as truthy values.
 */

const raw = process.env.NEXT_PUBLIC_USE_MOCK ?? process.env.USE_MOCK ?? '';
export const USE_MOCK: boolean =
    raw === '1' || raw.toLowerCase() === 'true';

/** Possible fixture-origin modes attached to a DiagnoseResponse. */
export type FixtureMode = 'demo' | 'fallback';
