'use client';

import { use, useEffect, useState } from 'react';
import Section from '../../components/Section';
import DiagnosisCard from '../../components/DiagnosisCard';
import SafetyBanner from '../../components/SafetyBanner';
import PrintReport from '../../components/PrintReport';
import { type HistoryEntry } from '../../lib/history';
import { useI18n } from '../../../lib/i18n';
import { historyRepository } from '../../lib/repositories';
import { useFallback } from '../../lib/FallbackContext';

interface Props {
    params: Promise<{ id: string }>;
}

// G3: what level of detail to show on each card
type DetailLevel = 'short' | 'detailed';

export default function ResultDetailPage({ params }: Props) {
    const { t } = useI18n();
    const { setFallback, setLive } = useFallback();
    const { id } = use(params);
    const [entry, setEntry] = useState<HistoryEntry | null | undefined>(undefined); // undefined = loading
    const [detailLevel, setDetailLevel] = useState<DetailLevel>('short');
    const [debugOpen, setDebugOpen] = useState(false);

    useEffect(() => {
        if (!id) return;
        historyRepository.getHistoryEntry(id).then((result) => {
            setEntry(result.data ?? null);
            if (result.source === 'mock') {
                setFallback(result.reason ?? 'Result: backend unavailable');
            } else {
                setLive();
            }
        }).catch(() => setEntry(null));
    }, [id, setFallback, setLive]);

    // ── Loading state ──────────────────────────────────────────────────────
    if (entry === undefined) {
        return (
            <div className="space-y-6">
                <header className="mb-8">
                    <h1 className="text-3xl font-bold tracking-tight">{t.diagnosisResult}</h1>
                </header>
                <p className="text-gray-500 dark:text-gray-400">{t.loading}</p>
            </div>
        );
    }

    // ── Not found ──────────────────────────────────────────────────────────
    if (entry === null) {
        return (
            <div className="space-y-6">
                <header className="mb-8">
                    <h1 className="text-3xl font-bold tracking-tight">{t.diagnosisResult}</h1>
                </header>
                <div
                    role="alert"
                    className="p-6 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700 text-center space-y-2"
                >
                    <p className="text-lg font-medium text-gray-600 dark:text-gray-400">{t.resultNotFound}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-500">
                        {t.idWord} <code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">{id}</code> {t.notFoundDesc}
                    </p>
                    <a
                        href="/history"
                        className="inline-block mt-2 text-blue-600 dark:text-blue-400 underline hover:no-underline text-sm"
                    >
                        {t.backToHistory}
                    </a>
                </div>
            </div>
        );
    }

    const { symptoms, createdAt, traceId, mode, parsedDiagnoses, rawResponse, latencyMs, error } =
        entry;

    const hasDiagnoses = parsedDiagnoses && parsedDiagnoses.length > 0;

    // Strip explanation/protocol_refs/warnings from cards when in "short" mode
    const displayDiagnoses = detailLevel === 'short'
        ? parsedDiagnoses.map((d) => ({
            ...d,
            explanation: undefined,
            protocol_refs: undefined,
            warnings: undefined,
        }))
        : parsedDiagnoses;

    let displayMode: string | null = mode;
    if (mode === 'demo') displayMode = t.modeDemo || mode;
    if (mode === 'fallback') displayMode = t.modeFallback || mode;

    return (
        <div className="space-y-6">
            {/* Print-only report (hidden on screen) */}
            {hasDiagnoses && (
                <PrintReport
                    symptoms={symptoms}
                    createdAt={createdAt}
                    traceId={traceId}
                    mode={mode}
                    diagnoses={parsedDiagnoses}
                />
            )}

            <header className="mb-8 print:hidden">
                <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">{t.diagnosisResult}</h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
                            {new Date(createdAt).toLocaleString()}
                            {mode && mode !== 'live' && (
                                <span className="ml-2 inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                                    {displayMode}
                                </span>
                            )}
                            {traceId && (
                                <span className="ml-2 font-mono text-xs text-gray-400 dark:text-gray-600">
                                    {t.traceId} {traceId}
                                </span>
                            )}
                            {latencyMs !== undefined && (
                                <span className="ml-2 text-xs text-gray-400 dark:text-gray-600">
                                    {latencyMs}ms
                                </span>
                            )}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        {/* G3: detail toggle */}
                        <div className="flex rounded-md border border-gray-300 dark:border-gray-700 overflow-hidden text-xs font-medium">
                            <button
                                type="button"
                                onClick={() => setDetailLevel('short')}
                                className={`px-3 py-1.5 transition-colors ${detailLevel === 'short'
                                    ? 'bg-gray-800 text-white dark:bg-gray-200 dark:text-gray-900'
                                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                                    }`}
                            >
                                {t.shortLevel}
                            </button>
                            <button
                                type="button"
                                onClick={() => setDetailLevel('detailed')}
                                className={`px-3 py-1.5 transition-colors border-l border-gray-300 dark:border-gray-700 ${detailLevel === 'detailed'
                                    ? 'bg-gray-800 text-white dark:bg-gray-200 dark:text-gray-900'
                                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                                    }`}
                            >
                                {t.detailedLevel}
                            </button>
                        </div>
                        {/* G2: Export */}
                        {hasDiagnoses && (
                            <button
                                type="button"
                                onClick={() => window.print()}
                                className="px-3 py-1.5 text-xs font-medium rounded-md border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            >
                                {t.exportReport}
                            </button>
                        )}
                        <a
                            href="/history"
                            className="text-xs text-blue-600 dark:text-blue-400 underline hover:no-underline"
                        >
                            {t.arrowHistory}
                        </a>
                    </div>
                </div>
            </header>

            {/* G5: Safety banner */}
            {hasDiagnoses && <SafetyBanner diagnoses={parsedDiagnoses} />}

            {/* Error run notice */}
            {error && (
                <div
                    role="alert"
                    className="p-4 rounded-lg border border-red-300 bg-red-50 dark:bg-red-900/20 dark:border-red-700 text-red-800 dark:text-red-300 print:hidden"
                >
                    <p className="font-semibold">{t.runEndedWithError}</p>
                    <p className="text-sm mt-1">{error}</p>
                </div>
            )}

            {/* Symptoms */}
            <Section title={t.symptoms}>
                <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{symptoms}</p>
            </Section>

            {/* Diagnoses */}
            <Section title={t.diagnosesHeading}>
                {hasDiagnoses ? (
                    <div className="space-y-3">
                        {displayDiagnoses.map((item) => (
                            <DiagnosisCard key={`${item.rank}-${item.icd10_code}`} item={item} />
                        ))}
                    </div>
                ) : rawResponse ? (
                    /* Fallback: parsedDiagnoses empty but rawResponse available */
                    <div className="space-y-3">
                        <p className="text-sm text-amber-700 dark:text-amber-400">
                            {t.noParsedDiagnoses}
                        </p>
                        <button
                            type="button"
                            onClick={() => setDebugOpen((o) => !o)}
                            className="text-xs text-gray-500 underline hover:no-underline"
                        >
                            {debugOpen ? t.hideRaw : t.showRaw}
                        </button>
                        {debugOpen && (
                            <pre className="mt-2 p-3 rounded bg-gray-100 dark:bg-gray-800 text-xs overflow-x-auto text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-all">
                                {JSON.stringify(rawResponse, null, 2)}
                            </pre>
                        )}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-lg text-gray-500 bg-gray-50 dark:bg-gray-900/50">
                        <p className="text-sm">{t.noData}</p>
                    </div>
                )}
            </Section>
        </div>
    );
}
