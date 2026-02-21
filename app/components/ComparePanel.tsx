'use client';

/**
 * ComparePanel
 * ------------
 * Compares two HistoryEntry items side-by-side.
 * Computation delegated to the pure compareRuns() utility.
 */

import { compareRuns } from '../lib/compare';
import type { HistoryEntry } from '../lib/history';

interface Props {
    a: HistoryEntry;
    b: HistoryEntry;
    onClose: () => void;
}

export default function ComparePanel({ a, b, onClose }: Props) {
    const { common, onlyA, onlyB, newWarnings } = compareRuns(
        a.parsedDiagnoses,
        b.parsedDiagnoses,
    );

    const isEmpty = common.length === 0 && onlyA.length === 0 && onlyB.length === 0;

    return (
        <div className="mt-6 p-4 border border-blue-300 dark:border-blue-700 rounded-lg bg-blue-50 dark:bg-blue-900/20 space-y-4">
            {/* Header */}
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

            {/* Run labels */}
            <div className="text-xs text-blue-700 dark:text-blue-300 space-y-0.5">
                <p><span className="font-semibold">A:</span> {new Date(a.createdAt).toLocaleString()} — {a.symptoms.slice(0, 60)}…</p>
                <p><span className="font-semibold">B:</span> {new Date(b.createdAt).toLocaleString()} — {b.symptoms.slice(0, 60)}…</p>
            </div>

            {/* ── Delta summary ── */}
            {!isEmpty && (
                <div className="flex flex-wrap gap-2 text-xs">
                    <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 font-medium">
                        {common.length} common
                    </span>
                    {onlyB.length > 0 && (
                        <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 font-medium">
                            +{onlyB.length} added
                        </span>
                    )}
                    {onlyA.length > 0 && (
                        <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 font-medium">
                            −{onlyA.length} removed
                        </span>
                    )}
                    {newWarnings.length > 0 && (
                        <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200 font-medium">
                            ⚠ {newWarnings.length} new warning{newWarnings.length > 1 ? 's' : ''}
                        </span>
                    )}
                </div>
            )}

            {/* ── New warnings alert ── */}
            {newWarnings.length > 0 && (
                <div className="rounded-md border border-amber-300 dark:border-amber-600 bg-amber-50 dark:bg-amber-900/30 p-3 space-y-1">
                    <p className="text-xs font-semibold text-amber-800 dark:text-amber-300">
                        ⚠ New warnings appeared in run B
                    </p>
                    {newWarnings.map(({ code, warnings }) => (
                        <div key={code} className="text-xs text-amber-700 dark:text-amber-400">
                            <span className="font-mono font-semibold">{code}:</span>{' '}
                            {warnings.join(' · ')}
                        </div>
                    ))}
                </div>
            )}

            {/* ── Common codes table ── */}
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
                            {common.map(({ code, rankA, rankB, delta }) => (
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
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* ── Only in A ── */}
            {onlyA.length > 0 && (
                <div>
                    <p className="text-xs font-semibold mb-1 text-red-700 dark:text-red-400">
                        Removed (only in A)
                    </p>
                    <p className="text-xs font-mono text-gray-600 dark:text-gray-400">
                        {onlyA.join(', ')}
                    </p>
                </div>
            )}

            {/* ── Only in B ── */}
            {onlyB.length > 0 && (
                <div>
                    <p className="text-xs font-semibold mb-1 text-green-700 dark:text-green-400">
                        Added (only in B)
                    </p>
                    <p className="text-xs font-mono text-gray-600 dark:text-gray-400">
                        {onlyB.join(', ')}
                    </p>
                </div>
            )}

            {isEmpty && (
                <p className="text-xs text-gray-500">No diagnoses to compare.</p>
            )}
        </div>
    );
}
