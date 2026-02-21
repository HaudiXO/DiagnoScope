'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Section from '../components/Section';
import ComparePanel from '../components/ComparePanel';
import {
    readHistory,
    clearHistory,
    type HistoryEntry,
} from '../lib/history';
import { useI18n } from '../../lib/i18n';

function formatDate(iso: string) {
    return new Date(iso).toLocaleString();
}

function modeBadge(mode: HistoryEntry['mode'], t: any) {
    if (!mode || mode === 'live') return null;
    const cls =
        mode === 'demo'
            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
            : 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200';

    let label = mode;
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

    // IDs of the two entries selected for compare
    const [compareIds, setCompareIds] = useState<[string, string] | null>(null);

    function load() {
        const { entries: e, corruptWarning: w } = readHistory();
        setEntries(e);
        setCorruptWarning(w);
        setSelected(new Set());
        setCompareIds(null);
    }

    useEffect(() => {
        load();
    }, []);

    function handleClear() {
        if (window.confirm(t.clearConfirm || 'Clear all history?')) {
            clearHistory();
            load();
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
                        <h1 className="text-3xl font-bold tracking-tight">{t.historyTitle}</h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-2">{t.prevDiagnoses}</p>
                    </div>
                    {entries.length > 0 && (
                        <button
                            type="button"
                            onClick={handleClear}
                            className="text-sm text-red-600 dark:text-red-400 border border-red-300 dark:border-red-700 rounded-md px-3 py-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
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
                    className="p-3 rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-700 text-amber-800 dark:text-amber-300 text-sm"
                >
                    {t.historyCorrupt}
                </div>
            )}

            {/* Compare toolbar */}
            {selected.size > 0 && (
                <div className="flex items-center gap-3 p-3 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 text-sm">
                    <span className="text-blue-800 dark:text-blue-200">
                        {selected.size === 2 ? t.readyToCompare : t.selectOneMoreToCompare}
                    </span>
                    {selected.size === 2 && (
                        <button
                            type="button"
                            onClick={handleCompare}
                            className="px-3 py-1 bg-blue-600 text-white rounded-md text-xs font-medium hover:bg-blue-700 transition-colors"
                        >
                            {t.compare}
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={() => { setSelected(new Set()); setCompareIds(null); }}
                        className="text-xs text-blue-600 dark:text-blue-400 underline hover:no-underline ml-auto"
                    >
                        {t.cancel}
                    </button>
                </div>
            )}

            <Section title={t.recentAnalyses}>
                {entries.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-lg text-gray-500 bg-gray-50 dark:bg-gray-900/50">
                        <p className="text-lg font-medium text-gray-600 dark:text-gray-400">
                            {t.noHistoryTitle}
                        </p>
                        <p className="text-sm mt-1">{t.noHistoryDesc}</p>
                    </div>
                ) : (
                    <ul className="divide-y divide-gray-200 dark:divide-gray-800">
                        {entries.map((entry) => {
                            const isSelected = selected.has(entry.id);
                            return (
                                <li
                                    key={entry.id}
                                    className={`py-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-4 ${isSelected ? 'bg-blue-50 dark:bg-blue-900/10 -mx-1 px-1 rounded' : ''
                                        }`}
                                >
                                    {/* Select checkbox for compare */}
                                    <input
                                        type="checkbox"
                                        aria-label={`Select entry ${entry.id} for comparison`}
                                        checked={isSelected}
                                        onChange={() => toggleSelect(entry.id)}
                                        className="flex-shrink-0 mt-1 sm:mt-0"
                                        disabled={!isSelected && selected.size >= 2}
                                    />

                                    {/* Main info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="text-xs text-gray-400 dark:text-gray-500">
                                                {formatDate(entry.createdAt)}
                                            </span>
                                            {modeBadge(entry.mode, t)}
                                            {entry.error && (
                                                <span className="text-xs text-red-500 dark:text-red-400">{t.errorWord}</span>
                                            )}
                                            <span className="text-xs text-gray-400 dark:text-gray-600">
                                                {entry.latencyMs}ms
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-800 dark:text-gray-200 truncate mt-0.5">
                                            {entry.symptoms}
                                        </p>
                                        {entry.parsedDiagnoses.length > 0 && (
                                            <p className="text-xs text-gray-500 dark:text-gray-500 font-mono mt-0.5">
                                                {entry.parsedDiagnoses.map((d) => d.icd10_code).join(' · ')}
                                            </p>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-3 text-sm flex-shrink-0">
                                        <a
                                            href={`/result/${entry.id}`}
                                            className="text-blue-600 dark:text-blue-400 underline hover:no-underline"
                                        >
                                            {t.view}
                                        </a>
                                        <button
                                            type="button"
                                            onClick={() => handleRerun(entry.symptoms)}
                                            className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 underline hover:no-underline"
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
