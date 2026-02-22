import { ApiError } from '../apiClient';
import { USE_MOCK } from '../demoMode';

export class BackendEndpointMissingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BackendEndpointMissingError';
  }
}

export function isFallbackError(err: unknown): boolean {
  if (err instanceof BackendEndpointMissingError) return true;
  if (err instanceof ApiError) return true;
  return false;
}

export function isMockMode(): boolean {
  return USE_MOCK;
}
