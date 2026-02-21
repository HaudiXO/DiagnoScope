import Link from 'next/link';
import type { Patient } from '../lib/patients';
import type { HistoryEntry } from '../lib/history';
import Card from './ui/Card';
import Badge from './ui/Badge';
import Button from './ui/Button';

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
        <Card className="flex flex-col gap-3 hover:shadow-[var(--shadow-md)] transition-shadow">
            {/* Patient header */}
            <div className="flex items-start justify-between gap-2">
                <div>
                    <p className="font-semibold text-base leading-tight">{patient.name}</p>
                    {patient.age != null && (
                        <p className="text-sm mt-0.5" style={{ color: 'var(--color-muted)' }}>
                            Age {patient.age}
                        </p>
                    )}
                </div>
                {topCode && <Badge variant="blue">{topCode}</Badge>}
            </div>

            {/* Last run summary */}
            <div className="flex-1 min-h-[2.5rem] text-sm">
                {lastRun ? (
                    <div className="space-y-0.5">
                        <p
                            className="text-xs uppercase tracking-wide font-medium"
                            style={{ color: 'var(--color-muted)' }}
                        >
                            Last assessment · {formatDate(lastRun.createdAt)}
                        </p>
                        {symptomsPreview && (
                            <p className="italic truncate" style={{ color: 'var(--color-muted)' }}>
                                &ldquo;{symptomsPreview}&rdquo;
                            </p>
                        )}
                    </div>
                ) : (
                    <p className="text-xs italic" style={{ color: 'var(--color-muted)' }}>
                        No assessments yet.
                    </p>
                )}
            </div>

            {/* Action — styled as Button but rendered as Link */}
            <Link
                href={`/patient/${patient.id}`}
                className={[
                    'inline-flex items-center justify-center text-sm font-medium transition-colors',
                    'rounded-[var(--radius-md)] px-3 py-1.5 focus-ring',
                    'bg-[var(--color-primary)] text-[var(--color-primary-fg)] hover:bg-[var(--color-primary-hover)]',
                ].join(' ')}
            >
                Open
            </Link>
        </Card>
    );
}
