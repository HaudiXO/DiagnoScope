import { useState } from 'react';
import type { DiagnosisItem } from '../lib/contract';
import Badge from './ui/Badge';

interface Props {
    item: DiagnosisItem;
}

export default function DiagnosisCard({ item }: Props) {
    const {
        rank = 0,
        icd10_code = 'Unknown',
        description = '',
        confidence,
        reasoning = '',
        explanation = '',
        warnings = [],
        labels = [],
        protocol_refs = [],
    } = item || {};

    const [detailed, setDetailed] = useState(false);

    // Fields always visible in Short mode
    // Fields only visible in Detailed mode: explanation, reasoning, protocol_refs, warnings

    return (
        <div className="flex gap-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 shadow-sm">
            {/* Rank badge */}
            <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-bold text-sm">
                #{rank}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 space-y-2">
                {/* Code + confidence + toggle */}
                <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="blue" className="text-sm px-2 py-0.5">
                        {icd10_code}
                    </Badge>
                    <span className="font-semibold text-gray-800 dark:text-gray-100">
                        {description || <em className="opacity-50">Unknown Diagnosis</em>}
                    </span>
                    {confidence !== undefined && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 font-medium whitespace-nowrap">
                            {Math.round(confidence * 100)}%
                        </span>
                    )}

                    {/* Short / Detailed segmented control */}
                    <div className="ml-auto flex bg-gray-100 dark:bg-gray-800 rounded p-1">
                        <button
                            type="button"
                            onClick={() => setDetailed(false)}
                            className={`px-3 py-1 text-xs rounded transition-colors font-medium ${!detailed ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
                            aria-label="Switch to short view"
                        >
                            Short
                        </button>
                        <button
                            type="button"
                            onClick={() => setDetailed(true)}
                            className={`px-3 py-1 text-xs rounded transition-colors font-medium ${detailed ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
                            aria-label="Switch to detailed view"
                        >
                            Detailed
                        </button>
                    </div>
                </div>

                {/* Labels — always shown */}
                {Array.isArray(labels) && labels.length > 0 && (
                    <div className="flex gap-1 flex-wrap mt-1">
                        {labels.map((l) => (
                            <span
                                key={l}
                                className="text-xs px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium"
                            >
                                {String(l)}
                            </span>
                        ))}
                    </div>
                )}

                {/* ── Detailed-only fields ──────────────────────────────── */}
                {detailed && (
                    <div className="mt-4 space-y-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                        {/* Explanation */}
                        {explanation && (
                            <p className="text-sm text-gray-700 dark:text-gray-300">{explanation}</p>
                        )}

                        {/* Reasoning */}
                        {reasoning && (
                            <div className="rounded bg-gray-50 dark:bg-gray-800/40 p-3 border border-gray-100 dark:border-gray-800">
                                <p className="text-xs text-gray-600 dark:text-gray-400 italic">
                                    "{reasoning}"
                                </p>
                            </div>
                        )}

                        {/* Warnings */}
                        {Array.isArray(warnings) && warnings.length > 0 && (
                            <div className="rounded-md bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 p-3">
                                <ul className="space-y-1.5">
                                    {warnings.map((w, i) => (
                                        <li
                                            key={i}
                                            className="text-sm font-medium text-amber-800 dark:text-amber-300 flex items-start gap-2"
                                        >
                                            <span aria-hidden className="mt-0.5">⚠️</span>
                                            <span>{String(w)}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Protocol references */}
                        {protocol_refs && protocol_refs.length > 0 && (
                            <div className="space-y-1 pt-1">
                                <p className="text-xs font-semibold tracking-wider uppercase text-gray-500 dark:text-gray-400">
                                    Protocol References
                                </p>
                                <ul className="list-disc pl-5 space-y-1 text-xs text-gray-600 dark:text-gray-400">
                                    {protocol_refs.map((ref, i) => (
                                        <li key={i}>
                                            {typeof ref === 'string' ? ref : JSON.stringify(ref)}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
