import { apiGet, ApiError } from '../apiClient';

export interface UserProfile {
    id: string;
    username: string;
    first_name: string;
    last_name: string;
    role: string;
    email: string;
}

function adaptProfile(raw: unknown): UserProfile {
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

export async function getProfile(): Promise<UserProfile> {
    const raw = await apiGet<unknown>('/users/profile');
    return adaptProfile(raw);
}

export { ApiError };
