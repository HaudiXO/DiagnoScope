import {
    ApiErrorResponse,
    DiagnoseRequest,
    DiagnoseResponse,
    DiagnosisItem,
} from './contract';
import { REQUEST_TIMEOUT_MS, API_BASE_URL } from './config';
import { getToken } from './authStorage';

export type DiagnoseMode = 'live';

export type DiagnoseResponseWithMode = DiagnoseResponse & {
    mode?: DiagnoseMode;
};

export class ApiError extends Error {
    constructor(
        message: string,
        public readonly status?: number,
        public readonly errorCode?: string,
        public readonly traceId?: string
    ) {
        super(message);
        this.name = 'ApiError';
    }
}

export async function normalizeApiError(
    res: Response
): Promise<ApiError> {
    let raw: unknown;
    try {
        raw = await res.json();
    } catch {
        return new ApiError(
            `Ошибка запроса (${res.status} ${res.statusText})`,
            res.status
        );
    }

    const parsed = ApiErrorResponse.safeParse(raw);
    if (parsed.success) {
        const { error_code, message, trace_id } = parsed.data;
        return new ApiError(
            `[${error_code}] ${message}`,
            res.status,
            error_code,
            trace_id
        );
    }

    return new ApiError(
        `Ошибка запроса (${res.status} ${res.statusText})`,
        res.status
    );
}

function authHeaders(): Record<string, string> {
    const token = getToken();
    if (token) {
        return { Authorization: `${token.tokenType || 'Bearer'} ${token.accessToken}` };
    }
    return {};
}

export async function diagnoseForPatient(
    patientId: string,
    req: DiagnoseRequest
): Promise<DiagnoseResponseWithMode> {
    const parsed = DiagnoseRequest.safeParse(req);
    if (!parsed.success) {
        throw new ApiError(
            'Неверный запрос: ' + parsed.error.issues[0].message
        );
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    const encodedId = encodeURIComponent(patientId);
    const endpoints = [
        `${API_BASE_URL}/doctor/patients/${encodedId}/chat`,
        `${API_BASE_URL}/${encodedId}/chat`,
    ];
    const chatPayload = {
        ...parsed.data,
        message: parsed.data.symptoms,
        text: parsed.data.symptoms,
    };

    let raw: unknown = null;
    let hit = false;

    try {
        for (const endpoint of endpoints) {
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...authHeaders(),
                },
                body: JSON.stringify(chatPayload),
                signal: controller.signal,
            });

            if (res.status === 404) {
                continue;
            }

            if (!res.ok) {
                throw await normalizeApiError(res);
            }

            try {
                raw = await res.json();
            } catch {
                throw new ApiError(
                    'Неверный формат ответа: пустой или поврежденный JSON',
                    res.status
                );
            }

            hit = true;
            break;
        }
    } catch (err) {
        if (err instanceof ApiError) {
            throw err;
        }
        throw new ApiError('Таймаут или ошибка сети');
    } finally {
        clearTimeout(timer);
    }

    if (!hit) {
        throw new ApiError(
            'Не найден chat endpoint. Ожидался POST /doctor/patients/{patientId}/chat или /{patientId}/chat',
            404
        );
    }

    const response = parseDiagnoseResponse(raw);
    return {
        ...response,
        mode: 'live',
    };
}

export function parseDiagnoseResponse(raw: unknown): DiagnoseResponse {
    const payload = unwrapDiagnosePayload(raw);

    const result = DiagnoseResponse.passthrough().safeParse(payload);

    if (!result.success) {
        throw new ApiError(
            'Неверный формат ответа: отсутствует или поврежден массив диагнозов'
        );
    }

    const validItems: DiagnosisItem[] = result.data.diagnoses.filter(
        (item): item is DiagnosisItem => DiagnosisItem.safeParse(item).success
    );

    return {
        ...result.data,
        diagnoses: validItems.sort((a, b) => a.rank - b.rank),
    };
}

function unwrapDiagnosePayload(raw: unknown): unknown {
    if (!raw || typeof raw !== 'object') return raw;

    const obj = raw as Record<string, unknown>;
    if (Array.isArray(obj.diagnoses)) return obj;

    const nestedKeys = ['data', 'result', 'response', 'payload'];
    for (const key of nestedKeys) {
        const candidate = obj[key];
        if (!candidate || typeof candidate !== 'object') continue;
        if (Array.isArray((candidate as Record<string, unknown>).diagnoses)) {
            return candidate;
        }
    }

    return raw;
}
