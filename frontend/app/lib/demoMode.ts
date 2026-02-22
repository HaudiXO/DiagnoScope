/**
 * demoMode.ts
 * -----------
 * Re-exports USE_MOCK from the centralised config module.
 * Kept for backward compatibility with existing imports.
 */

export { USE_MOCK } from './config';

/** Possible fixture-origin modes attached to a DiagnoseResponse. */
export type FixtureMode = 'demo' | 'fallback';
