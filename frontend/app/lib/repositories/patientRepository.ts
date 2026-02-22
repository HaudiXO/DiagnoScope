import { z } from 'zod';

import { apiGet, apiPost } from '../apiClient';
import {
  addPatient as addLocalPatient,
  readPatients as readLocalPatients,
  resetDemoData as resetLocalDemoData,
} from '../patients';
import {
  PatientSchema,
  PatientListSchema,
  type Patient,
  type PatientList,
  type RepoResult,
} from '../models/schemas';
import type { CreatePatientInput, PatientRepository } from './contracts';
import { isFallbackError, isMockMode } from './helpers';

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

function localPatientsToList(patients: ReturnType<typeof readLocalPatients>): PatientList {
  const items: Patient[] = patients.map((p) => ({
    id: p.id,
    name: p.name,
    age: p.age,
    createdAt: p.createdAt,
    updatedAt: p.createdAt,
    score: undefined,
  }));

  return {
    items,
    total: items.length,
    limit: items.length,
    offset: 0,
  };
}

const backendPatientRepo: PatientRepository = {
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
    return { data: undefined, source: 'backend' };
  },
};

const mockPatientRepo: PatientRepository = {
  async listPatients(): Promise<RepoResult<PatientList>> {
    return {
      data: localPatientsToList(readLocalPatients()),
      source: 'mock',
      reason: 'USE_MOCK or backend unavailable',
    };
  },

  async getPatient(patientId: string): Promise<RepoResult<Patient | null>> {
    const patients = localPatientsToList(readLocalPatients()).items;
    return {
      data: patients.find((p) => p.id === patientId) ?? null,
      source: 'mock',
      reason: 'USE_MOCK or backend unavailable',
    };
  },

  async createPatient(input: CreatePatientInput): Promise<RepoResult<Patient>> {
    const local = addLocalPatient({ name: input.name, age: input.age });
    return {
      data: {
        id: local.id,
        name: local.name,
        age: local.age,
        createdAt: local.createdAt,
        updatedAt: local.createdAt,
      },
      source: 'mock',
      reason: 'USE_MOCK or backend unavailable',
    };
  },

  async resetDemoData(): Promise<RepoResult<void>> {
    resetLocalDemoData();
    return {
      data: undefined,
      source: 'mock',
      reason: 'Demo data reset in mock repository',
    };
  },
};

export const patientRepository: PatientRepository = {
  async listPatients() {
    if (isMockMode()) return mockPatientRepo.listPatients();
    try {
      return await backendPatientRepo.listPatients();
    } catch (err) {
      if (!isFallbackError(err)) throw err;
      return mockPatientRepo.listPatients();
    }
  },

  async getPatient(patientId: string) {
    if (isMockMode()) return mockPatientRepo.getPatient(patientId);
    try {
      return await backendPatientRepo.getPatient(patientId);
    } catch (err) {
      if (!isFallbackError(err)) throw err;
      return mockPatientRepo.getPatient(patientId);
    }
  },

  async createPatient(input: CreatePatientInput) {
    if (isMockMode()) return mockPatientRepo.createPatient(input);
    try {
      return await backendPatientRepo.createPatient(input);
    } catch (err) {
      if (!isFallbackError(err)) throw err;
      return mockPatientRepo.createPatient(input);
    }
  },

  async resetDemoData() {
    return mockPatientRepo.resetDemoData();
  },
};
