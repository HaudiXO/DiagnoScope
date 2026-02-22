import { diagnoseForPatient, type DiagnoseResponseWithMode } from '../api';
import { addHistoryEntry, type HistoryEntry } from '../history';
import { addPatientRun } from '../patients';
import { getPatientRuns } from '../patientRuns';

import type { ChatRepository, SendMessageInput, SendMessagePayload } from './contracts';
import type { RepoResult } from '../models/schemas';

export const chatRepository: ChatRepository = {
  async listPatientHistory(patientId: string): Promise<RepoResult<HistoryEntry[]>> {
    return {
      data: getPatientRuns(patientId),
      source: 'local',
      reason: 'Patient run history is currently stored on the client',
    };
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
      reason: 'Patient run history is currently stored on the client',
    };
  },
};
