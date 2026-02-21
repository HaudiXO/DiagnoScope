'use client';

import { useState } from 'react';
import Section from './components/Section';
import DiagnosisCard from './components/DiagnosisCard';
import { diagnose, ApiError } from './lib/api';
import type { DiagnosisItem, DiagnoseResponse } from './lib/contract';

const IS_DEV = process.env.NODE_ENV === 'development';

export default function DiagnosePage() {
  const [symptoms, setSymptoms] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<DiagnosisItem[]>([]);
  const [traceId, setTraceId] = useState<string | undefined>(undefined);
  const [rawResponse, setRawResponse] = useState<DiagnoseResponse | null>(null);
  const [error, setError] = useState<{
    message: string;
    errorCode?: string;
    traceId?: string;
  } | null>(null);
  const [debugOpen, setDebugOpen] = useState(false);

  async function handleDiagnose() {
    setLoading(true);
    setError(null);
    setResults([]);
    setTraceId(undefined);
    setRawResponse(null);

    try {
      const response = await diagnose({ symptoms });
      setResults(response.diagnoses.slice(0, 3));
      setTraceId(response.trace_id);
      if (IS_DEV) setRawResponse(response);
    } catch (err) {
      if (err instanceof ApiError) {
        setError({
          message: err.message,
          errorCode: err.errorCode,
          traceId: err.traceId,
        });
      } else {
        setError({ message: 'An unexpected error occurred.' });
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Diagnose</h1>
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
            <textarea
              id="diagnose-input"
              className="w-full min-h-[150px] p-3 border border-gray-300 dark:border-gray-700 rounded-md bg-transparent focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="Describe the patient's symptoms…"
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
            />
          </div>
          <button
            type="button"
            aria-label="Start diagnosis"
            disabled={loading}
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
