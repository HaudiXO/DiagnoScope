import { diagnoseForPatient, parseDiagnoseResponse, type DiagnoseResponseWithMode } from '../api';
import { addHistoryEntry, type HistoryEntry } from '../history';
import { addPatientRun } from '../patients';
import { getPatientRuns } from '../patientRuns';
import { apiGet } from '../apiClient';
import type { DiagnosisItem } from '../contract';

import type { ChatRepository, SendMessageInput, SendMessagePayload } from './contracts';
import type { RepoResult } from '../models/schemas';

type ChatRole = 'doctor' | 'patient' | 'user' | 'human' | 'assistant' | 'ai' | 'system' | string;

/**
 * Maps to backend ChatMessageResponseData schema (src/presentation/api/patient/schemas.py):
 * - id: string
 * - role: string ('doctor' | 'assistant' | etc.)
 * - content: string (JSON for assistant messages with diagnoses, plain text for doctor)
 * - created_at: ISO datetime string
 */
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

/**
 * Extract timestamp from a ChatApiMessage.
 * Handles both camelCase (createdAt) and snake_case (created_at) from backend.
 */
function getTimestamp(msg: ChatApiMessage): string {
  return msg.createdAt ?? msg.created_at ?? new Date(0).toISOString();
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
    // Content is not JSON - could be plain text diagnoses from backend
    // Return null to indicate parsing failed; caller should handle raw content
    return null;
  }
}

/**
 * Parse plain text diagnoses from backend response.
 * Expected format:
 *   1. Diagnosis Name (ICD-10: CODE)
 *      Description text...
 *
 *   2. Another Diagnosis (ICD-10: CODE)
 *      Description...
 */
function parsePlainTextDiagnoses(content: string): DiagnosisItem[] {
  if (!content) return [];

  const diagnoses: DiagnosisItem[] = [];
  const lines = content.split('\n');

  // Pattern to match: "1. Diagnosis Name (ICD-10: CODE)" or "1. Дефицит витамина B12 (ICD-10: B12)"
  const diagnosisPattern = /^(\d+)\.\s+(.+?)\s*\(ICD-10:\s*([^)]+)\)/i;

  let currentDiagnosis: Partial<DiagnosisItem> | null = null;
  let descriptionLines: string[] = [];
  let rank = 0;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      // Empty line - if we have a current diagnosis, save the description
      if (currentDiagnosis) {
        currentDiagnosis.description = descriptionLines.join('\n').trim();
        diagnoses.push(currentDiagnosis as DiagnosisItem);
        currentDiagnosis = null;
        descriptionLines = [];
      }
      continue;
    }

    const match = trimmed.match(diagnosisPattern);
    if (match) {
      // Save previous diagnosis if exists
      if (currentDiagnosis) {
        currentDiagnosis.description = descriptionLines.join('\n').trim();
        diagnoses.push(currentDiagnosis as DiagnosisItem);
        descriptionLines = [];
      }

      rank++;
      const diagnosisName = match[2].trim();
      const icdCode = match[3].trim();

      currentDiagnosis = {
        rank,
        icd10_code: icdCode,
        diagnosis: diagnosisName,
      };
    } else if (currentDiagnosis) {
      // This is a description line for the current diagnosis
      descriptionLines.push(trimmed);
    }
  }

  // Don't forget the last diagnosis
  if (currentDiagnosis) {
    currentDiagnosis.description = descriptionLines.join('\n').trim();
    diagnoses.push(currentDiagnosis as DiagnosisItem);
  }

  return diagnoses.slice(0, 3); // Limit to top 3
}

function mapChatItemsToHistory(items: ChatApiMessage[]): HistoryEntry[] {
  console.log('[chatRepository] mapChatItemsToHistory input:', items);

  const sorted = [...items].sort(
    (a, b) => new Date(toIso(getTimestamp(a))).getTime() - new Date(toIso(getTimestamp(b))).getTime()
  );

  const entries: HistoryEntry[] = [];
  let pendingDoctor: ChatApiMessage | null = null;

  for (const msg of sorted) {
    const role = String(msg.role ?? '').toLowerCase();
    console.log(`[chatRepository] Processing msg: id=${msg.id}, role=${role}, contentPreview=${msg.content?.slice(0, 50)}...`);

    if (isDoctorRole(role)) {
      // If there was a previous pending doctor message without an assistant response,
      // skip it - we only want complete pairs
      pendingDoctor = msg;
      continue;
    }

    if (isAssistantRole(role) && pendingDoctor) {
      const rawResponse = parseResponseFromContent(msg.content);
      console.log('[chatRepository] Parsed assistant response:', { rawResponse: rawResponse ? 'valid' : 'null', diagnosesCount: rawResponse?.diagnoses?.length ?? 0 });

      let parsedDiagnoses: DiagnosisItem[] = [];
      let error: string | undefined;
      let mode: 'live' | null = 'live';

      let rawContent: string | undefined;

      if (rawResponse) {
        // Successfully parsed JSON response with diagnoses
        parsedDiagnoses = rawResponse.diagnoses?.slice(0, 3) ?? [];
      } else if (msg.content.trim()) {
        // Content is plain text (not JSON) - store raw content for display
        rawContent = msg.content;
        // Try to parse plain text for diagnosis cards as well
        parsedDiagnoses = parsePlainTextDiagnoses(msg.content);
      } else {
        // Empty or error response
        error = msg.content.startsWith('{"error"') ? 'Error in response' : undefined;
        mode = null;
      }

      entries.push({
        id: msg.id || `${pendingDoctor.id}_${msg.id}`,
        createdAt: toIso(getTimestamp(msg)),
        symptoms: pendingDoctor.content,
        rawResponse,
        parsedDiagnoses,
        rawContent,
        latencyMs: 0,
        traceId: rawResponse?.trace_id,
        mode,
        error,
      });

      pendingDoctor = null;
    }
  }

  // Skip unpaired doctor messages - they don't form a complete entry

  console.log('[chatRepository] mapChatItemsToHistory output entries:', entries.length);

  return entries.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export const chatRepository: ChatRepository = {
  async listPatientHistory(patientId: string): Promise<RepoResult<HistoryEntry[]>> {
    try {
      const raw = await apiGet<ChatApiListResponse | { data?: ChatApiListResponse }>(
        `/doctor/patients/${encodeURIComponent(patientId)}/chat?limit=100&offset=0`
      );

      // Handle both { items: ... } and { data: { items: ... } } formats
      const listData = 'data' in raw && raw.data ? raw.data : raw as ChatApiListResponse;
      const items = Array.isArray(listData?.items) ? listData.items : [];
      const mapped = mapChatItemsToHistory(items);

      return {
        data: mapped,
        source: 'backend',
      };
    } catch (err) {
      console.error('[chatRepository] Failed to load chat history:', err);
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
