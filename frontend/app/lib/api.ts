import {
    ApiErrorResponse,
    DiagnoseRequest,
    DiagnoseResponse,
    DiagnosisItem,
} from './contract';
import { USE_MOCK } from './demoMode';
import { REQUEST_TIMEOUT_MS, API_BASE_URL } from './config';
import { getToken } from './authStorage';
import rawFixtures from './fixtures/diagnose_fixtures.json';

// ── Config ─────────────────────────────────────────────────────────────────

export type FixtureMode = 'demo' | 'fallback';

// ── Extended response type (mode is appended post-parse; not in Zod schema) ─

export type DiagnoseResponseWithMode = DiagnoseResponse & {
    mode?: FixtureMode;
};

// ── Fixture types ──────────────────────────────────────────────────────────

interface FixtureEntry {
    _comment?: string;
    keywords: string[];
    request: unknown;
    response: unknown;
}

// ── Fixture validation (dev only, runs once on first use) ──────────────────

let fixturesValidated = false;

function validateFixtures(): void {
    if (fixturesValidated || process.env.NODE_ENV !== 'development') return;
    fixturesValidated = true;

    (rawFixtures as FixtureEntry[]).forEach((entry, i) => {
        const result = DiagnoseResponse.safeParse(entry.response);
        if (!result.success) {
            console.error(
                `[demoMode] Fixture #${i} ("${entry._comment ?? ''}") failed CONTRACT validation:`,
                result.error.flatten()
            );
        }
    });
}

// ── Fixture selector ───────────────────────────────────────────────────────

function getFallbackFixture(symptoms: string): DiagnoseResponseWithMode {
    validateFixtures();

    const lower = symptoms.toLowerCase();
    const fixtures = rawFixtures as FixtureEntry[];

    const match =
        fixtures.find((f) =>
            f.keywords.some((kw) => lower.includes(kw))
        ) ?? fixtures[0];

    const parsed = parseDiagnoseResponse(match.response);

    if (parsed.diagnoses.length === 0) {
        if (process.env.NODE_ENV === 'development') {
            console.error(
                '[demoMode] Selected fixture produced empty diagnoses array. ' +
                'Ensure fixtures always contain at least one valid DiagnosisItem.'
            );
        }
        return {
            ...parsed,
            diagnoses: [
                {
                    rank: 1,
                    icd10_code: 'Z03.89',
                    description: 'Наблюдение при подозрении на другие заболевания',
                    confidence: 0,
                    reasoning: 'Нет доступных данных.',
                },
            ],
        };
    }

    return parsed;
}

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

// ── Auth headers helper ────────────────────────────────────────────────────

function authHeaders(): Record<string, string> {
    const token = getToken();
    if (token) {
        return { Authorization: `${token.tokenType || 'Bearer'} ${token.accessToken}` };
    }
    return {};
}

// ── Fetch wrapper ──────────────────────────────────────────────────────────

/**
 * POST /diagnose (or /mock/random_diagnose) and return a validated,
 * sorted DiagnoseResponseWithMode.
 *
 * Behaviour:
 *  - USE_MOCK=true  → return fixture immediately (mode="demo")
 *  - else           → call backend with timeout
 *    • timeout / network error / !res.ok / schema error → fixture (mode="fallback")
 * Never throws once a fixture is available.
 */
export async function diagnose(
    req: DiagnoseRequest
): Promise<DiagnoseResponseWithMode> {
    const parsed = DiagnoseRequest.safeParse(req);
    if (!parsed.success) {
        throw new ApiError(
            'Неверный запрос: ' + parsed.error.issues[0].message
        );
    }

    // ── Demo mode ────────────────────────────────────────────────────────
    if (USE_MOCK) {
        const fixture = getFallbackFixture(parsed.data.symptoms);
        return { ...fixture, mode: 'demo' };
    }

    // ── Live fetch with configurable timeout ─────────────────────────────
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    // Determine endpoint: use /mock/random_diagnose if available, else /diagnose
    const endpoint = `${API_BASE_URL}/mock/random_diagnose`;

    let res: Response;
    try {
        res = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...authHeaders(),
            },
            body: JSON.stringify(parsed.data),
            signal: controller.signal,
        });
    } catch {
        clearTimeout(timer);
        console.warn('[api] Diagnose network/timeout error → fallback');
        const fixture = getFallbackFixture(parsed.data.symptoms);
        return { ...fixture, mode: 'fallback' };
    } finally {
        clearTimeout(timer);
    }

    // ── Non-2xx → fallback ────────────────────────────────────────────────
    if (!res.ok) {
        console.warn(`[api] Diagnose returned ${res.status} → fallback`);
        const fixture = getFallbackFixture(parsed.data.symptoms);
        return { ...fixture, mode: 'fallback' };
    }

    // ── Parse response; invalid schema → fallback ─────────────────────────
    let raw: unknown;
    try {
        raw = await res.json();
    } catch {
        const fixture = getFallbackFixture(parsed.data.symptoms);
        return { ...fixture, mode: 'fallback' };
    }

    try {
        return parseDiagnoseResponse(raw);
    } catch {
        const fixture = getFallbackFixture(parsed.data.symptoms);
        return { ...fixture, mode: 'fallback' };
    }
}

// ── Response parser ────────────────────────────────────────────────────────

export function parseDiagnoseResponse(raw: unknown): DiagnoseResponse {
    const result = DiagnoseResponse.passthrough().safeParse(raw);

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
