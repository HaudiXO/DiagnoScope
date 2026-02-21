'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import ChatMessage, { type ChatMsg } from '../../components/ChatMessage';
import VoiceInputButton from '../../components/VoiceInputButton';
import { diagnose, ApiError, type DiagnoseResponseWithMode } from '../../lib/api';
import { addHistoryEntry } from '../../lib/history';
import { addPatientRun, readPatients, type Patient } from '../../lib/patients';
import { getPatientRuns, type HistoryEntry } from '../../lib/patientRuns';
import TaskBoard from '../../components/TaskBoard';
import Skeleton from '../../components/ui/Skeleton';

const IS_DEV = process.env.NODE_ENV === 'development';

// ── Helpers ────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
    try {
        return new Date(iso).toLocaleDateString([], {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    } catch {
        return '';
    }
}

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
    const [runs, setRuns] = useState<HistoryEntry[]>([]);
    const [symptoms, setSymptoms] = useState('');
    const [loading, setLoading] = useState(false);
    const [rawResponse, setRawResponse] = useState<DiagnoseResponseWithMode | null>(null);
    const [debugOpen, setDebugOpen] = useState(false);
    const [lastMode, setLastMode] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'chat' | 'tasks'>('chat');

    const chatBottomRef = useRef<HTMLDivElement>(null);

    // ── Load patient + history on mount ──────────────────────────────────
    useEffect(() => {
        const pts = readPatients();
        setPatient(pts.find((p) => p.id === patientId) ?? null);

        const pastRuns = getPatientRuns(patientId); // newest-first
        setRuns(pastRuns);
        // Build chat transcript: oldest first so the thread reads top-to-bottom.
        const initialMsgs = [...pastRuns].reverse().flatMap(entryToMsgs);
        setMessages(initialMsgs);
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

        const start = Date.now();
        try {
            const response = await diagnose({ symptoms: trimmed });
            const latencyMs = Date.now() - start;
            const topResults = (response.diagnoses ?? []).slice(0, 3);

            if (IS_DEV) setRawResponse(response);
            setLastMode(response.mode ?? 'live');
            window.dispatchEvent(new CustomEvent('medassist-mode', { detail: response.mode ?? 'live' }));

            const entry = addHistoryEntry({
                symptoms: trimmed,
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
                diagnoses: topResults,
                mode: response.mode ?? 'live',
                traceId: response.trace_id,
                latencyMs,
                timestamp: entry.createdAt,
                entryId: entry.id,
            };
            setMessages((prev) => [...prev, assistantMsg]);
            setRuns((prev) => [entry, ...prev]);
        } catch (err) {
            const latencyMs = Date.now() - start;
            let msg = 'An unexpected error occurred.';
            if (err instanceof ApiError) msg = err.message;

            const entry = addHistoryEntry({
                symptoms: trimmed,
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
                diagnoses: [],
                mode: null,
                latencyMs,
                error: msg,
                timestamp: entry.createdAt,
                entryId: entry.id,
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

    function scrollToRun(entryId: string) {
        const el = document.getElementById(entryId);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    // ── Loading ───────────────────────────────────────────────────────────
    if (patient === undefined) return null;

    // ── Not found ─────────────────────────────────────────────────────────
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

    // ── Main layout ───────────────────────────────────────────────────────
    return (
        <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-8rem)] overflow-hidden">
            {/* Mobile tabs */}
            <div className="lg:hidden flex gap-2 border-b border-gray-200 dark:border-gray-800 pb-2 mb-2 flex-shrink-0">
                <button
                    type="button"
                    onClick={() => setActiveTab('chat')}
                    className={`px-4 py-2 text-sm font-medium rounded-md ${activeTab === 'chat' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300' : 'text-gray-600 dark:text-gray-400'}`}
                >
                    Chat
                </button>
                <button
                    type="button"
                    onClick={() => setActiveTab('tasks')}
                    className={`px-4 py-2 text-sm font-medium rounded-md ${activeTab === 'tasks' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300' : 'text-gray-600 dark:text-gray-400'}`}
                >
                    Task Board
                </button>
            </div>

            {/* ── Main panel ── */}
            <div className={`flex flex-col flex-1 min-w-0 gap-4 overflow-hidden ${activeTab === 'chat' ? 'flex' : 'hidden lg:flex'}`}>
                {/* Patient header */}
                <header className="flex-shrink-0">
                    {/* Back link on mobile (sidebar hidden) */}
                    <Link
                        href="/"
                        className="lg:hidden text-sm text-blue-600 dark:text-blue-400 hover:underline block mb-2"
                    >
                        ← Back to Patients
                    </Link>
                    <div className="flex items-center gap-3 flex-wrap">
                        <h1 className="text-2xl font-bold tracking-tight">{patient.name}</h1>
                        {patient.age != null && (
                            <span className="text-gray-500 dark:text-gray-400">
                                Age {patient.age}
                            </span>
                        )}
                    </div>
                    {(patient as { notes?: string }).notes && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            {(patient as { notes?: string }).notes}
                        </p>
                    )}
                </header>

                {/* Chat transcript */}
                <div className="flex-1 overflow-y-auto space-y-4 py-2 pr-1">
                    {messages.length === 0 && (
                        <div className="flex items-center justify-center h-full text-gray-400 dark:text-gray-500 text-sm">
                            No messages yet. Enter symptoms below and press Diagnose.
                        </div>
                    )}
                    {messages.map((msg, i) => (
                        <ChatMessage key={i} msg={msg} onReuse={setSymptoms} />
                    ))}
                    {loading && (
                        <div className="flex justify-start gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0 text-white font-bold shadow-sm text-xs">AI</div>
                            <div className="max-w-[90%] w-full space-y-2">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Assistant</span>
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
                <div className="flex-shrink-0 border-t border-gray-200 dark:border-gray-700 pt-3 space-y-2">
                    <div className="relative">
                        <textarea
                            id="diagnose-input"
                            aria-label="Describe the patient's symptoms"
                            className="w-full min-h-[80px] p-3 pr-12 border border-gray-300 dark:border-gray-700 rounded-md bg-transparent focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm resize-none"
                            placeholder="Describe the patient's symptoms…"
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
                            aria-label="Start diagnosis"
                            disabled={loading || !symptoms.trim()}
                            onClick={handleDiagnose}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-md text-sm font-medium transition-colors"
                        >
                            {loading ? 'Diagnosing…' : 'Diagnose'}
                        </button>
                        <span className="text-xs text-gray-400 dark:text-gray-500 hidden sm:inline">
                            Ctrl+Enter to send
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
                                className="ml-auto text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline font-medium transition-colors"
                            >
                                Rerun last
                            </button>
                        )}
                    </div>
                    <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100 dark:border-gray-800 mt-2">
                        <button type="button" onClick={() => setSymptoms("Chest pain radiating to left arm with shortness of breath and sweating")} className="text-xs px-2 py-1 rounded border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-600 dark:text-gray-400">Вставить пример #1</button>
                        <button type="button" onClick={() => setSymptoms("Persistent dry cough, wheezing, shortness of breath worsening at night")} className="text-xs px-2 py-1 rounded border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-600 dark:text-gray-400">Вставить пример #2</button>
                        <button type="button" onClick={() => setSymptoms("Severe unilateral headache with nausea, photophobia, and visual aura")} className="text-xs px-2 py-1 rounded border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-600 dark:text-gray-400">Вставить пример #3</button>
                        <button type="button" onClick={() => setSymptoms("Crampy lower abdominal pain, diarrhoea, nausea, and low-grade fever")} className="text-xs px-2 py-1 rounded border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-600 dark:text-gray-400">Вставить пример #4</button>
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

            {/* ── Right panel: TaskBoard ── */}
            <aside className={`flex-col lg:w-80 flex-shrink-0 lg:border-l border-gray-200 dark:border-gray-800 lg:pl-4 overflow-y-auto ${activeTab === 'tasks' ? 'flex' : 'hidden lg:flex'}`}>
                <TaskBoard patientId={patientId} currentMode={lastMode} />
            </aside>
        </div>
    );
}
