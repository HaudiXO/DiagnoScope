/**
 * patients.ts
 * -----------
 * Typed localStorage persistence for patients and their run associations.
 * Keys:
 *   dx_patients_v1        – Patient[]
 *   dx_patient_runs_v1    – Record<patientId, historyEntryId[]> (newest first)
 *
 * Seed patients use deterministic IDs so they remain stable across reloads.
 * On corrupt JSON the relevant key is silently reset.
 */

import { readHistory, type HistoryEntry } from './history';

export const PATIENTS_KEY = 'dx_patients_v1';
export const PATIENT_RUNS_KEY = 'dx_patient_runs_v1';

export interface Patient {
    id: string;
    name: string;
    age?: number;
    createdAt: string; // ISO-8601
}

// ── Seed data (deterministic IDs) ──────────────────────────────────────────

const SEED_PATIENTS: Patient[] = [
    { id: 'pt-001', name: 'Alice Moreau', age: 34, createdAt: '2026-01-15T08:00:00.000Z' },
    { id: 'pt-002', name: 'Bruno Santos', age: 52, createdAt: '2026-01-20T09:30:00.000Z' },
    { id: 'pt-003', name: 'Clara Hoffmann', age: 28, createdAt: '2026-02-01T11:00:00.000Z' },
    { id: 'pt-004', name: 'David Osei', age: 45, createdAt: '2026-02-10T14:00:00.000Z' },
    { id: 'pt-005', name: 'Elena Kozlov', age: 61, createdAt: '2026-02-18T16:00:00.000Z' },
];

// ── Patient store helpers ──────────────────────────────────────────────────

function readRaw(): Patient[] {
    if (typeof window === 'undefined') return [];
    try {
        const raw = localStorage.getItem(PATIENTS_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) throw new Error('not array');
        return parsed as Patient[];
    } catch {
        localStorage.removeItem(PATIENTS_KEY);
        return [];
    }
}

function writePatients(patients: Patient[]): void {
    if (typeof window === 'undefined') return;
    try {
        localStorage.setItem(PATIENTS_KEY, JSON.stringify(patients));
    } catch { /* QuotaExceededError – best-effort */ }
}

// ── Public patient API ─────────────────────────────────────────────────────

/**
 * Seed only if storage is empty. Safe to call on every page load.
 */
export function initPatients(): void {
    if (typeof window === 'undefined') return;
    if (readRaw().length === 0) writePatients(SEED_PATIENTS);
}

/** Returns all patients, seeding if empty. Resets on corruption. */
export function readPatients(): Patient[] {
    initPatients();
    return readRaw();
}

/** Add a new patient with a random (non-colliding) id. */
export function addPatient(data: { name: string; age?: number }): Patient {
    const patients = readRaw();
    const patient: Patient = {
        id: `pt-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`,
        name: data.name.trim(),
        age: data.age,
        createdAt: new Date().toISOString(),
    };
    writePatients([...patients, patient]);
    return patient;
}

// ── Patient ↔ history-run associations ────────────────────────────────────

function readRunsMap(): Record<string, string[]> {
    if (typeof window === 'undefined') return {};
    try {
        const raw = localStorage.getItem(PATIENT_RUNS_KEY);
        if (!raw) return {};
        const parsed = JSON.parse(raw);
        if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed))
            throw new Error('bad shape');
        return parsed as Record<string, string[]>;
    } catch {
        localStorage.removeItem(PATIENT_RUNS_KEY);
        return {};
    }
}

function writeRunsMap(map: Record<string, string[]>): void {
    if (typeof window === 'undefined') return;
    try {
        localStorage.setItem(PATIENT_RUNS_KEY, JSON.stringify(map));
    } catch { /* quota */ }
}

/** Associate a history entry id with a patient (prepend = newest first). */
export function addPatientRun(patientId: string, entryId: string): void {
    const map = readRunsMap();
    map[patientId] = [entryId, ...(map[patientId] ?? [])];
    writeRunsMap(map);
}

/**
 * Return the most recent HistoryEntry for a patient, or undefined if none.
 * Never throws.
 */
export function getLastPatientRun(patientId: string): HistoryEntry | undefined {
    try {
        const map = readRunsMap();
        const ids = map[patientId] ?? [];
        if (ids.length === 0) return undefined;
        const { entries } = readHistory();
        return entries.find((e) => e.id === ids[0]);
    } catch {
        return undefined;
    }
}

// ── Demo reset ─────────────────────────────────────────────────────────────

/**
 * Wipe patients, run associations, and diagnosis history, then reseed patients.
 * Accepts the history key as a parameter to avoid importing the constant
 * (keeps the dependency direction clean).
 */
export function resetDemoData(historyKey = 'dx_history_v1'): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(PATIENTS_KEY);
    localStorage.removeItem(PATIENT_RUNS_KEY);
    localStorage.removeItem(historyKey);
    writePatients(SEED_PATIENTS);
}
