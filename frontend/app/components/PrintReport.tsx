'use client';

/**
 * PrintReport
 * -----------
 * Wraps a print-friendly representation of a diagnosis result.
 * Renders invisible at screen; becomes the only visible content on print
 * via @media print rules (in globals.css, or via Tailwind print:).
 *
 * Usage: place <PrintReport ... /> anywhere in the result page; call
 * window.print() from a button.
 */

import type { DiagnosisItem } from '../lib/contract';

interface Props {
    symptoms: string;
    createdAt: string;
    traceId: string | undefined;
    mode: string | null;
    diagnoses: DiagnosisItem[];
}

export default function PrintReport({
    symptoms,
    createdAt,
    traceId,
    mode,
    diagnoses,
}: Props) {
    return (
        <div id="print-report" className="hidden print:block text-black bg-white p-8 font-sans">
            <h1 className="text-2xl font-bold mb-1">Differential Diagnosis Report</h1>
            <p className="text-sm text-gray-500 mb-4">
                Generated: {new Date(createdAt).toLocaleString()} {mode ? `· Mode: ${mode}` : ''}
                {traceId ? ` · trace_id: ${traceId}` : ''}
            </p>
            <hr className="mb-4 border-gray-300" />

            <section className="mb-6">
                <h2 className="text-base font-semibold mb-1">Symptoms</h2>
                <p className="text-sm whitespace-pre-wrap">{symptoms}</p>
            </section>

            <section>
                <h2 className="text-base font-semibold mb-3">Diagnoses</h2>
                <table className="w-full text-sm border-collapse">
                    <thead>
                        <tr className="border-b border-gray-400">
                            <th className="text-left py-1 pr-4 w-8">#</th>
                            <th className="text-left py-1 pr-4">ICD-10</th>
                            <th className="text-left py-1 pr-4">Description / Explanation</th>
                            <th className="text-left py-1">Confidence</th>
                        </tr>
                    </thead>
                    <tbody>
                        {diagnoses.map((d) => (
                            <tr key={d.icd10_code} className="border-b border-gray-200 align-top">
                                <td className="py-2 pr-4 font-bold">{d.rank}</td>
                                <td className="py-2 pr-4 font-mono">{d.icd10_code}</td>
                                <td className="py-2 pr-4">
                                    {d.explanation ?? d.description ?? d.reasoning ?? '—'}
                                    {d.warnings && d.warnings.length > 0 && (
                                        <ul className="mt-1 list-disc list-inside text-red-700">
                                            {d.warnings.map((w, i) => (
                                                <li key={i}>{w}</li>
                                            ))}
                                        </ul>
                                    )}
                                    {d.protocol_refs && d.protocol_refs.length > 0 && (
                                        <p className="mt-1 text-xs text-gray-500">
                                            Refs: {(d.protocol_refs as string[]).join(', ')}
                                        </p>
                                    )}
                                </td>
                                <td className="py-2">
                                    {d.confidence !== undefined
                                        ? `${Math.round(d.confidence * 100)}%`
                                        : '—'}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </section>

            <p className="mt-8 text-xs text-gray-400">
                This report is generated for informational purposes only and does not
                constitute medical advice. Always consult a qualified clinician.
            </p>
        </div>
    );
}
