'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Section from '../components/Section';
import ComparePanel from '../components/ComparePanel';
import { type HistoryEntry } from '../lib/history';
import { useI18n } from '../../lib/i18n';
import type { Dictionary } from '../../lib/i18n';
import Button from '../components/ui/Button';
import Skeleton from '../components/ui/Skeleton';
import { historyRepository } from '../lib/repositories';

function formatDate(iso: string) {
    return new Date(iso).toLocaleString();
}

function modeBadge(mode: HistoryEntry['mode'], t: Dictionary) {
    if (!mode || mode === 'live') return null;
    const cls =
        mode === 'demo'
            ? 'bg-[var(--color-primary-soft)] text-[var(--color-primary)]'
            : 'bg-[var(--color-amber-bg)] text-[var(--color-warning)]';

    let label: string = mode;
    if (mode === 'demo') label = t.modeDemo || mode;
    if (mode === 'fallback') label = t.modeFallback || mode;

    return (
        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>
            {label}
        </span>
    );
}

export default function HistoryPage() {
    const { t } = useI18n();
    const router = useRouter();
    const [entries, setEntries] = useState<HistoryEntry[]>([]);
    const [corruptWarning, setCorruptWarning] = useState(false);
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [offset, setOffset] = useState(0);
    const limit = 20;
    const [total, setTotal] = useState(0);

    // IDs of the two entries selected for compare
    const [compareIds, setCompareIds] = useState<[string, string] | null>(null);

    async function load(nextOffset = offset) {
        setIsLoading(true);
        setError(null);
        try {
            const result = await historyRepository.listHistory({ limit, offset: nextOffset });
            setEntries(result.data.items);
            setTotal(result.data.total);
            setOffset(nextOffset);
            setCorruptWarning(false);
            setSelected(new Set());
            setCompareIds(null);
        } catch {
            setError(t.errorWord);
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        load(0);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    async function handleClear() {
        if (window.confirm(t.clearConfirm || 'Clear all history?')) {
            await historyRepository.clearHistory();
            await load(0);
        }
    }

    function toggleSelect(id: string) {
        setSelected((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                if (next.size >= 2) return prev; // max 2
                next.add(id);
            }
            return next;
        });
        setCompareIds(null);
    }

    function handleCompare() {
        const ids = Array.from(selected) as [string, string];
        setCompareIds(ids);
    }

    function handleRerun(symptoms: string) {
        // Navigate to / with the symptoms pre-filled via query param
        router.push(`/?symptoms=${encodeURIComponent(symptoms)}`);
    }

    const entryMap = new Map(entries.map((e) => [e.id, e]));
    const compareEntries =
        compareIds
            ? ([entryMap.get(compareIds[0]), entryMap.get(compareIds[1])] as [HistoryEntry, HistoryEntry] | [undefined, undefined])
            : null;

    return (
        <div className="space-y-6">
            <header className="mb-8">
                <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-[var(--color-fg)]">{t.historyTitle}</h1>
                        <p className="text-[var(--color-muted)] mt-2">{t.prevDiagnoses}</p>
                    </div>
                    {entries.length > 0 && (
                        <button
                            type="button"
                            onClick={handleClear}
                            className="text-sm text-[var(--color-danger)] border border-[color-mix(in_srgb,var(--color-danger)_30%,transparent)] rounded-[var(--radius-md)] px-3 py-1.5 hover:bg-[color-mix(in_srgb,var(--color-danger)_10%,transparent)] transition-colors"
                        >
                            {t.clearHistory}
                        </button>
                    )}
                </div>
            </header>

            {/* Corrupt localStorage warning */}
            {corruptWarning && (
                <div
                    role="status"
                    className="p-3 rounded-[var(--radius-lg)] border border-[color-mix(in_srgb,var(--color-warning)_30%,transparent)] bg-[var(--color-amber-bg)] text-[var(--color-warning)] text-sm"
                >
                    {t.historyCorrupt}
                </div>
            )}

            {/* Compare toolbar */}
            {selected.size > 0 && (
                <div className="flex items-center gap-3 p-3 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] text-sm shadow-[var(--shadow-sm)]">
                    <span className="text-[var(--color-fg)]">
                        {selected.size === 2 ? t.readyToCompare : t.selectOneMoreToCompare}
                    </span>
                    {selected.size === 2 && (
                        <button
                            type="button"
                            onClick={handleCompare}
                            className="px-3 py-1 bg-[var(--color-primary)] text-[#070A06] rounded-[var(--radius-md)] text-xs font-medium hover:bg-[var(--color-primary-hover)] transition-colors focus-ring"
                        >
                            {t.compare}
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={() => { setSelected(new Set()); setCompareIds(null); }}
                        className="text-xs text-[var(--color-muted)] hover:text-[var(--color-fg)] underline hover:no-underline ml-auto"
                    >
                        {t.cancel}
                    </button>
                </div>
            )}

            <Section title={t.recentAnalyses}>
                {isLoading ? (
                    <div className="space-y-3">
                        <Skeleton className="h-16 w-full" />
                        <Skeleton className="h-16 w-full" />
                        <Skeleton className="h-16 w-full" />
                    </div>
                ) : error ? (
                    <div className="p-4 rounded-[var(--radius-lg)] border border-[color-mix(in_srgb,var(--color-danger)_30%,transparent)]">
                        <p className="text-sm text-[var(--color-danger)]">{error}</p>
                        <Button variant="secondary" className="mt-3" onClick={() => load(offset)}>
                            Повторить
                        </Button>
                    </div>
                ) : entries.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-[var(--color-border)] rounded-[var(--radius-lg)] text-[var(--color-muted)] bg-transparent">
                        <p className="text-lg font-medium text-[var(--color-fg)]">
                            {t.noHistoryTitle}
                        </p>
                        <p className="text-sm mt-1">{t.noHistoryDesc}</p>
                    </div>
                ) : (
                    <ul className="divide-y divide-[var(--color-border)]">
                        {entries.map((entry) => {
                            const isSelected = selected.has(entry.id);
                            return (
                                <li
                                    key={entry.id}
                                    className={`py-3 flex flex-col gap-1 sm:flex-row sm:items-start sm:gap-4 ${isSelected ? 'bg-[var(--color-surface)] -mx-1 px-1 rounded-[var(--radius-md)]' : ''
                                        }`}
                                >
                                    {/* Select checkbox for compare */}
                                    <input
                                        type="checkbox"
                                        aria-label={`Select entry ${entry.id} for comparison`}
                                        checked={isSelected}
                                        onChange={() => toggleSelect(entry.id)}
                                        className="flex-shrink-0 mt-1 sm:mt-1 accent-[var(--color-primary)]"
                                        disabled={!isSelected && selected.size >= 2}
                                    />

                                    {/* Main info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="text-xs text-[var(--color-muted)]">
                                                {formatDate(entry.createdAt)}
                                            </span>
                                            {modeBadge(entry.mode, t)}
                                            {entry.error && (
                                                <span className="text-xs text-[var(--color-danger)]">{t.errorWord}</span>
                                            )}
                                            <span className="text-xs text-[var(--color-muted)] opacity-70">
                                                {entry.latencyMs}ms
                                            </span>
                                        </div>
                                        <p className="text-sm text-[var(--color-fg)] truncate mt-0.5">
                                            {entry.symptoms}
                                        </p>
                                        {entry.parsedDiagnoses.length > 0 && (
                                            <p className="text-xs text-[var(--color-muted)] font-mono mt-0.5">
                                                {entry.parsedDiagnoses.map((d) => d.icd10_code).join(' · ')}
                                            </p>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-3 text-sm flex-shrink-0 mt-2 sm:mt-0">
                                        <a
                                            href={`/result/${entry.id}`}
                                            className="text-[var(--color-primary)] hover:underline"
                                        >
                                            {t.view}
                                        </a>
                                        <button
                                            type="button"
                                            onClick={() => handleRerun(entry.symptoms)}
                                            className="text-[var(--color-muted)] hover:text-[var(--color-fg)] underline hover:no-underline"
                                        >
                                            {t.rerun}
                                        </button>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </Section>

            {!isLoading && !error && total > limit && (
                <div className="flex items-center justify-between">
                    <Button
                        variant="secondary"
                        disabled={offset === 0}
                        onClick={() => load(Math.max(0, offset - limit))}
                    >
                        ←
                    </Button>
                    <span className="text-xs text-[var(--color-muted)]">
                        {offset + 1}–{Math.min(offset + limit, total)} / {total}
                    </span>
                    <Button
                        variant="secondary"
                        disabled={offset + limit >= total}
                        onClick={() => load(offset + limit)}
                    >
                        →
                    </Button>
                </div>
            )}

            {/* Compare panel */}
            {compareIds &&
                compareEntries &&
                compareEntries[0] &&
                compareEntries[1] && (
                    <ComparePanel
                        a={compareEntries[0]}
                        b={compareEntries[1]}
                        onClose={() => setCompareIds(null)}
                    />
                )}
        </div>
    );
}
