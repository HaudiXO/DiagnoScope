/**
 * diagnoseMock.ts
 * ----------------
 * Re-exports existing fixture logic for diagnose mock/fallback.
 * No duplication — the real fixture selector lives in api.ts.
 */

// This file exists as a stable import point for mock diagnose data.
// The actual fixture selection is handled in app/lib/api.ts (getFallbackFixture).
// If you need a quick standalone mock response, use this:

import rawFixtures from '../fixtures/diagnose_fixtures.json';

interface FixtureEntry {
    _comment?: string;
    keywords: string[];
    request: unknown;
    response: unknown;
}

/**
 * Returns the first fixture response as a generic mock.
 */
export function getMockDiagnoseResponse(): unknown {
    const fixtures = rawFixtures as FixtureEntry[];
    return fixtures[0]?.response ?? { diagnoses: [] };
}
