/**
 * apiClient.ts
 * -------------
 * Centralised HTTP client.
 * - Reads baseURL & timeout from config
 * - Auto-attaches Authorization: Bearer <token>
 * - Unified error handling (401/403/5xx/timeout/network)
 */

import { API_BASE_URL, REQUEST_TIMEOUT_MS } from './config';
import { getToken } from './authStorage';

export class ApiError extends Error {
    constructor(
        message: string,
        public readonly status?: number,
        public readonly code?: string,
    ) {
        super(message);
        this.name = 'ApiError';
    }
}

function authHeaders(): Record<string, string> {
    const token = getToken();
    if (token) {
        return { Authorization: `${token.tokenType || 'Bearer'} ${token.accessToken}` };
    }
    return {};
}

async function handleResponse<T>(res: Response): Promise<T> {
    if (res.ok) {
        if (res.status === 204) return undefined as unknown as T;
        return res.json() as Promise<T>;
    }

    let errMsg = `Ошибка запроса (${res.status})`;
    let errCode: string | undefined;
    try {
        const body = await res.json();
        if (body?.message) errMsg = body.message;
        if (body?.error_code) errCode = body.error_code;
    } catch {
        // body not JSON — use default msg
    }

    throw new ApiError(errMsg, res.status, errCode);
}

type RequestOptions = {
    signal?: AbortSignal;
    timeoutMs?: number;
};

function withTimeoutSignal(options?: RequestOptions): { signal: AbortSignal; clear: () => void } {
    const controller = new AbortController();
    const timeoutMs = options?.timeoutMs ?? REQUEST_TIMEOUT_MS;
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    if (options?.signal) {
        options.signal.addEventListener('abort', () => controller.abort(), { once: true });
    }

    return {
        signal: controller.signal,
        clear: () => clearTimeout(timer),
    };
}

export async function apiGet<T = unknown>(path: string, options?: RequestOptions): Promise<T> {
    const timeout = withTimeoutSignal(options);

    try {
        const res = await fetch(`${API_BASE_URL}${path}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                ...authHeaders(),
            },
            signal: timeout.signal,
        });
        return await handleResponse<T>(res);
    } catch (err) {
        if (err instanceof ApiError) throw err;
        throw new ApiError('Таймаут или ошибка сети', undefined, 'NETWORK_ERROR');
    } finally {
        timeout.clear();
    }
}

export async function apiPost<T = unknown>(
    path: string,
    body?: unknown,
    requestOptions?: RequestOptions,
): Promise<T> {
    const timeout = withTimeoutSignal(requestOptions);

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...authHeaders(),
    };
    const serializedBody = body !== undefined ? JSON.stringify(body) : undefined;

    try {
        const res = await fetch(`${API_BASE_URL}${path}`, {
            method: 'POST',
            headers,
            body: serializedBody,
            signal: timeout.signal,
        });
        return await handleResponse<T>(res);
    } catch (err) {
        if (err instanceof ApiError) throw err;
        throw new ApiError('Таймаут или ошибка сети', undefined, 'NETWORK_ERROR');
    } finally {
        timeout.clear();
    }
}
