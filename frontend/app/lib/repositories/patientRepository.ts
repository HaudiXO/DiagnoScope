import { z } from 'zod';

import { apiGet, apiPost } from '../apiClient';
import {
  PatientSchema,
  PatientListSchema,
  type Patient,
  type PatientList,
  type RepoResult,
} from '../models/schemas';
import type { CreatePatientInput, PatientRepository } from './contracts';

const CreatePatientApiResponseSchema = z.object({
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

export const patientRepository: PatientRepository = {
  async listPatients(): Promise<RepoResult<PatientList>> {
    const raw = await apiGet<unknown>('/doctor/patients/');
    const parsed = PatientListSchema.safeParse(raw);

    if (!parsed.success) {
      throw new Error(`Invalid patients payload: ${parsed.error.issues[0]?.message ?? 'unknown error'}`);
    }

    return { data: parsed.data, source: 'backend' };
  },

  async getPatient(patientId: string): Promise<RepoResult<Patient | null>> {
    const raw = await apiGet<unknown>(`/doctor/patients/${encodeURIComponent(patientId)}`);
    const parsed = PatientSchema.safeParse(raw);

    if (!parsed.success) {
      throw new Error(`Invalid patient payload: ${parsed.error.issues[0]?.message ?? 'unknown error'}`);
    }

    return { data: parsed.data, source: 'backend' };
  },

  async createPatient(input: CreatePatientInput): Promise<RepoResult<Patient>> {
    const [firstName, ...rest] = input.name.trim().split(' ');
    const lastName = rest.join(' ') || '-';

    const raw = await apiPost<unknown>('/doctor/patients/', {
      first_name: firstName,
      last_name: lastName,
    });

    const parsedRaw = CreatePatientApiResponseSchema.safeParse(raw);
    if (!parsedRaw.success) {
      throw new Error(`Invalid create patient payload: ${parsedRaw.error.issues[0]?.message ?? 'unknown error'}`);
    }

    const parsedPatient = PatientSchema.safeParse(parsedRaw.data);
    if (!parsedPatient.success) {
      throw new Error(`Invalid patient payload: ${parsedPatient.error.issues[0]?.message ?? 'unknown error'}`);
    }

    return { data: parsedPatient.data, source: 'backend' };
  },

  async resetDemoData(): Promise<RepoResult<void>> {
    return { data: undefined, source: 'local', reason: 'Demo mode is disabled' };
  },
};
