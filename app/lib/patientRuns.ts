/**
 * patientRuns.ts
 * --------------
 * Convenience re-exports for the patient ↔ history-run association layer.
 * The actual storage logic lives in patients.ts and history.ts.
 */

export {
    addPatientRun,
    getLastPatientRun,
    readPatients,
    addPatient,
    type Patient,
    PATIENT_RUNS_KEY,
} from './patients';

export {
    readHistory,
    addHistoryEntry,
    getHistoryEntry,
    deleteHistoryEntry,
    type HistoryEntry,
    HISTORY_KEY,
} from './history';
