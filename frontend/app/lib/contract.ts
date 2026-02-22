import { z } from 'zod';

// ── Request ────────────────────────────────────────────────────────────────

export const DiagnoseRequest = z.object({
    /** Patient symptoms text – the only required field. */
    symptoms: z.string().min(1, 'symptoms is required'),
    top_n: z.number().int().positive().optional(),
    language: z.string().optional(),
    trace_id: z.string().optional(),
});

export type DiagnoseRequest = z.infer<typeof DiagnoseRequest>;

// ── Response items ─────────────────────────────────────────────────────────

export const DiagnosisItem = z.object({
    rank: z.number().int(),
    diagnosis: z.string().optional(),
    icd10_code: z.string(),
    // present in initial spec
    description: z.string().optional(),
    confidence: z.number().optional(),
    reasoning: z.string().optional(),
    // graceful-degradation fields
    explanation: z.string().optional(),
    warnings: z.array(z.string()).optional(),
    protocol_refs: z.array(z.unknown()).optional(), // tolerates any element shape
    labels: z.array(z.string()).optional(),
});

export type DiagnosisItem = z.infer<typeof DiagnosisItem>;

// ── Response ───────────────────────────────────────────────────────────────

export const DiagnoseResponse = z.object({
    diagnoses: z.array(DiagnosisItem),
    trace_id: z.string().optional(),
});

export type DiagnoseResponse = z.infer<typeof DiagnoseResponse>;

// ── Error envelope (CONTRACT) ──────────────────────────────────────────────

export const ApiErrorResponse = z.object({
    error_code: z.string(),
    message: z.string(),
    details: z.unknown().optional(),
    trace_id: z.string().optional(),
});

export type ApiErrorResponse = z.infer<typeof ApiErrorResponse>;
