import Link from 'next/link';
import type { Patient } from '../lib/patients';
import type { HistoryEntry } from '../lib/history';
import Card from './ui/Card';
import Badge from './ui/Badge';

interface Props {
    patient: Patient;
    lastRun?: HistoryEntry;
}

/** Returns a human-readable relative time string. Never throws. */
function timeAgo(iso: string | undefined): string {
    if (!iso) return '';
    try {
        const diffMs = Date.now() - new Date(iso).getTime();
        if (diffMs < 0) return 'только что';
        const mins = Math.floor(diffMs / 60_000);
        if (mins < 1) return 'только что';
        if (mins < 60) return `${mins} мин назад`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs} ч назад`;
        const days = Math.floor(hrs / 24);
        if (days < 30) return `${days} дн назад`;
        const months = Math.floor(days / 30);
        return `${months} мес назад`;
    } catch {
        return '';
    }
}

// Template text pre-filled for "New assessment"
const ASSESSMENT_TEMPLATE = 'Основные жалобы: ';

export default function PatientCard({ patient, lastRun }: Props) {
    const topCode = lastRun?.parsedDiagnoses?.[0]?.icd10_code;
    // warnings may live on rawResponse; fall back gracefully
    const warnings: unknown[] =
        (lastRun?.rawResponse as Record<string, unknown> | null)?.warnings as unknown[] ?? [];
    const hasWarnings = warnings.length > 0;
    const lastSeenLabel = timeAgo(lastRun?.createdAt);

    const symptomsPreview = (() => {
        const s = lastRun?.symptoms ?? '';
        return s.length > 60 ? s.slice(0, 57) + '…' : s;
    })();

    // Shared link class for quick-action buttons
    const actionCls = [
        'inline-flex items-center justify-center text-xs font-medium transition-colors',
        'rounded-[var(--radius-md)] px-2.5 py-1.5 focus-ring whitespace-nowrap',
    ].join(' ');

    const primaryActionCls = `${actionCls} bg-[var(--color-primary)] text-[#070A06] hover:bg-[var(--color-primary-hover)] hover:shadow-[0_0_12px_rgba(161,248,0,0.25)]`;
    const secondaryActionCls = `${actionCls} border border-[var(--color-border)] bg-transparent text-[var(--color-fg)] hover:bg-[var(--color-primary-soft)]`;

    return (
        <Card className="flex flex-col gap-3 hover:shadow-[var(--shadow-md)] transition-shadow">
            {/* Header row: name + badges */}
            <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                    <p className="font-semibold text-base leading-tight truncate">{patient.name}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--color-muted)' }}>
                        {[patient.age != null ? `Возраст ${patient.age}` : null, lastSeenLabel ? `· ${lastSeenLabel}` : null]
                            .filter(Boolean)
                            .join(' ')}
                    </p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0 flex-wrap justify-end">
                    {hasWarnings && (
                        <Badge variant="amber">⚠ {warnings.length}</Badge>
                    )}
                    {topCode && <Badge variant="blue">{topCode}</Badge>}
                </div>
            </div>

            {/* Last run summary */}
            <div className="flex-1 min-h-[2rem] text-sm">
                {lastRun ? (
                    <p className="text-xs italic truncate" style={{ color: 'var(--color-muted)' }}>
                        &ldquo;{symptomsPreview}&rdquo;
                    </p>
                ) : (
                    <p className="text-xs italic" style={{ color: 'var(--color-muted)' }}>
                        Нет оценок.
                    </p>
                )}
            </div>

            {/* Quick actions */}
            <div className="flex gap-2 flex-wrap">
                <Link
                    href={`/patient/${patient.id}`}
                    aria-label={`Открыть чат для ${patient.name}`}
                >
                    Чат
                </Link>
                <Link
                    href={`/patient/${patient.id}?new=1&template=${encodeURIComponent(ASSESSMENT_TEMPLATE)}`}
                    aria-label={`Начать новую оценку для ${patient.name}`}
                    className={secondaryActionCls}
                >
                    Новая оценка
                </Link>
            </div>
        </Card>
    );
}
