import Link from 'next/link';
import type { Patient } from '../lib/patients';
import type { HistoryEntry } from '../lib/history';

interface Props {
    patient: Patient;
    lastRun?: HistoryEntry;
}

function formatDate(iso: string): string {
    try {
        return new Date(iso).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    } catch {
        return iso;
    }
}

export default function PatientCard({ patient, lastRun }: Props) {
    const topCode = lastRun?.parsedDiagnoses?.[0]?.icd10_code;
    const rawSymptoms = lastRun?.symptoms ?? '';
    const symptomsPreview = rawSymptoms.length > 72
        ? rawSymptoms.slice(0, 69) + '…'
        : rawSymptoms;

    return (
        <div className="flex flex-col gap-3 p-4 border border-gray-200 dark:border-gray-800 rounded-lg bg-white dark:bg-gray-900 shadow-sm hover:shadow-md transition-shadow">
            {/* Patient header */}
            <div className="flex items-start justify-between gap-2">
                <div>
                    <p className="font-semibold text-base leading-tight">{patient.name}</p>
                    {patient.age != null && (
                        <p className="text-sm text-gray-500 dark:text-gray-400">Age {patient.age}</p>
                    )}
                </div>
                {topCode && (
                    <span className="shrink-0 px-2 py-0.5 rounded text-xs font-mono font-medium bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                        {topCode}
                    </span>
                )}
            </div>

            {/* Last run summary */}
            <div className="flex-1 min-h-[2.5rem] text-sm">
                {lastRun ? (
                    <div className="space-y-0.5">
                        <p className="text-xs uppercase tracking-wide font-medium text-gray-400 dark:text-gray-500">
                            Last assessment · {formatDate(lastRun.createdAt)}
                        </p>
                        {symptomsPreview && (
                            <p className="text-gray-500 dark:text-gray-400 italic truncate">
                                &ldquo;{symptomsPreview}&rdquo;
                            </p>
                        )}
                    </div>
                ) : (
                    <p className="text-xs italic text-gray-400 dark:text-gray-500">No assessments yet.</p>
                )}
            </div>

            {/* Action */}
            <Link
                href={`/patient/${patient.id}`}
                className="inline-flex items-center justify-center px-3 py-1.5 text-sm font-medium rounded-md bg-blue-600 hover:bg-blue-700 text-white transition-colors"
            >
                Open
            </Link>
        </div>
    );
}
