import { diagnoseForPatient, parseDiagnoseResponse, type DiagnoseResponseWithMode } from '../api';
import { addHistoryEntry, type HistoryEntry } from '../history';
import { addPatientRun } from '../patients';
import { getPatientRuns } from '../patientRuns';
import { apiGet } from '../apiClient';

import type { ChatRepository, SendMessageInput, SendMessagePayload } from './contracts';
import type { RepoResult } from '../models/schemas';

type ChatRole = 'doctor' | 'patient' | 'user' | 'human' | 'assistant' | 'ai' | 'system' | string;

interface ChatApiMessage {
  id: string;
  role: ChatRole;
  content: string;
  createdAt?: string;
  created_at?: string;
}

interface ChatApiListResponse {
  items: ChatApiMessage[];
  total: number;
  limit: number;
  offset: number;
}

function toIso(value: string | undefined): string {
  if (!value) return new Date(0).toISOString();
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? new Date(0).toISOString() : d.toISOString();
}

function isDoctorRole(role: string): boolean {
  const v = role.toLowerCase();
  return v === 'doctor' || v === 'patient' || v === 'user' || v === 'human';
}

function isAssistantRole(role: string): boolean {
  const v = role.toLowerCase();
  return v === 'assistant' || v === 'ai' || v === 'system' || v === 'bot' || v === 'model';
}

function parseResponseFromContent(content: string): DiagnoseResponseWithMode | null {
  if (!content) return null;

  try {
    const parsed = JSON.parse(content) as unknown;
    const response = parseDiagnoseResponse(parsed);
    return { ...response, mode: 'live' };
  } catch {
    return null;
  }
}

function mapChatItemsToHistory(items: ChatApiMessage[]): HistoryEntry[] {
  const sorted = [...items].sort(
    (a, b) => new Date(toIso(a.createdAt ?? a.created_at)).getTime() - new Date(toIso(b.createdAt ?? b.created_at)).getTime()
  );

  const entries: HistoryEntry[] = [];
  let pendingDoctor: ChatApiMessage | null = null;

  for (const msg of sorted) {
    const role = String(msg.role ?? '').toLowerCase();

    if (isDoctorRole(role)) {
      pendingDoctor = msg;
      continue;
    }

    if (isAssistantRole(role) && pendingDoctor) {
      const rawResponse = parseResponseFromContent(msg.content);
      const parsedDiagnoses = rawResponse?.diagnoses?.slice(0, 3) ?? [];

      entries.push({
        id: msg.id || `${pendingDoctor.id}_${msg.id}`,
        createdAt: toIso(msg.createdAt ?? msg.created_at),
        symptoms: pendingDoctor.content,
        rawResponse,
        parsedDiagnoses,
        latencyMs: 0,
        traceId: rawResponse?.trace_id,
        mode: rawResponse ? 'live' : null,
        error: rawResponse ? undefined : undefined,
      });

      pendingDoctor = null;
    }
  }

  return entries.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export const chatRepository: ChatRepository = {
  async listPatientHistory(patientId: string): Promise<RepoResult<HistoryEntry[]>> {
    try {
      const raw = await apiGet<ChatApiListResponse>(
        `/doctor/patients/${encodeURIComponent(patientId)}/chat?limit=100&offset=0`
      );

      const items = Array.isArray(raw?.items) ? raw.items : [];
      const mapped = mapChatItemsToHistory(items);

      return {
        data: mapped,
        source: 'backend',
      };
    } catch {
      return {
        data: getPatientRuns(patientId),
        source: 'local',
        reason: 'Failed to load backend chat history, using local run history',
      };
    }
  },

  async sendMessage(input: SendMessageInput): Promise<RepoResult<SendMessagePayload>> {
    const start = Date.now();

    let response: DiagnoseResponseWithMode | null = null;
    let errorMessage: string | undefined;

    try {
      response = await diagnoseForPatient(input.patientId, { symptoms: input.symptoms });
    } catch (err) {
      errorMessage = err instanceof Error ? err.message : 'Unknown error';
    }

    const latencyMs = Date.now() - start;
    const diagnoses = response?.diagnoses?.slice(0, 3) ?? [];

    const entry = addHistoryEntry({
      symptoms: input.symptoms,
      rawResponse: response,
      parsedDiagnoses: diagnoses,
      latencyMs,
      traceId: response?.trace_id,
      mode: response?.mode ?? (errorMessage ? null : 'live'),
      error: errorMessage,
    });

    addPatientRun(input.patientId, entry.id);

    return {
      data: { entry, response },
      source: 'local',
      reason: 'New runs are kept locally until backend send-message payload is finalized',
    };
  },
};
