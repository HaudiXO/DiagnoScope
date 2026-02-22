/**
 * authService.ts
 * ---------------
 * Auth operations: login / logout.
 * - USE_MOCK=1 → returns mock data, no network call.
 * - USE_MOCK=0 → POST /auth/login (form-urlencoded, OAuth2 convention).
 */

import { USE_MOCK } from '../config';
import { apiPost, ApiError } from '../apiClient';
import { saveToken, clearToken, type TokenData } from '../authStorage';
import { getMockLoginResponse, getMockProfile, type MockProfile } from '../mocks/authMock';

export interface LoginResult {
    token: TokenData;
    profile: MockProfile; // same shape for both mock & real
    isMock: boolean;
}

/**
 * Authenticate against the backend (or mock).
 *
 * Backend is expected to accept OAuth2 `username` + `password` form fields
 * and return `{ access_token, token_type }`.
 *
 * We then attempt `GET /users/profile` to fetch the user profile.
 * If profile fetch fails, we return a minimal profile built from the username.
 */
export async function login(username: string, password: string): Promise<LoginResult> {
    if (USE_MOCK) {
        const mockLogin = getMockLoginResponse();
        const tokenData: TokenData = {
            accessToken: mockLogin.access_token,
            tokenType: mockLogin.token_type,
        };
        saveToken(tokenData);
        return {
            token: tokenData,
            profile: getMockProfile(),
            isMock: true,
        };
    }

    // Real API call
    const data = await apiPost<{ access_token: string; token_type: string }>(
        '/auth/login',
        { username, password },
        { formUrlEncoded: true },
    );

    const tokenData: TokenData = {
        accessToken: data.access_token,
        tokenType: data.token_type,
    };
    saveToken(tokenData);

    // Try to fetch profile after login
    let profile: MockProfile;
    try {
        const { getProfile } = await import('./profileService');
        profile = await getProfile();
    } catch {
        // If /users/profile fails, build a minimal one
        profile = {
            id: '',
            username,
            first_name: username,
            last_name: '',
            role: '',
            email: username,
        };
    }

    return { token: tokenData, profile, isMock: false };
}

/**
 * Clear stored token and doctor data.
 */
export function logout(): void {
    clearToken();
    try {
        localStorage.removeItem('auth_doctor');
    } catch {
        // ignore
    }
}

export { ApiError };
