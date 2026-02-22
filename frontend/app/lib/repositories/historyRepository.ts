import {
  clearHistory as clearLocalHistory,
  getHistoryEntry as getLocalHistoryEntry,
  readHistory,
  type HistoryEntry,
} from '../history';
import { getPatientRuns } from '../patientRuns';
import type { HistoryRepository, HistoryListParams, HistoryListPayload } from './contracts';
import type { RepoResult } from '../models/schemas';
import { BackendEndpointMissingError, isFallbackError, isMockMode } from './helpers';

function paginate(items: HistoryEntry[], limit: number, offset: number): HistoryListPayload {
  return {
    items: items.slice(offset, offset + limit),
    total: items.length,
    limit,
    offset,
    backendSupported: false,
  };
}

const backendHistoryRepo: HistoryRepository = {
  async listHistory(): Promise<RepoResult<HistoryListPayload>> {
    throw new BackendEndpointMissingError('Missing backend endpoint for history (GET /history or GET /patients/{id}/history)');
  },

  async getHistoryEntry(): Promise<RepoResult<HistoryEntry | null>> {
    throw new BackendEndpointMissingError('Missing backend endpoint for result (GET /results/{id})');
  },

  async clearHistory(): Promise<RepoResult<void>> {
    throw new BackendEndpointMissingError('Missing backend endpoint for history clear');
  },
};

const mockHistoryRepo: HistoryRepository = {
  async listHistory(params?: HistoryListParams): Promise<RepoResult<HistoryListPayload>> {
    const limit = params?.limit ?? 20;
    const offset = params?.offset ?? 0;

    const items = params?.patientId
      ? getPatientRuns(params.patientId)
      : readHistory().entries;

    return {
      data: paginate(items, limit, offset),
      source: 'mock',
      reason: 'USE_MOCK or backend history endpoints unavailable',
    };
  },

  async getHistoryEntry(entryId: string): Promise<RepoResult<HistoryEntry | null>> {
    return {
      data: getLocalHistoryEntry(entryId) ?? null,
      source: 'mock',
      reason: 'USE_MOCK or backend result endpoints unavailable',
    };
  },

  async clearHistory(): Promise<RepoResult<void>> {
    clearLocalHistory();
    return {
      data: undefined,
      source: 'mock',
      reason: 'USE_MOCK or backend history endpoints unavailable',
    };
  },
};

export const historyRepository: HistoryRepository = {
  async listHistory(params) {
    if (isMockMode()) return mockHistoryRepo.listHistory(params);
    try {
      return await backendHistoryRepo.listHistory(params);
    } catch (err) {
      if (!isFallbackError(err)) throw err;
      return mockHistoryRepo.listHistory(params);
    }
  },

  async getHistoryEntry(entryId) {
    if (isMockMode()) return mockHistoryRepo.getHistoryEntry(entryId);
    try {
      return await backendHistoryRepo.getHistoryEntry(entryId);
    } catch (err) {
      if (!isFallbackError(err)) throw err;
      return mockHistoryRepo.getHistoryEntry(entryId);
    }
  },

  async clearHistory() {
    if (isMockMode()) return mockHistoryRepo.clearHistory();
    try {
      return await backendHistoryRepo.clearHistory();
    } catch (err) {
      if (!isFallbackError(err)) throw err;
      return mockHistoryRepo.clearHistory();
    }
  },
};
