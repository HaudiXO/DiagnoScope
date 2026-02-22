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
        diagnosis = '',
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
        <div className="flex gap-4 p-4 border border-[var(--color-border)] rounded-[var(--radius-md)] bg-[var(--color-surface)] shadow-[var(--shadow-sm)]">
            {/* Rank badge */}
            <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-[var(--color-primary-soft)] text-[var(--color-primary)] font-bold text-sm">
                #{rank}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 space-y-2">
                {/* Code + confidence + toggle */}
                <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="blue" className="text-sm px-2 py-0.5">
                        {icd10_code}
                    </Badge>
                    <span className="font-semibold text-[var(--color-fg)]">
                        {diagnosis || description || <em className="opacity-50">Неизвестный диагноз</em>}
                    </span>
                    {confidence !== undefined && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--color-primary-soft)] text-[var(--color-primary)] font-medium whitespace-nowrap">
                            {Math.round(confidence * 100)}%
                        </span>
                    )}

                    {/* Short / Detailed segmented control */}
                    <div className="ml-auto flex bg-[var(--color-elevated)] border border-[var(--color-border)] rounded p-1">
                        <button
                            type="button"
                            onClick={() => setDetailed(false)}
                            className={`px-3 py-1 text-xs rounded transition-colors font-medium ${!detailed ? 'bg-[var(--color-primary-soft)] text-[var(--color-primary)]' : 'text-[var(--color-muted)] hover:text-[var(--color-fg)] hover:bg-[var(--color-surface)]'}`}
                            aria-label="Краткий вид"
                        >
                            Кратко
                        </button>
                        <button
                            type="button"
                            onClick={() => setDetailed(true)}
                            className={`px-3 py-1 text-xs rounded transition-colors font-medium ${detailed ? 'bg-[var(--color-primary-soft)] text-[var(--color-primary)]' : 'text-[var(--color-muted)] hover:text-[var(--color-fg)] hover:bg-[var(--color-surface)]'}`}
                            aria-label="Детальный вид"
                        >
                            Детально
                        </button>
                    </div>
                </div>

                {/* Labels — always shown */}
                {Array.isArray(labels) && labels.length > 0 && (
                    <div className="flex gap-1 flex-wrap mt-1">
                        {labels.map((l) => (
                            <span
                                key={l}
                                className="text-xs px-1.5 py-0.5 rounded bg-[var(--color-elevated)] border border-[var(--color-border)] text-[var(--color-muted)] font-medium"
                            >
                                {String(l)}
                            </span>
                        ))}
                    </div>
                )}

                {/* ── Detailed-only fields ──────────────────────────────── */}
                {detailed && (
                    <div className="mt-4 space-y-3 pt-3 border-t border-[var(--color-border)]">
                        {/* Explanation */}
                        {explanation && (
                            <p className="text-sm text-[var(--color-muted)]">{explanation}</p>
                        )}

                        {/* Reasoning */}
                        {reasoning && (
                            <div className="rounded bg-[var(--color-elevated)] p-3 border border-[var(--color-border)]">
                                <p className="text-xs text-[var(--color-muted)] italic">
                                    &quot;{reasoning}&quot;
                                </p>
                            </div>
                        )}

                        {/* Warnings */}
                        {Array.isArray(warnings) && warnings.length > 0 && (
                            <div className="rounded-[var(--radius-md)] bg-[var(--color-amber-bg)] border border-[var(--color-warning)]/50 p-3">
                                <ul className="space-y-1.5">
                                    {warnings.map((w, i) => (
                                        <li
                                            key={i}
                                            className="text-sm font-medium text-[var(--color-warning)] flex items-start gap-2"
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
                                <p className="text-xs font-semibold tracking-wider uppercase text-[var(--color-muted)]">
                                    Ссылки на протоколы
                                </p>
                                <ul className="list-disc pl-5 space-y-1 text-xs text-[var(--color-muted)]">
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
