'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import ChatMessage, { type ChatMsg } from '../../components/ChatMessage';
import VoiceInputButton from '../../components/VoiceInputButton';
import type { DiagnoseResponseWithMode } from '../../lib/api';
import { type HistoryEntry } from '../../lib/patientRuns';
import Skeleton from '../../components/ui/Skeleton';
import { chatRepository, patientRepository } from '../../lib/repositories';
import type { Patient } from '../../lib/models/schemas';

const IS_DEV = process.env.NODE_ENV === 'development';

/** Build ChatMsg pairs from a HistoryEntry (newest-first → reversed for rendering). */
function entryToMsgs(entry: HistoryEntry): [ChatMsg, ChatMsg] {
    const doctor: ChatMsg = {
        role: 'doctor',
        symptoms: entry.symptoms ?? '',
        timestamp: entry.createdAt,
    };
    const assistant: ChatMsg = {
        role: 'assistant',
        diagnoses: Array.isArray(entry.parsedDiagnoses) ? entry.parsedDiagnoses : [],
        mode: entry.mode ?? null,
        traceId: entry.traceId,
        latencyMs: entry.latencyMs,
        error: entry.error,
        timestamp: entry.createdAt,
        entryId: entry.id,
    };
    return [doctor, assistant];
}

// ── Component ──────────────────────────────────────────────────────────────

export default function PatientPage() {
    const params = useParams();
    const patientId = typeof params.id === 'string' ? params.id : '';

    const [patient, setPatient] = useState<Patient | null | undefined>(undefined);
    const [messages, setMessages] = useState<ChatMsg[]>([]);
    const [symptoms, setSymptoms] = useState('');
    const [loading, setLoading] = useState(false);
    const [rawResponse, setRawResponse] = useState<DiagnoseResponseWithMode | null>(null);
    const [debugOpen, setDebugOpen] = useState(false);

    const chatBottomRef = useRef<HTMLDivElement>(null);

    // ── Load patient + history on mount ──────────────────────────────────
    useEffect(() => {
        let active = true;

        async function loadData() {
            const patientResult = await patientRepository.getPatient(patientId);
            if (!active) return;
            setPatient(patientResult.data);

            const historyResult = await chatRepository.listPatientHistory(patientId);
            if (!active) return;
            const pastRuns = historyResult.data; // newest-first
            const initialMsgs = [...pastRuns].reverse().flatMap(entryToMsgs);
            setMessages(initialMsgs);
        }

        loadData().catch(() => setPatient(null));
        return () => {
            active = false;
        };
    }, [patientId]);

    // Scroll to bottom whenever a new message is appended.
    useEffect(() => {
        chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages.length]);

    // ── Diagnose handler ─────────────────────────────────────────────────
    async function handleDiagnose() {
        const trimmed = symptoms.trim();
        if (!trimmed) return;
        setLoading(true);
        if (IS_DEV) setRawResponse(null);

        // Append doctor message immediately.
        const doctorMsg: ChatMsg = {
            role: 'doctor',
            symptoms: trimmed,
            timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, doctorMsg]);
        setSymptoms('');

        try {
            const result = await chatRepository.sendMessage({ patientId, symptoms: trimmed });
            const { entry, response } = result.data;

            if (IS_DEV && response) setRawResponse(response);
            window.dispatchEvent(new CustomEvent('medassist-mode', { detail: response?.mode ?? 'live' }));

            const assistantMsg: ChatMsg = {
                role: 'assistant',
                diagnoses: entry.parsedDiagnoses,
                mode: entry.mode,
                traceId: entry.traceId,
                latencyMs: entry.latencyMs,
                error: entry.error,
                timestamp: entry.createdAt,
                entryId: entry.id,
            };
            setMessages((prev) => [...prev, assistantMsg]);
        } catch {
            const assistantMsg: ChatMsg = {
                role: 'assistant',
                diagnoses: [],
                mode: null,
                error: 'Произошла непредвиденная ошибка.',
                timestamp: new Date().toISOString(),
            };
            setMessages((prev) => [...prev, assistantMsg]);
        } finally {
            setLoading(false);
        }
    }

    function handleVoiceTranscript(text: string) {
        setSymptoms((prev) => (prev ? `${prev} ${text}` : text));
    }

    // ── Loading ───────────────────────────────────────────────────────────
    if (patient === undefined) return null;

    // ── Not found ─────────────────────────────────────────────────────────
    if (patient === null) {
        return (
            <div className="space-y-4">
                <Link href="/" className="text-sm text-[var(--color-muted)] hover:text-[var(--color-primary)] hover:underline">
                    ← Back to Patients
                </Link>
                <p className="text-[var(--color-muted)] mt-4">Patient not found.</p>
            </div>
        );
    }

    // ── Main layout ───────────────────────────────────────────────────────
    return (
        <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-8rem)] overflow-hidden">
            {/* ── Main panel ── */}
            <div className="flex flex-col flex-1 min-w-0 gap-4 overflow-hidden flex">
                <header className="flex-shrink-0">
                    {/* Back link on mobile (sidebar hidden) */}
                    <Link
                        href="/"
                        className="lg:hidden text-sm text-[var(--color-muted)] hover:text-[var(--color-primary)] block mb-2"
                    >
                        ← Back to Patients
                    </Link>
                    <div className="flex items-center gap-3 flex-wrap">
                        <h1 className="text-2xl font-bold tracking-tight text-[var(--color-fg)]">{patient.name}</h1>
                        {patient.age != null && (
                            <span className="text-[var(--color-muted)]">
                                Age {patient.age}
                            </span>
                        )}
                    </div>
                    {(patient as { notes?: string }).notes && (
                        <p className="text-sm text-[var(--color-muted)] mt-1">
                            {(patient as { notes?: string }).notes}
                        </p>
                    )}
                </header>

                <div className="flex-1 overflow-y-auto space-y-4 py-2 pr-1">
                    {messages.length === 0 && (
                        <div className="flex items-center justify-center h-full text-[var(--color-muted)] text-sm p-4 text-center">
                            Пока нет сообщений. Введите симптомы ниже и нажмите «Анализ».
                        </div>
                    )}
                    {messages.map((msg, i) => (
                        <ChatMessage key={i} msg={msg} onReuse={setSymptoms} />
                    ))}
                    {loading && (
                        <div className="flex justify-start gap-3">
                            <div className="w-8 h-8 rounded-full bg-[var(--color-primary-soft)] border border-[var(--color-primary)]/30 flex items-center justify-center flex-shrink-0 text-[var(--color-primary)] font-bold shadow-[var(--shadow-sm)] text-xs">AI</div>
                            <div className="max-w-[90%] w-full space-y-2">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wide">Ассистент</span>
                                </div>
                                <div className="space-y-3 mt-2">
                                    <Skeleton className="h-24 w-full" />
                                    <Skeleton className="h-24 w-[80%]" />
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={chatBottomRef} />
                </div>

                {/* Input area */}
                <div className="flex-shrink-0 border-t border-[var(--color-border)] pt-3 space-y-2">
                    <div className="relative">
                        <textarea
                            id="diagnose-input"
                            aria-label="Опишите симптомы пациента"
                            className="w-full min-h-[80px] p-3 pr-12 border border-[var(--color-border)] rounded-[var(--radius-md)] bg-[var(--color-elevated)] focus-ring outline-none text-sm resize-none text-[var(--color-fg)] placeholder:text-[var(--color-muted)] transition-colors"
                            placeholder="Опишите симптомы пациента…"
                            value={symptoms}
                            onChange={(e) => setSymptoms(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleDiagnose();
                            }}
                        />
                        <div className="absolute top-2 right-2">
                            <VoiceInputButton onTranscript={handleVoiceTranscript} />
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <button
                            type="button"
                            aria-label="Начать анализ"
                            disabled={loading || !symptoms.trim()}
                            onClick={handleDiagnose}
                            className="px-4 py-2 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] disabled:opacity-50 disabled:cursor-not-allowed text-[#070A06] rounded-[var(--radius-md)] text-sm font-medium transition-all"
                        >
                            {loading ? 'Анализ…' : 'Анализ'}
                        </button>
                        <span className="text-xs text-[var(--color-muted)] hidden sm:inline">
                            Ctrl+Enter для отправки
                        </span>
                        {messages.findLast((m) => m.role === 'doctor') && (
                            <button
                                type="button"
                                onClick={() => {
                                    const lastDoc = messages.findLast((m) => m.role === 'doctor');
                                    if (lastDoc && 'symptoms' in lastDoc) {
                                        setSymptoms(lastDoc.symptoms);
                                    }
                                }}
                                className="ml-auto text-xs text-[var(--color-muted)] hover:text-[var(--color-primary)] underline font-medium transition-colors"
                            >
                                Повторить последний
                            </button>
                        )}
                    </div>
                    <div className="flex flex-wrap gap-2 pt-2 border-t border-[var(--color-border)] mt-2">
                        <button type="button" onClick={() => setSymptoms("Боль в груди, отдающая в левую руку, с одышкой и потливостью")} className="text-xs px-2 py-1 rounded-[var(--radius-sm)] border border-[var(--color-border)] hover:bg-[var(--color-primary-soft)] hover:text-[var(--color-primary)] transition-colors text-[var(--color-muted)]">Вставить пример #1</button>
                        <button type="button" onClick={() => setSymptoms("Постоянный сухой кашель, хрипы, одышка, усиливающаяся ночью")} className="text-xs px-2 py-1 rounded-[var(--radius-sm)] border border-[var(--color-border)] hover:bg-[var(--color-primary-soft)] hover:text-[var(--color-primary)] transition-colors text-[var(--color-muted)]">Вставить пример #2</button>
                        <button type="button" onClick={() => setSymptoms("Сильная односторонняя головная боль с тошнотой, светобоязнью и визуальной аурой")} className="text-xs px-2 py-1 rounded-[var(--radius-sm)] border border-[var(--color-border)] hover:bg-[var(--color-primary-soft)] hover:text-[var(--color-primary)] transition-colors text-[var(--color-muted)]">Вставить пример #3</button>
                        <button type="button" onClick={() => setSymptoms("Схваткообразная боль внизу живота, диарея, тошнота и субфебрильная температура")} className="text-xs px-2 py-1 rounded-[var(--radius-sm)] border border-[var(--color-border)] hover:bg-[var(--color-primary-soft)] hover:text-[var(--color-primary)] transition-colors text-[var(--color-muted)]">Вставить пример #4</button>
                    </div>
                </div>

                {/* Dev-only debug panel */}
                {IS_DEV && rawResponse && (
                    <div className="flex-shrink-0 border-t border-gray-200 dark:border-gray-700 pt-2">
                        <button
                            type="button"
                            onClick={() => setDebugOpen((o) => !o)}
                            className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 underline"
                        >
                            {debugOpen ? 'Hide' : 'Show'} raw response
                        </button>
                        {debugOpen && (
                            <pre className="mt-2 p-3 rounded bg-gray-100 dark:bg-gray-800 text-xs overflow-x-auto text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-all">
                                {JSON.stringify(rawResponse, null, 2)}
                            </pre>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
