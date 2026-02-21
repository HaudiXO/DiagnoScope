import { useState } from 'react';
import type { DiagnosisItem } from '../lib/contract';

interface Props {
    item: DiagnosisItem;
}

export default function DiagnosisCard({ item }: Props) {
    const {
        rank,
        icd10_code,
        description,
        confidence,
        reasoning,
        explanation,
        warnings,
        labels,
        protocol_refs,
    } = item;

    const [detailed, setDetailed] = useState(false);

    // Fields always visible in Short mode
    // Fields only visible in Detailed mode: explanation, reasoning, protocol_refs, warnings

    return (
        <div className="flex gap-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 shadow-sm">
            {/* Rank badge */}
            <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-bold text-sm">
                #{rank}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 space-y-1">
                {/* Code + confidence + toggle */}
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-sm font-semibold text-gray-800 dark:text-gray-100">
                        {icd10_code}
                    </span>
                    {confidence !== undefined && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 font-medium">
                            {Math.round(confidence * 100)}% confidence
                        </span>
                    )}
                    {/* Short / Detailed toggle */}
                    <button
                        type="button"
                        onClick={() => setDetailed((d) => !d)}
                        className="ml-auto text-xs px-2 py-0.5 rounded border border-gray-300 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        aria-label={detailed ? 'Switch to short view' : 'Switch to detailed view'}
                    >
                        {detailed ? 'Short' : 'Detailed'}
                    </button>
                </div>

                {/* Diagnosis name (description) — always shown */}
                {description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
                )}

                {/* Labels — always shown */}
                {labels && labels.length > 0 && (
                    <div className="flex gap-1 flex-wrap">
                        {labels.map((l) => (
                            <span
                                key={l}
                                className="text-xs px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                            >
                                {l}
                            </span>
                        ))}
                    </div>
                )}

                {/* ── Detailed-only fields ──────────────────────────────── */}
                {detailed && (
                    <>
                        {/* Explanation */}
                        {explanation && (
                            <p className="text-sm text-gray-600 dark:text-gray-400">{explanation}</p>
                        )}

                        {/* Reasoning */}
                        {reasoning && (
                            <p className="text-xs text-gray-500 dark:text-gray-500 italic">{reasoning}</p>
                        )}

                        {/* Protocol references */}
                        {protocol_refs && protocol_refs.length > 0 && (
                            <div className="space-y-0.5">
                                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                    Protocol refs:
                                </p>
                                <ul className="list-disc pl-4 space-y-0.5">
                                    {protocol_refs.map((ref, i) => (
                                        <li
                                            key={i}
                                            className="text-xs text-gray-500 dark:text-gray-400"
                                        >
                                            {typeof ref === 'string' ? ref : JSON.stringify(ref)}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Warnings */}
                        {warnings && warnings.length > 0 && (
                            <ul className="mt-1 space-y-0.5">
                                {warnings.map((w, i) => (
                                    <li
                                        key={i}
                                        className="text-xs text-amber-700 dark:text-amber-400 flex gap-1"
                                    >
                                        <span aria-hidden>⚠</span> {w}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
