/**
 * profileService.ts
 * ------------------
 * Fetches the authenticated user's profile from the backend.
 * - USE_MOCK=1 → returns mock profile.
 * - USE_MOCK=0 → GET /users/profile, with fallback to mock on failure.
 */

import { USE_MOCK } from '../config';
import { apiGet, ApiError } from '../apiClient';
import { getMockProfile, type MockProfile } from '../mocks/authMock';

// The backend response shape is not fully documented.
// We accept `unknown` and adapt to our MockProfile interface.
// TODO: Replace `unknown` with a proper Zod schema when contract is finalised.

function adaptProfile(raw: unknown): MockProfile {
    if (!raw || typeof raw !== 'object') {
        throw new ApiError('Неверный формат профиля');
    }
    const r = raw as Record<string, unknown>;
    return {
        id: String(r.id ?? r._id ?? ''),
        username: String(r.username ?? r.email ?? ''),
        first_name: String(r.first_name ?? r.firstName ?? ''),
        last_name: String(r.last_name ?? r.lastName ?? ''),
        role: String(r.role ?? r.specialty ?? ''),
        email: String(r.email ?? r.username ?? ''),
    };
}

/**
 * Fetch the current user's profile.
 * Falls back to mock on network / server errors (logs warning).
 */
export async function getProfile(): Promise<MockProfile> {
    if (USE_MOCK) {
        return getMockProfile();
    }

    try {
        const raw = await apiGet<unknown>('/users/profile');
        return adaptProfile(raw);
    } catch (err) {
        console.warn('[profileService] getProfile failed, falling back to mock:', err);
        return getMockProfile();
    }
}

export { ApiError };
