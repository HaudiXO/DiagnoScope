import { apiPost, ApiError } from '../apiClient';
import { saveToken, clearToken, type TokenData } from '../authStorage';
import { getProfile, type UserProfile } from './profileService';

export interface LoginResult {
    token: TokenData;
    profile: UserProfile;
}

export async function login(username: string, password: string): Promise<LoginResult> {
    const data = await apiPost<any>(
        '/auth/login',
        { username, password },
    );

    const tokenData: TokenData = {
        accessToken: data.accessToken || data.access_token,
        tokenType: data.tokenType || data.token_type || 'bearer',
    };

    saveToken(tokenData);

    let profile: UserProfile;
    try {
        profile = await getProfile();
    } catch {
        profile = {
            id: '',
            username,
            first_name: username,
            last_name: '',
            role: '',
            email: username,
        };
    }

    return { token: tokenData, profile };
}

export function logout(): void {
    clearToken();
    try {
        localStorage.removeItem('auth_doctor');
    } catch {
        // ignore
    }
}

export { ApiError };
