'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import VoiceInputButton from '../../components/VoiceInputButton';
import ChatMessage, { type ChatMsg } from '../../components/ChatMessage';
import { diagnose, ApiError } from '../../lib/api';
import { addHistoryEntry, readHistory, type HistoryEntry } from '../../lib/history';
import { addPatientRun, readPatients, type Patient } from '../../lib/patients';

// ── Helpers ────────────────────────────────────────────────────────────────

/** Read this patient's history entries, newest-first. */
function loadRuns(patientId: string): HistoryEntry[] {
    if (typeof window === 'undefined') return [];
    try {
        const raw = localStorage.getItem('dx_patient_runs_v1');
        if (!raw) return [];
        const map = JSON.parse(raw) as Record<string, string[]>;
        const ids: string[] = map[patientId] ?? [];
        const { entries } = readHistory();
        return ids
            .map((id) => entries.find((e) => e.id === id))
            .filter((e): e is HistoryEntry => Boolean(e));
    } catch {
        return [];
    }
}

/** Convert a HistoryEntry into a pair of [doctor, assistant] chat messages. */
function entryToMsgs(e: HistoryEntry): ChatMsg[] {
    const doctor: ChatMsg = {
        role: 'doctor',
        id: `${e.id}-doc`,
        symptoms: e.symptoms,
        timestamp: e.createdAt,
    };
    const assistant: ChatMsg = {
        role: 'assistant',
        id: `${e.id}-ast`,
        diagnoses: e.parsedDiagnoses ?? [],
        mode: e.mode,
        traceId: e.traceId,
        latencyMs: e.latencyMs,
        timestamp: e.createdAt,
        error: e.error,
    };
    return [doctor, assistant];
}

const IS_DEV = process.env.NODE_ENV === 'development';

// ── Page ───────────────────────────────────────────────────────────────────

export default function PatientPage() {
    const params = useParams();
    const patientId = typeof params.id === 'string' ? params.id : '';

    const [patient, setPatient] = useState<Patient | null | undefined>(undefined);
    const [messages, setMessages] = useState<ChatMsg[]>([]);
    const [runs, setRuns] = useState<HistoryEntry[]>([]);
    const [symptoms, setSymptoms] = useState('');
    const [loading, setLoading] = useState(false);
    const [highlightedId, setHighlightedId] = useState<string | undefined>();

    const bottomRef = useRef<HTMLDivElement>(null);

    // ── Initialise ───────────────────────────────────────────────────────────
    useEffect(() => {
        const pts = readPatients();
        setPatient(pts.find((p) => p.id === patientId) ?? null);

        const savedRuns = loadRuns(patientId);
        setRuns(savedRuns);
        // Oldest-first in transcript
        setMessages(savedRuns.slice().reverse().flatMap(entryToMsgs));
    }, [patientId]);

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages.length]);

    // ── Diagnose ─────────────────────────────────────────────────────────────
    async function handleDiagnose() {
        if (!symptoms.trim()) return;
        setLoading(true);

        const start = Date.now();
        const input = symptoms.trim();
        setSymptoms('');

        // Optimistic doctor message
        const tempDoctorId = `tmp-${Date.now()}`;
        const doctorMsg: ChatMsg = {
            role: 'doctor',
            id: tempDoctorId,
            symptoms: input,
            timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, doctorMsg]);

        try {
            const response = await diagnose({ symptoms: input });
            const latencyMs = Date.now() - start;
            const topResults = response.diagnoses.slice(0, 3);

            const entry = addHistoryEntry({
                symptoms: input,
                rawResponse: response,
                parsedDiagnoses: topResults,
                latencyMs,
                traceId: response.trace_id,
                mode: response.mode ?? 'live',
                error: undefined,
            });
            addPatientRun(patientId, entry.id);

            const assistantMsg: ChatMsg = {
                role: 'assistant',
                id: `${entry.id}-ast`,
                diagnoses: topResults,
                mode: entry.mode,
                traceId: entry.traceId,
                latencyMs,
                timestamp: entry.createdAt,
            };

            setMessages((prev) => [...prev, assistantMsg]);
            setRuns((prev) => [entry, ...prev]);
        } catch (err) {
            const latencyMs = Date.now() - start;
            let msg = 'An unexpected error occurred.';
            if (err instanceof ApiError) msg = err.message;

            const entry = addHistoryEntry({
                symptoms: input,
                rawResponse: null,
                parsedDiagnoses: [],
                latencyMs,
                traceId: undefined,
                mode: null,
                error: msg,
            });
            addPatientRun(patientId, entry.id);

            const assistantMsg: ChatMsg = {
                role: 'assistant',
                id: `${entry.id}-ast`,
                diagnoses: [],
                mode: null,
                timestamp: entry.createdAt,
                error: msg,
            };
            setMessages((prev) => [...prev, assistantMsg]);
            setRuns((prev) => [entry, ...prev]);
        } finally {
            setLoading(false);
        }
    }

    function handleVoiceTranscript(text: string) {
        setSymptoms((prev) => (prev ? `${prev} ${text}` : text));
    }

    /** Scroll to a run's assistant message in the transcript */
    function scrollToRun(entry: HistoryEntry) {
        const targetId = `msg-${entry.id}-ast`;
        setHighlightedId(targetId);
        const el = document.getElementById(targetId);
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setTimeout(() => setHighlightedId(undefined), 1800);
    }

    // ── Render guards ────────────────────────────────────────────────────────
    if (patient === undefined) return null;

    if (patient === null) {
        return (
            <div className="space-y-4">
                <Link href="/" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
                    ← Back to Patients
                </Link>
                <p className="text-gray-500 dark:text-gray-400 mt-4">Patient not found.</p>
            </div>
        );
    }

    return (
        <div className="flex gap-6 h-[calc(100vh-120px)] min-h-[500px]">
            {/* ── Sidebar ──────────────────────────────────────────────────── */}
            <aside className="w-56 flex-shrink-0 flex flex-col gap-4">
                <Link href="/" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
                    ← Back to Patients
                </Link>

                {/* Patient info */}
                <div className="space-y-0.5">
                    <h1 className="text-lg font-bold tracking-tight leading-tight">
                        {patient.name}
                    </h1>
                    {patient.age != null && (
                        <p className="text-sm text-gray-500 dark:text-gray-400">Age {patient.age}</p>
                    )}
                </div>

                {/* Recent runs list */}
                <div className="flex-1 overflow-y-auto">
                    <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-2">
                        Recent Runs
                    </h2>
                    {runs.length === 0 ? (
                        <p className="text-xs text-gray-400 italic">No runs yet.</p>
                    ) : (
                        <ul className="space-y-1">
                            {runs.map((entry) => {
                                const astId = `msg-${entry.id}-ast`;
                                const isHighlighted = highlightedId === astId;
                                return (
                                    <li key={entry.id}>
                                        <button
                                            type="button"
                                            onClick={() => scrollToRun(entry)}
                                            className={`w-full text-left text-xs rounded-md px-2 py-1.5 transition-colors truncate ${isHighlighted
                                                    ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
                                                    : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400'
                                                }`}
                                            title={entry.symptoms}
                                        >
                                            <span className="block truncate">{entry.symptoms}</span>
                                            <span className="block text-gray-400 dark:text-gray-600">
                                                {new Date(entry.createdAt).toLocaleTimeString([], {
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })}
                                                {entry.mode && entry.mode !== 'live'
                                                    ? ` · ${entry.mode}`
                                                    : ''}
                                                {entry.error ? ' · ⚠ error' : ''}
                                            </span>
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>
            </aside>

            {/* ── Chat panel ───────────────────────────────────────────────── */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Transcript */}
                <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                    {messages.length === 0 && !loading && (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-600">
                            <p className="text-4xl mb-2">💬</p>
                            <p className="text-sm">Enter symptoms below to start a diagnosis run.</p>
                        </div>
                    )}

                    {messages.map((msg) => (
                        <div
                            key={msg.id}
                            id={`msg-${msg.id}`}
                            className={`transition-colors duration-700 rounded-xl ${highlightedId === `msg-${msg.id}`
                                    ? 'bg-blue-50 dark:bg-blue-900/20'
                                    : ''
                                }`}
                        >
                            <ChatMessage msg={msg} />
                        </div>
                    ))}

                    {loading && (
                        <div className="flex justify-start">
                            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl rounded-tl-sm px-4 py-3 text-sm text-gray-400 shadow-sm">
                                Analysing…
                            </div>
                        </div>
                    )}

                    <div ref={bottomRef} />
                </div>

                {/* Input area */}
                <div className="pt-3 border-t border-gray-200 dark:border-gray-700 mt-3">
                    <div className="flex gap-2 items-end">
                        <div className="relative flex-1">
                            <textarea
                                id="diagnose-input"
                                rows={3}
                                className="w-full p-3 pr-12 border border-gray-300 dark:border-gray-700 rounded-lg bg-transparent focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none text-sm"
                                placeholder="Describe the patient's symptoms…"
                                value={symptoms}
                                onChange={(e) => setSymptoms(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleDiagnose();
                                }}
                            />
                            <div className="absolute bottom-2 right-2">
                                <VoiceInputButton onTranscript={handleVoiceTranscript} />
                            </div>
                        </div>
                        <button
                            type="button"
                            aria-label="Start diagnosis"
                            disabled={loading || !symptoms.trim()}
                            onClick={handleDiagnose}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors text-sm whitespace-nowrap"
                        >
                            {loading ? 'Diagnosing…' : 'Diagnose'}
                        </button>
                    </div>
                    {IS_DEV && (
                        <p className="text-xs text-gray-400 mt-1">⌘+Enter to submit</p>
                    )}
                </div>
            </div>
        </div>
    );
}
