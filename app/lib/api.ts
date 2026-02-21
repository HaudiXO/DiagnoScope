import {
    ApiErrorResponse,
    DiagnoseRequest,
    DiagnoseResponse,
    DiagnosisItem,
} from './contract';
import { USE_MOCK, FixtureMode } from './demoMode';
import rawFixtures from './fixtures/diagnose_fixtures.json';

// ── Config ─────────────────────────────────────────────────────────────────

const BASE_URL =
    process.env.NEXT_PUBLIC_API_BASE?.replace(/\/$/, '') ?? '';

const TIMEOUT_MS = 12_000;

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

/**
 * Picks a fixture deterministically from symptoms text.
 * Strategy: first fixture whose `keywords` array contains a substring
 * match against the lower-cased symptoms. Falls back to fixture #0.
 * Guarantees a non-empty diagnoses array.
 */
function getFallbackFixture(symptoms: string): DiagnoseResponseWithMode {
    validateFixtures();

    const lower = symptoms.toLowerCase();
    const fixtures = rawFixtures as FixtureEntry[];

    const match =
        fixtures.find((f) =>
            f.keywords.some((kw) => lower.includes(kw))
        ) ?? fixtures[0];

    // Parse and validate – if it somehow fails, bubble up to caller.
    const parsed = parseDiagnoseResponse(match.response);

    // Safety guarantee: fallback must never return empty diagnoses.
    if (parsed.diagnoses.length === 0) {
        if (process.env.NODE_ENV === 'development') {
            console.error(
                '[demoMode] Selected fixture produced empty diagnoses array. ' +
                'Ensure fixtures always contain at least one valid DiagnosisItem.'
            );
        }
        // Hard-coded emergency item so the UI is never broken.
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

// ── Fetch wrapper ──────────────────────────────────────────────────────────

/**
 * POST /diagnose and return a validated, sorted DiagnoseResponseWithMode.
 *
 * Behaviour:
 *  - USE_MOCK=true  → return fixture immediately (mode="demo")
 *  - else           → call backend with 12 s AbortController timeout
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

    // ── Live fetch with 12 s timeout ─────────────────────────────────────
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
    } catch {
        // Timeout or network error → graceful fallback.
        clearTimeout(timer);
        const fixture = getFallbackFixture(parsed.data.symptoms);
        return { ...fixture, mode: 'fallback' };
    } finally {
        clearTimeout(timer);
    }

    // ── Non-2xx → fallback ────────────────────────────────────────────────
    if (!res.ok) {
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

/**
 * Accepts unknown input, filters invalid DiagnosisItems (missing rank or
 * icd10_code), and returns items sorted ascending by rank.
 * Never throws – invalid items are silently dropped.
 */
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
