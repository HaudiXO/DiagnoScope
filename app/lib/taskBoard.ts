// ── TaskBoard localStorage helpers ──────────────────────────────────────────
// Stored per patient under key `taskBoard:<patientId>`.
// Defensive parsing: any corrupt/unexpected data resets to default.

export interface PlanItem {
    id: string;
    text: string;
    done: boolean;
}

export interface TaskBoard {
    taskTitle: string;
    plan: PlanItem[];
    updatedAt: string;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function storageKey(patientId: string): string {
    return `taskBoard:${patientId}`;
}

function defaultBoard(): TaskBoard {
    return { taskTitle: '', plan: [], updatedAt: new Date().toISOString() };
}

/** Validate that a parsed value matches the expected TaskBoard shape. */
function isValidBoard(v: unknown): v is TaskBoard {
    if (!v || typeof v !== 'object') return false;
    const b = v as Record<string, unknown>;
    if (typeof b.taskTitle !== 'string') return false;
    if (typeof b.updatedAt !== 'string') return false;
    if (!Array.isArray(b.plan)) return false;
    return b.plan.every(
        (item) =>
            item &&
            typeof item === 'object' &&
            typeof (item as Record<string, unknown>).id === 'string' &&
            typeof (item as Record<string, unknown>).text === 'string' &&
            typeof (item as Record<string, unknown>).done === 'boolean',
    );
}

// ── Public API ───────────────────────────────────────────────────────────────

export function readTaskBoard(patientId: string): TaskBoard {
    if (typeof window === 'undefined') return defaultBoard();
    try {
        const raw = localStorage.getItem(storageKey(patientId));
        if (!raw) return defaultBoard();
        const parsed: unknown = JSON.parse(raw);
        if (!isValidBoard(parsed)) {
            // Corrupt data – reset gracefully.
            localStorage.removeItem(storageKey(patientId));
            return defaultBoard();
        }
        return parsed;
    } catch {
        return defaultBoard();
    }
}

export function writeTaskBoard(patientId: string, board: TaskBoard): void {
    if (typeof window === 'undefined') return;
    try {
        localStorage.setItem(storageKey(patientId), JSON.stringify(board));
    } catch {
        // Quota exceeded or private-browsing – silently ignore.
    }
}

export function resetTaskBoard(patientId: string): TaskBoard {
    if (typeof window !== 'undefined') {
        try {
            localStorage.removeItem(storageKey(patientId));
        } catch {
            // ignore
        }
    }
    return defaultBoard();
}
