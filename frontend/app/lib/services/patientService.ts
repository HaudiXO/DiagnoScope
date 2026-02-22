import { apiGet, apiPost } from '../apiClient';
import { USE_MOCK } from '../demoMode';
import type { Patient } from '../patients';

/**
 * Backend Patient shape from schemas.py
 */
interface ApiPatient {
    id: string;
    first_name: string;
    last_name: string;
    created_at: string;
    updated_at: string;
}

interface PatientListResponse {
    items: ApiPatient[];
    total: number;
    limit: number;
    offset: number;
}

/**
 * Converts backend patient to frontend Patient shape.
 */
function adaptPatient(api: ApiPatient): Patient {
    return {
        id: api.id,
        name: `${api.first_name} ${api.last_name}`.trim(),
        age: undefined, // Backend doesn't provide age currently
        createdAt: api.created_at,
    };
}

/**
 * Fetches all patients for the current doctor.
 */
export async function getPatients(): Promise<Patient[]> {
    if (USE_MOCK) {
        // In mock mode, we let the page component handle localStorage/fixtures
        throw new Error('Mock mode enabled');
    }

    try {
        const data = await apiGet<PatientListResponse>('/doctor/patients/');
        return data.items.map(adaptPatient);
    } catch (err) {
        console.error('[patientService] getPatients failed:', err);
        throw err;
    }
}

/**
 * Creates a new patient in the backend.
 * Logic: Spilts name into first/last.
 */
export async function createPatient(data: { name: string; age?: number }): Promise<Patient> {
    const [firstName, ...rest] = data.name.trim().split(' ');
    const lastName = rest.join(' ') || '-';

    const payload = {
        first_name: firstName,
        last_name: lastName,
    };

    const result = await apiPost<ApiPatient>('/doctor/patients/', payload);
    return adaptPatient(result);
}
