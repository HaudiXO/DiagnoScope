import { diagnose, type DiagnoseResponseWithMode } from '../api';
import { addHistoryEntry, type HistoryEntry } from '../history';
import { addPatientRun } from '../patients';
import { getPatientRuns } from '../patientRuns';

import type { ChatRepository, SendMessageInput, SendMessagePayload } from './contracts';
import type { RepoResult } from '../models/schemas';
import { BackendEndpointMissingError, isFallbackError, isMockMode } from './helpers';

const backendChatRepo: ChatRepository = {
  async listPatientHistory(): Promise<RepoResult<HistoryEntry[]>> {
    throw new BackendEndpointMissingError('Missing backend endpoint for messages/history (GET /patients/{id}/messages or GET /patients/{id}/history)');
  },

  async sendMessage(): Promise<RepoResult<SendMessagePayload>> {
    throw new BackendEndpointMissingError('Missing backend endpoint for chat messages (POST /patients/{id}/messages)');
  },
};

const mockChatRepo: ChatRepository = {
  async listPatientHistory(patientId: string): Promise<RepoResult<HistoryEntry[]>> {
    return {
      data: getPatientRuns(patientId),
      source: 'mock',
      reason: 'USE_MOCK or backend chat endpoints unavailable',
    };
  },

  async sendMessage(input: SendMessageInput): Promise<RepoResult<SendMessagePayload>> {
    const start = Date.now();

    let response: DiagnoseResponseWithMode | null = null;
    let errorMessage: string | undefined;

    try {
      response = await diagnose({ symptoms: input.symptoms });
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
      source: 'mock',
      reason: 'USE_MOCK or backend chat endpoints unavailable',
    };
  },
};

export const chatRepository: ChatRepository = {
  async listPatientHistory(patientId) {
    if (isMockMode()) return mockChatRepo.listPatientHistory(patientId);
    try {
      return await backendChatRepo.listPatientHistory(patientId);
    } catch (err) {
      if (!isFallbackError(err)) throw err;
      return mockChatRepo.listPatientHistory(patientId);
    }
  },

  async sendMessage(input) {
    if (isMockMode()) return mockChatRepo.sendMessage(input);
    try {
      return await backendChatRepo.sendMessage(input);
    } catch (err) {
      if (!isFallbackError(err)) throw err;
      return mockChatRepo.sendMessage(input);
    }
  },
};
