'use client';

import { useState } from 'react';
import DiagnosisCard from './DiagnosisCard';
import SafetyBanner from './SafetyBanner';
import Alert from './ui/Alert';
import type { DiagnosisItem } from '../lib/contract';
import type { FixtureMode } from '../lib/demoMode';

// ── Types ──────────────────────────────────────────────────────────────────

export interface DoctorMessage {
    role: 'doctor';
    symptoms: string;
    timestamp: string; // ISO-8601
}

export interface AssistantMessage {
    role: 'assistant';
    diagnoses: DiagnosisItem[];
    mode: FixtureMode | 'live' | null;
    traceId?: string;
    latencyMs?: number;
    error?: string;
    timestamp: string; // ISO-8601
    entryId?: string; // history entry id, used as scroll anchor
}

export type ChatMsg = DoctorMessage | AssistantMessage;

// ── Helpers ────────────────────────────────────────────────────────────────

function formatTime(iso: string): string {
    try {
        return new Date(iso).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
        });
    } catch {
        return '';
    }
}

// Safely extract a non-empty icd10_code value.
function safeCode(item: DiagnosisItem): string {
    return typeof item.icd10_code === 'string' && item.icd10_code.trim()
        ? item.icd10_code.trim()
        : '—';
}

// ── Sub-components ─────────────────────────────────────────────────────────

function ModeBadge({ mode }: { mode: FixtureMode | 'live' | null }) {
    if (!mode || mode === 'live') return null;
    const label = mode === 'demo' ? 'Демо' : 'Фолбэк';
    const cls =
        mode === 'demo'
            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
            : 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200';
    return (
        <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}
        >
            Режим {label}
        </span>
    );
}

function CopyIcdButton({ diagnoses }: { diagnoses: DiagnosisItem[] }) {
    const [copied, setCopied] = useState(false);

    const codes = diagnoses
        .map(safeCode)
        .filter((c) => c !== '—')
        .join(', ');

    if (!codes) return null;

    function handleCopy() {
        navigator.clipboard
            .writeText(codes)
            .then(() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            })
            .catch(() => {
                // Clipboard API unavailable (e.g. non-secure context) – silently ignore.
            });
    }

    return (
        <button
            type="button"
            onClick={handleCopy}
            aria-label="Copy ICD-10 codes to clipboard"
            className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 underline transition-colors"
        >
            {copied ? '✓ Скопировано!' : 'Скопировать коды МКБ-10'}
        </button>
    );
}

// ── Doctor bubble ──────────────────────────────────────────────────────────

// ── Doctor bubble ──────────────────────────────────────────────────────────

function DoctorBubble({ msg, onReuse }: { msg: DoctorMessage; onReuse?: (text: string) => void }) {
    return (
        <div className="flex justify-end">
            <div className="max-w-[80%] space-y-1 flex flex-col items-end">
                <div className="rounded-2xl rounded-tr-sm bg-blue-600 px-4 py-2.5 text-sm text-white shadow-sm">
                    <p className="whitespace-pre-wrap break-words">
                        {msg.symptoms || <em className="opacity-60">(пусто)</em>}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {onReuse && msg.symptoms && (
                        <button
                            type="button"
                            onClick={() => onReuse(msg.symptoms)}
                            className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline transition-colors"
                        >
                            Использовать как новый ввод
                        </button>
                    )}
                    <p className="text-right text-xs text-gray-400 dark:text-gray-500">
                        {formatTime(msg.timestamp)}
                    </p>
                </div>
            </div>
        </div>
    );
}

// ── Assistant bubble ───────────────────────────────────────────────────────

function AssistantBubble({ msg }: { msg: AssistantMessage }) {
    const safeDiagnoses = Array.isArray(msg.diagnoses) ? msg.diagnoses : [];

    return (
        <div
            id={msg.entryId}
            className="flex justify-start gap-3"
        >
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0 text-white font-bold shadow-sm text-xs">AI</div>
            <div className="max-w-[90%] w-full space-y-2">
                {/* Header */}
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                        Ассистент
                    </span>
                    <ModeBadge mode={msg.mode} />
                    {msg.traceId && (
                        <span className="font-mono text-xs text-gray-400 dark:text-gray-500">
                            #{msg.traceId.slice(0, 8)}
                        </span>
                    )}
                    {msg.latencyMs !== undefined && (
                        <span className="text-xs text-gray-400 dark:text-gray-500">
                            {msg.latencyMs}ms
                        </span>
                    )}
                </div>

                {/* Error state */}
                {msg.error && (
                    <Alert variant="error" title="Проблема с анализом">
                        <p>{msg.error}</p>
                        <p className="mt-2 text-xs opacity-80">
                            <p>Пожалуйста, проверьте подключение или предоставьте более конкретные симптомы.</p>
                        </p>
                    </Alert>
                )}

                {/* Empty diagnoses (non-error) */}
                {!msg.error && safeDiagnoses.length === 0 && (
                    <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 px-4 py-3 text-sm text-gray-500">
                        Диагнозы не найдены.
                    </div>
                )}

                {/* Diagnosis cards */}
                {safeDiagnoses.length > 0 && (
                    <div className="space-y-2">
                        <SafetyBanner diagnoses={safeDiagnoses} traceId={msg.traceId} />
                        {safeDiagnoses.map((item, i) => {
                            // Ensure required fields have safe defaults for rendering.
                            const safe: DiagnosisItem = {
                                rank: typeof item.rank === 'number' ? item.rank : i + 1,
                                icd10_code: safeCode(item),
                                description: item.description ?? undefined,
                                confidence: item.confidence ?? undefined,
                                reasoning: item.reasoning ?? undefined,
                                explanation: item.explanation ?? undefined,
                                warnings: Array.isArray(item.warnings) ? item.warnings : undefined,
                                labels: Array.isArray(item.labels) ? item.labels : undefined,
                            };
                            return (
                                <DiagnosisCard
                                    key={`${safe.rank}-${safe.icd10_code}-${i}`}
                                    item={safe}
                                />
                            );
                        })}
                        <CopyIcdButton diagnoses={safeDiagnoses} />
                    </div>
                )}

                <p className="text-xs text-gray-400 dark:text-gray-500">
                    {formatTime(msg.timestamp)}
                </p>
            </div>
        </div>
    );
}

// ── Main export ────────────────────────────────────────────────────────────

// ── Main export ────────────────────────────────────────────────────────────

export default function ChatMessage({ msg, onReuse }: { msg: ChatMsg; onReuse?: (text: string) => void }) {
    if (msg.role === 'doctor') return <DoctorBubble msg={msg} onReuse={onReuse} />;
    return <AssistantBubble msg={msg} />;
}
