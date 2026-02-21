import {
    ApiErrorResponse,
    DiagnoseRequest,
    DiagnoseResponse,
    DiagnosisItem,
} from './contract';

// ── Config ─────────────────────────────────────────────────────────────────

const BASE_URL =
    process.env.NEXT_PUBLIC_API_BASE?.replace(/\/$/, '') ?? '';

const TIMEOUT_MS = 10_000;

// ── Error type ─────────────────────────────────────────────────────────────

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

// ── Error normaliser ───────────────────────────────────────────────────────

/**
 * Attempts to parse a non-2xx response body as the CONTRACT error envelope
 * { error_code, message, details?, trace_id? }.
 * Falls back to a generic message if the body is not valid JSON or doesn't
 * match the envelope shape (e.g. HTML error pages, empty body).
 */
export async function normalizeApiError(
    res: Response
): Promise<ApiError> {
    let raw: unknown;
    try {
        raw = await res.json();
    } catch {
        // Non-JSON body (HTML, empty) – generic fallback.
        return new ApiError(
            `Request failed (${res.status} ${res.statusText})`,
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

    // JSON but not the CONTRACT envelope – generic fallback.
    return new ApiError(
        `Request failed (${res.status} ${res.statusText})`,
        res.status
    );
}

// ── Fetch wrapper ──────────────────────────────────────────────────────────

/**
 * POST /diagnose and return a validated, sorted DiagnoseResponse.
 * Throws ApiError on non-2xx, network failure, or validation error.
 */
export async function diagnose(
    req: DiagnoseRequest
): Promise<DiagnoseResponse> {
    // Validate the outgoing request first.
    const parsed = DiagnoseRequest.safeParse(req);
    if (!parsed.success) {
        throw new ApiError(
            'Invalid request: ' + parsed.error.issues[0].message
        );
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    let res: Response;
    try {
        res = await fetch(`${BASE_URL}/diagnose`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(parsed.data),
            signal: controller.signal,
        });
    } catch (err: unknown) {
        clearTimeout(timer);
        if (err instanceof DOMException && err.name === 'AbortError') {
            throw new ApiError('Request timed out after 10 seconds');
        }
        throw new ApiError(
            err instanceof Error ? err.message : 'Network error'
        );
    } finally {
        clearTimeout(timer);
    }

    if (!res.ok) {
        throw await normalizeApiError(res);
    }

    let raw: unknown;
    try {
        raw = await res.json();
    } catch {
        throw new ApiError('Response is not valid JSON');
    }

    return parseDiagnoseResponse(raw);
}

// ── Response parser ────────────────────────────────────────────────────────

/**
 * Accepts unknown input, filters invalid DiagnosisItems (missing rank or
 * icd10_code), and returns items sorted ascending by rank.
 * Never throws – invalid items are silently dropped.
 */
export function parseDiagnoseResponse(raw: unknown): DiagnoseResponse {
    // passthrough() keeps unknown extra fields at the top level.
    const result = DiagnoseResponse.passthrough().safeParse(raw);

    if (!result.success) {
        throw new ApiError(
            'Response shape is invalid: diagnoses array is missing or malformed'
        );
    }

    // Filter items that fail DiagnosisItem validation (e.g. missing rank/icd10_code).
    const validItems: DiagnosisItem[] = result.data.diagnoses.filter(
        (item): item is DiagnosisItem => DiagnosisItem.safeParse(item).success
    );

    return {
        ...result.data,
        diagnoses: validItems.sort((a, b) => a.rank - b.rank),
    };
}
