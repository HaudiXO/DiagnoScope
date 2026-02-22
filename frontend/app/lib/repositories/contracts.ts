import type { DiagnoseResponseWithMode } from '../api';
import type { HistoryEntry } from '../history';
import type { Patient } from '../models/schemas';
import type { RepoResult, PatientList } from '../models/schemas';

export interface CreatePatientInput {
  name: string;
  age?: number;
}

export interface HistoryListParams {
  patientId?: string;
  limit?: number;
  offset?: number;
}

export interface HistoryListPayload {
  items: HistoryEntry[];
  total: number;
  limit: number;
  offset: number;
  backendSupported: boolean;
}

export interface SendMessageInput {
  patientId: string;
  symptoms: string;
}

export interface SendMessagePayload {
  entry: HistoryEntry;
  response: DiagnoseResponseWithMode | null;
}

export interface PatientRepository {
  listPatients(): Promise<RepoResult<PatientList>>;
  getPatient(patientId: string): Promise<RepoResult<Patient | null>>;
  createPatient(input: CreatePatientInput): Promise<RepoResult<Patient>>;
  resetDemoData(): Promise<RepoResult<void>>;
}

export interface HistoryRepository {
  listHistory(params?: HistoryListParams): Promise<RepoResult<HistoryListPayload>>;
  getHistoryEntry(entryId: string): Promise<RepoResult<HistoryEntry | null>>;
  clearHistory(): Promise<RepoResult<void>>;
}

export interface ChatRepository {
  listPatientHistory(patientId: string): Promise<RepoResult<HistoryEntry[]>>;
  sendMessage(input: SendMessageInput): Promise<RepoResult<SendMessagePayload>>;
}
