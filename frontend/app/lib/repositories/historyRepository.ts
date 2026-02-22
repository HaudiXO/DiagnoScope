import {
  clearHistory as clearLocalHistory,
  getHistoryEntry as getLocalHistoryEntry,
  readHistory,
  type HistoryEntry,
} from '../history';
import { getPatientRuns } from '../patientRuns';
import type { HistoryRepository, HistoryListParams, HistoryListPayload } from './contracts';
import type { RepoResult } from '../models/schemas';

function paginate(items: HistoryEntry[], limit: number, offset: number): HistoryListPayload {
  return {
    items: items.slice(offset, offset + limit),
    total: items.length,
    limit,
    offset,
    backendSupported: false,
  };
}

export const historyRepository: HistoryRepository = {
  async listHistory(params?: HistoryListParams): Promise<RepoResult<HistoryListPayload>> {
    const limit = params?.limit ?? 20;
    const offset = params?.offset ?? 0;

    const items = params?.patientId
      ? getPatientRuns(params.patientId)
      : readHistory().entries;

    return {
      data: paginate(items, limit, offset),
      source: 'local',
      reason: 'History is stored locally until backend endpoints are available',
    };
  },

  async getHistoryEntry(entryId: string): Promise<RepoResult<HistoryEntry | null>> {
    return {
      data: getLocalHistoryEntry(entryId) ?? null,
      source: 'local',
      reason: 'History is stored locally until backend endpoints are available',
    };
  },

  async clearHistory(): Promise<RepoResult<void>> {
    clearLocalHistory();
    return {
      data: undefined,
      source: 'local',
      reason: 'History is stored locally until backend endpoints are available',
    };
  },
};
