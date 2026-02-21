'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Section from '../../components/Section';
import DiagnosisCard from '../../components/DiagnosisCard';
import VoiceInputButton from '../../components/VoiceInputButton';
import { diagnose, ApiError, type DiagnoseResponseWithMode } from '../../lib/api';
import { addHistoryEntry } from '../../lib/history';
import { addPatientRun, readPatients, type Patient } from '../../lib/patients';
import type { DiagnosisItem } from '../../lib/contract';
import type { FixtureMode } from '../../lib/demoMode';

const IS_DEV = process.env.NODE_ENV === 'development';

export default function PatientPage() {
    const params = useParams();
    const patientId = typeof params.id === 'string' ? params.id : '';

    const [patient, setPatient] = useState<Patient | null | undefined>(undefined); // undefined = loading
    const [symptoms, setSymptoms] = useState('');
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<DiagnosisItem[]>([]);
    const [traceId, setTraceId] = useState<string | undefined>(undefined);
    const [rawResponse, setRawResponse] = useState<DiagnoseResponseWithMode | null>(null);
    const [mode, setMode] = useState<FixtureMode | null>(null);
    const [savedId, setSavedId] = useState<string | undefined>(undefined);
    const [error, setError] = useState<{
        message: string;
        errorCode?: string;
        traceId?: string;
    } | null>(null);
    const [debugOpen, setDebugOpen] = useState(false);

    useEffect(() => {
        const pts = readPatients();
        setPatient(pts.find((p) => p.id === patientId) ?? null);
    }, [patientId]);

    async function handleDiagnose() {
        if (!symptoms.trim()) return;
        setLoading(true);
        setError(null);
        setResults([]);
        setTraceId(undefined);
        setRawResponse(null);
        setMode(null);
        setSavedId(undefined);

        const start = Date.now();
        try {
            const response = await diagnose({ symptoms });
            const latencyMs = Date.now() - start;
            const topResults = response.diagnoses.slice(0, 3);

            setResults(topResults);
            setTraceId(response.trace_id);
            setMode(response.mode ?? null);
            if (IS_DEV) setRawResponse(response);

            const entry = addHistoryEntry({
                symptoms,
                rawResponse: response,
                parsedDiagnoses: topResults,
                latencyMs,
                traceId: response.trace_id,
                mode: response.mode ?? 'live',
                error: undefined,
            });
            addPatientRun(patientId, entry.id);
            setSavedId(entry.id);
        } catch (err) {
            const latencyMs = Date.now() - start;
            let msg = 'An unexpected error occurred.';
            let errorCode: string | undefined;
            let errTraceId: string | undefined;

            if (err instanceof ApiError) {
                msg = err.message;
                errorCode = err.errorCode;
                errTraceId = err.traceId;
            }
            setError({ message: msg, errorCode, traceId: errTraceId });

            const entry = addHistoryEntry({
                symptoms,
                rawResponse: null,
                parsedDiagnoses: [],
                latencyMs,
                traceId: errTraceId,
                mode: null,
                error: msg,
            });
            addPatientRun(patientId, entry.id);
            setSavedId(entry.id);
        } finally {
            setLoading(false);
        }
    }

    function handleVoiceTranscript(text: string) {
        setSymptoms((prev) => (prev ? `${prev} ${text}` : text));
    }

    // Loading state
    if (patient === undefined) return null;

    // Not found
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
        <div className="space-y-6">
            <header className="mb-8">
                <Link href="/" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
                    ← Back to Patients
                </Link>
                <div className="flex items-center gap-3 flex-wrap mt-3">
                    <h1 className="text-3xl font-bold tracking-tight">{patient.name}</h1>
                    {patient.age != null && (
                        <span className="text-gray-500 dark:text-gray-400 text-lg">Age {patient.age}</span>
                    )}
                    {mode === 'demo' && (
                        <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                            Demo Mode
                        </span>
                    )}
                    {mode === 'fallback' && (
                        <span className="inline-flex items-center rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                            Fallback Mode
                        </span>
                    )}
                </div>
                <p className="text-gray-500 dark:text-gray-400 mt-2">
                    Enter symptoms to receive differential diagnoses.
                </p>
            </header>

            {/* Input */}
            <Section title="Input Data">
                <div className="space-y-4">
                    <div className="flex flex-col gap-2">
                        <label htmlFor="diagnose-input" className="text-sm font-medium">
                            Symptoms
                        </label>
                        <div className="relative">
                            <textarea
                                id="diagnose-input"
                                className="w-full min-h-[150px] p-3 pr-12 border border-gray-300 dark:border-gray-700 rounded-md bg-transparent focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                placeholder="Describe the patient's symptoms…"
                                value={symptoms}
                                onChange={(e) => setSymptoms(e.target.value)}
                            />
                            <div className="absolute top-2 right-2">
                                <VoiceInputButton onTranscript={handleVoiceTranscript} />
                            </div>
                        </div>
                    </div>
                    <button
                        type="button"
                        aria-label="Start diagnosis"
                        disabled={loading || !symptoms.trim()}
                        onClick={handleDiagnose}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-md font-medium transition-colors w-max"
                    >
                        {loading ? 'Diagnosing…' : 'Diagnose'}
                    </button>
                </div>
            </Section>

            {/* Error banner */}
            {error && (
                <div
                    role="alert"
                    className="p-4 rounded-lg border border-red-300 bg-red-50 dark:bg-red-900/20 dark:border-red-700 text-red-800 dark:text-red-300 space-y-1"
                >
                    <p className="font-semibold">
                        {error.errorCode ? `Error ${error.errorCode}` : 'Error'}
                    </p>
                    <p className="text-sm">{error.message}</p>
                    {error.traceId && (
                        <p className="text-xs text-red-500 dark:text-red-400 font-mono">
                            trace_id: {error.traceId}
                        </p>
                    )}
                </div>
            )}

            {/* Results */}
            <Section title="Results">
                {results.length === 0 && !loading ? (
                    <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-lg text-gray-500 bg-gray-50 dark:bg-gray-900/50">
                        <p className="text-lg font-medium text-gray-600 dark:text-gray-400">
                            No results to display.
                        </p>
                        <p className="text-sm mt-1">Submit data above to view results here.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {savedId && results.length > 0 && (
                            <div className="flex items-center gap-2 text-sm">
                                <span className="text-gray-500 dark:text-gray-400">Saved to history.</span>
                                <a
                                    href={`/result/${savedId}`}
                                    className="text-blue-600 dark:text-blue-400 underline hover:no-underline font-medium"
                                >
                                    Open full report →
                                </a>
                            </div>
                        )}
                        {mode && (
                            <p className="text-xs text-gray-400 dark:text-gray-500 italic">
                                Results sourced from fixture data.
                            </p>
                        )}
                        {traceId && (
                            <p className="text-xs text-gray-400 dark:text-gray-500 font-mono">
                                trace_id: {traceId}
                            </p>
                        )}
                        {results.map((item) => (
                            <DiagnosisCard key={`${item.rank}-${item.icd10_code}`} item={item} />
                        ))}
                    </div>
                )}
            </Section>

            {/* Dev-only raw response debug panel */}
            {IS_DEV && rawResponse && (
                <Section title="Debug">
                    <button
                        type="button"
                        onClick={() => setDebugOpen((o) => !o)}
                        className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 underline"
                    >
                        {debugOpen ? 'Hide' : 'Show'} raw response
                    </button>
                    {debugOpen && (
                        <pre className="mt-3 p-3 rounded bg-gray-100 dark:bg-gray-800 text-xs overflow-x-auto text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-all">
                            {JSON.stringify(rawResponse, null, 2)}
                        </pre>
                    )}
                </Section>
            )}
        </div>
    );
}
