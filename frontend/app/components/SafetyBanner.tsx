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
}

export default function SafetyBanner({ diagnoses }: Props) {
    const urgent = diagnoses.some(isUrgent);
    if (!urgent) return null;

    return (
        <div
            role="alert"
            className="flex gap-3 items-start p-4 rounded-lg border border-red-400 bg-red-50 dark:bg-red-900/20 dark:border-red-700 text-red-800 dark:text-red-300 print:border-red-600 print:bg-red-50"
        >
            <span className="text-xl" aria-hidden>⚠️</span>
            <div>
                <p className="font-semibold">Clinical Safety Notice</p>
                <p className="text-sm mt-0.5">
                    One or more diagnoses include warnings or urgency signals. Review all
                    warnings carefully and consult a qualified clinician before acting on
                    these results.
                </p>
            </div>
        </div>
    );
}
