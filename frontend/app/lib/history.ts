/**
 * history.ts
 * ----------
 * Typed localStorage persistence for diagnosis runs.
 * Key: "dx_history_v1"
 * On corrupt JSON or schema mismatch the key is silently reset.
 */

import type { DiagnoseResponseWithMode } from './api';
import type { DiagnosisItem } from './contract';
import type { FixtureMode } from './demoMode';

export const HISTORY_KEY = 'dx_history_v1';

/**
 * HistoryEntry represents a paired doctor+assistant interaction.
 * Derived from backend ChatMessageResponseData items (src/presentation/api/patient/schemas.py)
 * via mapChatItemsToHistory in chatRepository.ts.
 */
export interface HistoryEntry {
    id: string;
    createdAt: string;       // ISO-8601
    symptoms: string;        // Content from doctor role message
    rawResponse: DiagnoseResponseWithMode | null;  // Parsed from assistant content JSON
    parsedDiagnoses: DiagnosisItem[];
    rawContent?: string;     // Original raw text from assistant (when not JSON)
    latencyMs: number;
    traceId: string | undefined;
    mode: FixtureMode | 'live' | null;
    error: string | undefined;
}

// ── Helpers ────────────────────────────────────────────────────────────────

function generateId(): string {
    return (
        Date.now().toString(36) +
        Math.random().toString(36).slice(2, 7)
    );
}

// ── Read ───────────────────────────────────────────────────────────────────

/**
 * Returns all stored history entries, newest-first.
 * If localStorage contains corrupt JSON or a non-array value the store is
 * reset to [] and the function returns [] (no throw, no crash).
 * Returns "" corruptWarning when a reset occurred, undefined otherwise.
 */
export function readHistory(): { entries: HistoryEntry[]; corruptWarning: boolean } {
    if (typeof window === 'undefined') return { entries: [], corruptWarning: false };

    const raw = localStorage.getItem(HISTORY_KEY);
    if (raw === null) return { entries: [], corruptWarning: false };

    try {
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) throw new Error('not an array');
        // Minimal shape check: every item must have id + createdAt.
        const valid = (parsed as unknown[]).every(
            (e) =>
                e !== null &&
                typeof e === 'object' &&
                typeof (e as Record<string, unknown>).id === 'string' &&
                typeof (e as Record<string, unknown>).createdAt === 'string'
        );
        if (!valid) throw new Error('invalid shape');
        return { entries: parsed as HistoryEntry[], corruptWarning: false };
    } catch {
        localStorage.removeItem(HISTORY_KEY);
        return { entries: [], corruptWarning: true };
    }
}

// ── Write ──────────────────────────────────────────────────────────────────

function writeHistory(entries: HistoryEntry[]): void {
    if (typeof window === 'undefined') return;
    try {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(entries));
    } catch {
        // QuotaExceededError – silently swallow; history is best-effort.
    }
}

// ── Public API ─────────────────────────────────────────────────────────────

/** Prepend a new entry and return it. */
export function addHistoryEntry(
    data: Omit<HistoryEntry, 'id' | 'createdAt'>
): HistoryEntry {
    const entry: HistoryEntry = {
        ...data,
        id: generateId(),
        createdAt: new Date().toISOString(),
    };
    const { entries } = readHistory();
    writeHistory([entry, ...entries]);
    return entry;
}

/** Find one entry by id; returns undefined if not found. */
export function getHistoryEntry(id: string): HistoryEntry | undefined {
    const { entries } = readHistory();
    return entries.find((e) => e.id === id);
}

/** Remove a single entry by id. */
export function deleteHistoryEntry(id: string): void {
    const { entries } = readHistory();
    writeHistory(entries.filter((e) => e.id !== id));
}

/** Wipe all history. */
export function clearHistory(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(HISTORY_KEY);
}
