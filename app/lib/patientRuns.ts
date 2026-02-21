/**
 * patientRuns.ts
 * --------------
 * Conveniences for reading a patient's diagnosis run history.
 * Data is stored in dx_history_v1 (via history.ts) and associated
 * via dx_patient_runs_v1 (via patients.ts). This module just provides
 * a typed helper to fetch them in order.
 */

import { readHistory, type HistoryEntry } from './history';

export type { HistoryEntry } from './history';

function readRunsMap(): Record<string, string[]> {
    if (typeof window === 'undefined') return {};
    try {
        const raw = localStorage.getItem('dx_patient_runs_v1');
        if (!raw) return {};
        const parsed = JSON.parse(raw);
        if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed))
            return {};
        return parsed as Record<string, string[]>;
    } catch {
        return {};
    }
}

/**
 * Returns HistoryEntry[] for a patient, newest-first.
 * Missing or corrupt entries are silently skipped.
 */
export function getPatientRuns(patientId: string): HistoryEntry[] {
    const map = readRunsMap();
    const ids: string[] = map[patientId] ?? [];
    if (ids.length === 0) return [];
    const { entries } = readHistory();
    const byId = new Map(entries.map((e) => [e.id, e]));
    return ids.flatMap((id) => {
        const e = byId.get(id);
        return e ? [e] : [];
    });
}
