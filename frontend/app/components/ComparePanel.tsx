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
        <div className="mt-6 p-4 border border-[var(--color-border)] rounded-[var(--radius-md)] bg-[var(--color-surface)] shadow-[var(--shadow-sm)] space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h2 className="font-semibold text-[var(--color-fg)]">Compare Results</h2>
                <button
                    type="button"
                    onClick={onClose}
                    className="text-xs text-[var(--color-muted)] underline hover:text-[var(--color-fg)] hover:no-underline"
                >
                    Close
                </button>
            </div>

            {/* Run labels */}
            <div className="text-xs text-[var(--color-muted)] space-y-0.5">
                <p><span className="font-semibold text-[var(--color-fg)]">A:</span> {new Date(a.createdAt).toLocaleString()} — {a.symptoms.slice(0, 60)}…</p>
                <p><span className="font-semibold text-[var(--color-fg)]">B:</span> {new Date(b.createdAt).toLocaleString()} — {b.symptoms.slice(0, 60)}…</p>
            </div>

            {/* ── Delta summary ── */}
            {!isEmpty && (
                <div className="flex flex-wrap gap-2 text-xs">
                    <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 bg-[var(--color-elevated)] border border-[var(--color-border)] text-[var(--color-fg)] font-medium">
                        {common.length} common
                    </span>
                    {onlyB.length > 0 && (
                        <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 bg-[var(--color-primary-soft)] text-[var(--color-primary)] font-medium">
                            +{onlyB.length} added
                        </span>
                    )}
                    {onlyA.length > 0 && (
                        <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 bg-[color-mix(in_srgb,var(--color-danger)_20%,transparent)] text-[var(--color-danger)] font-medium">
                            −{onlyA.length} removed
                        </span>
                    )}
                    {newWarnings.length > 0 && (
                        <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 bg-[var(--color-amber-bg)] text-[var(--color-warning)] border border-[var(--color-warning)]/20 font-medium">
                            ⚠ {newWarnings.length} new warning{newWarnings.length > 1 ? 's' : ''}
                        </span>
                    )}
                </div>
            )}

            {/* ── New warnings alert ── */}
            {newWarnings.length > 0 && (
                <div className="rounded-[var(--radius-md)] border border-[var(--color-warning)]/50 bg-[var(--color-amber-bg)] p-3 space-y-1">
                    <p className="text-xs font-semibold text-[var(--color-warning)]">
                        ⚠ New warnings appeared in run B
                    </p>
                    {newWarnings.map(({ code, warnings }) => (
                        <div key={code} className="text-xs text-[var(--color-warning)]/80">
                            <span className="font-mono font-semibold">{code}:</span>{' '}
                            {warnings.join(' · ')}
                        </div>
                    ))}
                </div>
            )}

            {/* ── Common codes table ── */}
            {common.length > 0 && (
                <div>
                    <p className="text-xs font-semibold mb-1 text-[var(--color-fg)]">
                        Common ICD-10 codes ({common.length})
                    </p>
                    <table className="text-xs w-full">
                        <thead>
                            <tr className="text-left text-[var(--color-muted)] border-b border-[var(--color-border)]">
                                <th className="pr-4 py-1.5 font-medium">Code</th>
                                <th className="pr-4 py-1.5 font-medium">Rank A</th>
                                <th className="py-1.5 font-medium">Rank B</th>
                                <th className="py-1.5 font-medium">Δ</th>
                            </tr>
                        </thead>
                        <tbody>
                            {common.map(({ code, rankA, rankB, delta }) => (
                                <tr key={code} className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-elevated)] transition-colors">
                                    <td className="pr-4 py-2 font-mono text-[var(--color-primary)]">{code}</td>
                                    <td className="pr-4 py-2 text-[var(--color-fg)]">{rankA}</td>
                                    <td className="py-2 text-[var(--color-fg)]">{rankB}</td>
                                    <td className={`py-2 font-semibold ${delta < 0
                                        ? 'text-[var(--color-primary)]'
                                        : delta > 0
                                            ? 'text-[var(--color-danger)]'
                                            : 'text-[var(--color-muted)]'
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
                    <p className="text-xs font-semibold mb-1 text-[var(--color-danger)]">
                        Removed (only in A)
                    </p>
                    <p className="text-xs font-mono text-[var(--color-muted)] bg-[var(--color-elevated)] p-2 rounded-[var(--radius-sm)] border border-[var(--color-border)]">
                        {onlyA.join(', ')}
                    </p>
                </div>
            )}

            {/* ── Only in B ── */}
            {onlyB.length > 0 && (
                <div>
                    <p className="text-xs font-semibold mb-1 text-[var(--color-primary)]">
                        Added (only in B)
                    </p>
                    <p className="text-xs font-mono text-[var(--color-muted)] bg-[var(--color-elevated)] p-2 rounded-[var(--radius-sm)] border border-[var(--color-border)]">
                        {onlyB.join(', ')}
                    </p>
                </div>
            )}

            {isEmpty && (
                <p className="text-xs text-[var(--color-muted)] text-center py-4 bg-[var(--color-elevated)] rounded-[var(--radius-md)]">No diagnoses to compare.</p>
            )}
        </div>
    );
}
