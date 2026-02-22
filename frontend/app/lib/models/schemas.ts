import { z } from 'zod';

const ApiPatientSchema = z.object({
  id: z.string(),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
  score: z.number().optional(),
});

export const PatientSchema = ApiPatientSchema.transform((raw) => {
  const firstName = raw.firstName ?? raw.first_name ?? '';
  const lastName = raw.lastName ?? raw.last_name ?? '';
  const createdAt = raw.createdAt ?? raw.created_at ?? new Date(0).toISOString();
  const updatedAt = raw.updatedAt ?? raw.updated_at ?? createdAt;

  return {
    id: raw.id,
    name: `${firstName} ${lastName}`.trim() || raw.id,
    age: undefined as number | undefined,
    createdAt,
    updatedAt,
    score: raw.score,
  };
});

export const PatientListSchema = z.object({
  items: z.array(ApiPatientSchema),
  total: z.number(),
  limit: z.number(),
  offset: z.number(),
}).transform((raw) => ({
  items: raw.items.map((item) => PatientSchema.parse(item)),
  total: raw.total,
  limit: raw.limit,
  offset: raw.offset,
}));

export const DiagnosisSchema = z.object({
  rank: z.number().int(),
  diagnosis: z.string().optional(),
  icd10_code: z.string(),
  description: z.string().optional(),
  confidence: z.number().optional(),
  reasoning: z.string().optional(),
  explanation: z.string().optional(),
  warnings: z.array(z.string()).optional(),
  protocol_refs: z.array(z.unknown()).optional(),
  labels: z.array(z.string()).optional(),
});

export const DiagnosisResultSchema = z.object({
  diagnoses: z.array(DiagnosisSchema),
  trace_id: z.string().optional(),
  mode: z.enum(['demo', 'fallback', 'live']).optional(),
});

export const HistoryItemSchema = z.object({
  id: z.string(),
  patientId: z.string().optional(),
  createdAt: z.string(),
  symptoms: z.string(),
  parsedDiagnoses: z.array(DiagnosisSchema),
  rawResponse: DiagnosisResultSchema.nullable(),
  latencyMs: z.number(),
  traceId: z.string().optional(),
  mode: z.enum(['demo', 'fallback', 'live']).nullable(),
  error: z.string().optional(),
});

export const ChatMessageSchema = z.discriminatedUnion('role', [
  z.object({
    role: z.literal('doctor'),
    symptoms: z.string(),
    timestamp: z.string(),
  }),
  z.object({
    role: z.literal('assistant'),
    diagnoses: z.array(DiagnosisSchema),
    mode: z.enum(['demo', 'fallback', 'live']).nullable(),
    traceId: z.string().optional(),
    latencyMs: z.number().optional(),
    error: z.string().optional(),
    timestamp: z.string(),
    entryId: z.string().optional(),
  }),
]);

export type Patient = z.infer<typeof PatientSchema>;
export type PatientList = z.infer<typeof PatientListSchema>;
export type Diagnosis = z.infer<typeof DiagnosisSchema>;
export type DiagnosisResult = z.infer<typeof DiagnosisResultSchema>;
export type HistoryItem = z.infer<typeof HistoryItemSchema>;
export type ChatMessage = z.infer<typeof ChatMessageSchema>;

export interface RepoResult<T> {
  data: T;
  source: 'backend' | 'local';
  reason?: string;
}
