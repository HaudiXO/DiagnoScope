'use client';

/**
 * SafetyBanner
 * ------------
 * Shown on /result/[id] when any diagnosis has warnings OR explanation
 * contains an urgent keyword.
 */

import type { DiagnosisItem } from '../lib/contract';

const URGENT_KEYWORDS = [
    'urgent', 'emergency', 'critical', 'immediate', 'life-threatening',
    'acute', 'serious', 'severe', 'danger', 'call 911', 'call 999',
];

function isUrgent(item: DiagnosisItem): boolean {
    if (item.warnings && item.warnings.length > 0) return true;
    if (item.explanation) {
        const lower = item.explanation.toLowerCase();
        return URGENT_KEYWORDS.some((kw) => lower.includes(kw));
    }
    return false;
}

interface Props {
    diagnoses: DiagnosisItem[];
    traceId?: string;
}

export default function SafetyBanner({ diagnoses, traceId }: Props) {
    const urgent = diagnoses.some(isUrgent);
    if (!urgent) return null;

    return (
        <div
            role="alert"
            className="flex gap-3 items-start p-4 rounded-lg border border-amber-400 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-700 text-amber-900 dark:text-amber-200 print:border-amber-600 print:bg-amber-50"
        >
            <span className="text-xl" aria-hidden>⚠️</span>
            <div className="flex-1">
                <p className="font-semibold text-amber-900 dark:text-amber-100">Clinical Safety Notice</p>
                <p className="text-sm mt-0.5 text-amber-800 dark:text-amber-200/90">
                    One or more diagnoses include warnings or urgency signals. Review all
                    warnings carefully and consult a qualified clinician before acting on
                    these results.
                </p>
                {traceId && (
                    <p className="text-xs mt-2 font-mono text-amber-700 dark:text-amber-400/80">
                        Trace ID: {traceId}
                    </p>
                )}
            </div>
        </div>
    );
}
