'use client';

import { useState } from 'react';
import DiagnosisCard from './DiagnosisCard';
import type { DiagnosisItem } from '../lib/contract';
import type { FixtureMode } from '../lib/demoMode';

// ── Types ──────────────────────────────────────────────────────────────────

export interface DoctorMessage {
    role: 'doctor';
    id: string;
    symptoms: string;
    timestamp: string; // ISO-8601
}

export interface AssistantMessage {
    role: 'assistant';
    id: string;
    diagnoses: DiagnosisItem[];   // may be empty
    mode: FixtureMode | 'live' | null;
    traceId?: string;
    latencyMs?: number;
    timestamp: string; // ISO-8601
    error?: string;
}

export type ChatMsg = DoctorMessage | AssistantMessage;

// ── Helpers ────────────────────────────────────────────────────────────────

function formatTime(iso: string): string {
    try {
        return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
        return '';
    }
}

function ModeBadge({ mode }: { mode: FixtureMode | 'live' | null }) {
    if (!mode || mode === 'live') return null;
    const cls =
        mode === 'demo'
            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
            : 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200';
    return (
        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>
            {mode === 'demo' ? 'Demo Mode' : 'Fallback Mode'}
        </span>
    );
}

// ── Sub-components ─────────────────────────────────────────────────────────

function DoctorBubble({ msg }: { msg: DoctorMessage }) {
    return (
        <div className="flex justify-end">
            <div className="max-w-[75%] space-y-1">
                <p className="text-xs text-gray-400 text-right">{formatTime(msg.timestamp)}</p>
                <div className="bg-blue-600 text-white rounded-2xl rounded-tr-sm px-4 py-3 text-sm whitespace-pre-wrap break-words shadow-sm">
                    {msg.symptoms}
                </div>
            </div>
        </div>
    );
}

function AssistantBubble({ msg }: { msg: AssistantMessage }) {
    const [copied, setCopied] = useState(false);

    const icd10Codes = (msg.diagnoses ?? [])
        .map((d) => d?.icd10_code)
        .filter((c): c is string => Boolean(c));

    function handleCopy() {
        if (icd10Codes.length === 0) return;
        navigator.clipboard.writeText(icd10Codes.join(', ')).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        });
    }

    return (
        <div id={`msg-${msg.id}`} className="flex justify-start scroll-mt-4">
            <div className="max-w-[90%] w-full space-y-1">
                <p className="text-xs text-gray-400">{formatTime(msg.timestamp)}</p>
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm space-y-3">
                    {/* Header row */}
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                            Assistant
                        </span>
                        <ModeBadge mode={msg.mode} />
                        {icd10Codes.length > 0 && (
                            <button
                                type="button"
                                onClick={handleCopy}
                                title="Copy ICD-10 codes to clipboard"
                                className="ml-auto text-xs px-2 py-0.5 rounded border border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:border-gray-400 transition-colors"
                            >
                                {copied ? '✓ Copied' : 'Copy ICD-10'}
                            </button>
                        )}
                    </div>

                    {/* Error state */}
                    {msg.error && (
                        <p className="text-sm text-red-600 dark:text-red-400">{msg.error}</p>
                    )}

                    {/* Diagnoses – may be empty */}
                    {(msg.diagnoses ?? []).length === 0 && !msg.error && (
                        <p className="text-sm text-gray-400 italic">No diagnoses returned.</p>
                    )}

                    {(msg.diagnoses ?? []).map((item, idx) => {
                        // Safe fallback for missing required fields
                        const safeItem = {
                            rank: item?.rank ?? idx + 1,
                            icd10_code: item?.icd10_code ?? '—',
                            description: item?.description,
                            confidence: item?.confidence,
                            reasoning: item?.reasoning,
                            explanation: item?.explanation,
                            warnings: Array.isArray(item?.warnings) ? item.warnings : undefined,
                            labels: Array.isArray(item?.labels) ? item.labels : undefined,
                        };
                        return <DiagnosisCard key={`${safeItem.rank}-${safeItem.icd10_code}-${idx}`} item={safeItem} />;
                    })}

                    {/* Metadata footer */}
                    {msg.traceId && (
                        <p className="text-xs text-gray-400 dark:text-gray-500 font-mono">
                            trace_id: {msg.traceId}
                        </p>
                    )}
                    {msg.latencyMs !== undefined && (
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                            {msg.latencyMs} ms
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}

// ── Main export ────────────────────────────────────────────────────────────

export default function ChatMessage({ msg }: { msg: ChatMsg }) {
    if (msg.role === 'doctor') return <DoctorBubble msg={msg} />;
    return <AssistantBubble msg={msg} />;
}
