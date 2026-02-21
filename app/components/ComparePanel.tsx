'use client';

/**
 * ComparePanel
 * ------------
 * Compares two HistoryEntry items side-by-side.
 * Shows: common ICD-10 codes, changed ranks, new/dropped codes.
 */

import type { HistoryEntry } from '../lib/history';

interface Props {
    a: HistoryEntry;
    b: HistoryEntry;
    onClose: () => void;
}

export default function ComparePanel({ a, b, onClose }: Props) {
    const codesA = new Map(a.parsedDiagnoses.map((d) => [d.icd10_code, d.rank]));
    const codesB = new Map(b.parsedDiagnoses.map((d) => [d.icd10_code, d.rank]));

    const allCodes = new Set([...codesA.keys(), ...codesB.keys()]);

    const common: { code: string; rankA: number; rankB: number }[] = [];
    const onlyA: string[] = [];
    const onlyB: string[] = [];

    allCodes.forEach((code) => {
        const rA = codesA.get(code);
        const rB = codesB.get(code);
        if (rA !== undefined && rB !== undefined) {
            common.push({ code, rankA: rA, rankB: rB });
        } else if (rA !== undefined) {
            onlyA.push(code);
        } else {
            onlyB.push(code);
        }
    });

    common.sort((x, y) => x.rankA - y.rankA);

    return (
        <div className="mt-6 p-4 border border-blue-300 dark:border-blue-700 rounded-lg bg-blue-50 dark:bg-blue-900/20 space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="font-semibold text-blue-900 dark:text-blue-200">Compare Results</h2>
                <button
                    type="button"
                    onClick={onClose}
                    className="text-xs text-blue-600 dark:text-blue-400 underline hover:no-underline"
                >
                    Close
                </button>
            </div>

            <div className="text-xs text-blue-700 dark:text-blue-300 space-y-0.5">
                <p><span className="font-semibold">A:</span> {new Date(a.createdAt).toLocaleString()} — {a.symptoms.slice(0, 60)}…</p>
                <p><span className="font-semibold">B:</span> {new Date(b.createdAt).toLocaleString()} — {b.symptoms.slice(0, 60)}…</p>
            </div>

            {/* Common codes */}
            {common.length > 0 && (
                <div>
                    <p className="text-xs font-semibold mb-1 text-blue-800 dark:text-blue-300">
                        Common ICD-10 codes ({common.length})
                    </p>
                    <table className="text-xs w-full">
                        <thead>
                            <tr className="text-left text-blue-600 dark:text-blue-400">
                                <th className="pr-4 py-0.5">Code</th>
                                <th className="pr-4 py-0.5">Rank A</th>
                                <th className="py-0.5">Rank B</th>
                                <th className="py-0.5">Δ</th>
                            </tr>
                        </thead>
                        <tbody>
                            {common.map(({ code, rankA, rankB }) => {
                                const delta = rankB - rankA;
                                return (
                                    <tr key={code} className="border-t border-blue-200 dark:border-blue-800">
                                        <td className="pr-4 py-1 font-mono">{code}</td>
                                        <td className="pr-4 py-1">{rankA}</td>
                                        <td className="py-1">{rankB}</td>
                                        <td className={`py-1 font-semibold ${delta < 0
                                                ? 'text-green-600 dark:text-green-400'
                                                : delta > 0
                                                    ? 'text-red-500 dark:text-red-400'
                                                    : 'text-gray-500'
                                            }`}>
                                            {delta === 0 ? '=' : delta > 0 ? `+${delta}` : delta}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Only in A */}
            {onlyA.length > 0 && (
                <div>
                    <p className="text-xs font-semibold mb-1 text-blue-800 dark:text-blue-300">
                        Only in A
                    </p>
                    <p className="text-xs font-mono text-gray-600 dark:text-gray-400">
                        {onlyA.join(', ')}
                    </p>
                </div>
            )}

            {/* Only in B */}
            {onlyB.length > 0 && (
                <div>
                    <p className="text-xs font-semibold mb-1 text-blue-800 dark:text-blue-300">
                        Only in B
                    </p>
                    <p className="text-xs font-mono text-gray-600 dark:text-gray-400">
                        {onlyB.join(', ')}
                    </p>
                </div>
            )}

            {common.length === 0 && onlyA.length === 0 && onlyB.length === 0 && (
                <p className="text-xs text-gray-500">No diagnoses to compare.</p>
            )}
        </div>
    );
}
