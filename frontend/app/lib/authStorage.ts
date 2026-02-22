/**
 * authStorage.ts
 * ---------------
 * Pure (non-React) helpers for persisting the auth token in localStorage.
 * Used by both apiClient (to attach Bearer header) and AuthProvider.
 */

export interface TokenData {
    accessToken: string;
    tokenType: string;      // e.g. "bearer"
}

const TOKEN_KEY = 'auth_token_data';

export function saveToken(data: TokenData): void {
    try {
        localStorage.setItem(TOKEN_KEY, JSON.stringify(data));
    } catch {
        console.warn('[authStorage] Failed to persist token');
    }
}

export function getToken(): TokenData | null {
    try {
        const raw = localStorage.getItem(TOKEN_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed.accessToken === 'string') {
            return parsed as TokenData;
        }
        return null;
    } catch {
        return null;
    }
}

export function clearToken(): void {
    try {
        localStorage.removeItem(TOKEN_KEY);
        // Also clear legacy key used by previous auth.tsx
        localStorage.removeItem('auth_token');
    } catch {
        // ignore
    }
}
