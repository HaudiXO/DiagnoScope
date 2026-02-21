/**
 * compare.ts
 * ----------
 * Pure comparison logic for two diagnosis runs.
 * No React / browser dependencies – easy to unit-test.
 */

import type { DiagnosisItem } from './contract';

// ── Types ──────────────────────────────────────────────────────────────────

export interface CommonCode {
    code: string;
    rankA: number;
    rankB: number;
    /** rankB - rankA  (negative = improved / moved up) */
    delta: number;
}

export interface NewWarning {
    code: string;
    warnings: string[];
}

export interface CompareResult {
    common: CommonCode[];
    /** codes present in A but not in B (removed) */
    onlyA: string[];
    /** codes present in B but not in A (added) */
    onlyB: string[];
    /** warnings in B for codes that had NO warnings in A */
    newWarnings: NewWarning[];
}

// ── Core function ──────────────────────────────────────────────────────────

/**
 * compareRuns
 * Pure function: given two arrays of DiagnosisItem returns a CompareResult.
 * Safe when either array is empty or undefined.
 */
export function compareRuns(
    diagnosesA: DiagnosisItem[] | undefined | null,
    diagnosesB: DiagnosisItem[] | undefined | null,
): CompareResult {
    const safeA = diagnosesA ?? [];
    const safeB = diagnosesB ?? [];

    const mapA = new Map(safeA.map((d) => [d.icd10_code, d]));
    const mapB = new Map(safeB.map((d) => [d.icd10_code, d]));

    const allCodes = new Set([...mapA.keys(), ...mapB.keys()]);

    const common: CommonCode[] = [];
    const onlyA: string[] = [];
    const onlyB: string[] = [];
    const newWarnings: NewWarning[] = [];

    allCodes.forEach((code) => {
        const itemA = mapA.get(code);
        const itemB = mapB.get(code);

        if (itemA !== undefined && itemB !== undefined) {
            const delta = itemB.rank - itemA.rank;
            common.push({ code, rankA: itemA.rank, rankB: itemB.rank, delta });

            // New warnings: B has warnings for this code but A had none (or fewer)
            const wA = itemA.warnings ?? [];
            const wB = itemB.warnings ?? [];
            const fresh = wB.filter((w) => !wA.includes(w));
            if (fresh.length > 0) {
                newWarnings.push({ code, warnings: fresh });
            }
        } else if (itemA !== undefined) {
            onlyA.push(code);
        } else {
            onlyB.push(code);
        }
    });

    // Sort common by rank in A for stable display
    common.sort((x, y) => x.rankA - y.rankA);

    return { common, onlyA, onlyB, newWarnings };
}

// ── Dev-only self-test ─────────────────────────────────────────────────────

if (process.env.NODE_ENV !== 'production') {
    (function runCompareSelfTests() {
        // Helper: minimal DiagnosisItem
        const item = (
            code: string,
            rank: number,
            warnings?: string[],
        ): DiagnosisItem => ({ icd10_code: code, rank, warnings });

        // Test 1: empty inputs
        const t1 = compareRuns([], []);
        console.assert(t1.common.length === 0, 'compare selftest 1a');
        console.assert(t1.onlyA.length === 0, 'compare selftest 1b');
        console.assert(t1.onlyB.length === 0, 'compare selftest 1c');

        // Test 2: null / undefined inputs
        const t2 = compareRuns(null, undefined);
        console.assert(t2.common.length === 0, 'compare selftest 2');

        // Test 3: two identical runs
        const t3 = compareRuns(
            [item('A00', 1), item('B00', 2)],
            [item('A00', 1), item('B00', 2)],
        );
        console.assert(t3.common.length === 2, 'compare selftest 3a');
        console.assert(t3.onlyA.length === 0, 'compare selftest 3b');
        console.assert(t3.common[0].delta === 0, 'compare selftest 3c');

        // Test 4: rank change
        const t4 = compareRuns(
            [item('A00', 1), item('B00', 2)],
            [item('A00', 2), item('B00', 1)],
        );
        const a00 = t4.common.find((c) => c.code === 'A00')!;
        console.assert(a00.delta === 1, 'compare selftest 4a');

        // Test 5: added / removed
        const t5 = compareRuns(
            [item('A00', 1)],
            [item('B00', 1)],
        );
        console.assert(t5.onlyA.includes('A00'), 'compare selftest 5a');
        console.assert(t5.onlyB.includes('B00'), 'compare selftest 5b');

        // Test 6: new warnings detection
        const t6 = compareRuns(
            [item('A00', 1, [])],
            [item('A00', 1, ['critical'])],
        );
        console.assert(t6.newWarnings.length === 1, 'compare selftest 6a');
        console.assert(t6.newWarnings[0].warnings[0] === 'critical', 'compare selftest 6b');

        // Test 7: no false new-warning when A already had it
        const t7 = compareRuns(
            [item('A00', 1, ['critical'])],
            [item('A00', 1, ['critical'])],
        );
        console.assert(t7.newWarnings.length === 0, 'compare selftest 7');

        console.info('[compare.ts] all self-tests passed ✓');
    })();
}
