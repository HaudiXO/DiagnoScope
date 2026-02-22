/**
 * authMock.ts
 * -----------
 * Mock data for auth operations when USE_MOCK=1.
 */

import type { TokenData } from '../authStorage';

export interface MockLoginResponse {
    access_token: string;
    token_type: string;
}

export interface MockProfile {
    id: string;
    username: string;
    first_name: string;
    last_name: string;
    role: string;
    email: string;
}

export function getMockLoginResponse(): MockLoginResponse {
    return {
        access_token: 'mock_jwt_token_' + Date.now(),
        token_type: 'bearer',
    };
}

export function getMockTokenData(): TokenData {
    const r = getMockLoginResponse();
    return { accessToken: r.access_token, tokenType: r.token_type };
}

export function getMockProfile(): MockProfile {
    return {
        id: 'doc_1',
        username: 'doctor@demo.local',
        first_name: 'Иван',
        last_name: 'Петров',
        role: 'Терапевт',
        email: 'doctor@demo.local',
    };
}
