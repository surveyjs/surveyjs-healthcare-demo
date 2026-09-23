import patientRegistrationSchema from '../survey/schemas/patient-registration.json';
import patientSearchSchema from '../survey/schemas/patient-search.json';
import editPatientSchema from '../survey/schemas/edit-patient.json';
import addNewVisitSchema from '../survey/schemas/add-new-visit.json';
import addNewPrescriptionSchema from '../survey/schemas/add-new-prescription.json';
import patientVisitsSchema from '../survey/schemas/patient-visits.json';
import prescribedMedicationSchema from '../survey/schemas/prescribed-medication.json';
import { FormId, FormMetadata } from '../types/forms';

const DEFAULT_SCHEMAS: Record<FormId, object> = {
  'patient-registration': patientRegistrationSchema,
  'patient-search': patientSearchSchema,
  'edit-patient': editPatientSchema,
  'add-new-visit': addNewVisitSchema,
  'add-new-prescription': addNewPrescriptionSchema,
  'patient-visits': patientVisitsSchema,
  'prescribed-medication': prescribedMedicationSchema,
};

export const FORM_METADATA_LIST: FormMetadata[] = [
  {
    id: 'patient-registration',
    title: 'Patient Registration Form',
    description: 'Initial registration form for new patients capturing demographics, address, and emergency contact.',
    defaultSchema: patientRegistrationSchema,
  },
  {
    id: 'patient-search',
    title: 'Search for a Patient Form',
    description: 'Search filter form for querying patients by surname, birth date, or NHS number.',
    defaultSchema: patientSearchSchema,
  },
  {
    id: 'edit-patient',
    title: 'Edit Patient Form',
    description: 'Modal and profile form for updating existing patient clinical and personal details.',
    defaultSchema: editPatientSchema,
  },
  {
    id: 'add-new-visit',
    title: 'Add New Visit Form',
    description: 'Encounter documentation form for practitioner notes, diagnosis, and treatment.',
    defaultSchema: addNewVisitSchema,
  },
  {
    id: 'add-new-prescription',
    title: 'Add New Prescription Form',
    description: 'Clinical prescription intake for medication, dosage, frequency, and instructions.',
    defaultSchema: addNewPrescriptionSchema,
  },
  {
    id: 'patient-visits',
    title: 'Visits History Form',
    description: 'Dynamic panel schema for managing historical patient visits.',
    defaultSchema: patientVisitsSchema,
  },
  {
    id: 'prescribed-medication',
    title: 'Prescribed Medication History Form',
    description: 'Dynamic panel schema for managing patient medication courses.',
    defaultSchema: prescribedMedicationSchema,
  },
];

type SchemaChangeListener = (formId: FormId, newSchema: object) => void;
const listeners: Set<SchemaChangeListener> = new Set();

// Customized schemas loaded from the database; defaults come from the bundled JSON files
let overrides: Record<string, object> = {};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `API request failed: ${res.status} ${path}`);
  }
  return res.json() as Promise<T>;
}

export const formRepository = {
  /** Loads customized form schemas from the database into the in-memory cache. Call once at startup. */
  async init(): Promise<void> {
    try {
      overrides = await request<Record<string, object>>('/forms');
    } catch (e) {
      console.error('Failed to load form schemas from the database:', e);
      overrides = {};
    }
  },

  getForm(formId: FormId): object {
    return overrides[formId] || DEFAULT_SCHEMAS[formId] || {};
  },

  async saveForm(formId: FormId, schema: object): Promise<void> {
    await request(`/forms/${encodeURIComponent(formId)}`, {
      method: 'PUT',
      body: JSON.stringify(schema),
    });
    overrides[formId] = schema;
    listeners.forEach((listener) => listener(formId, schema));
  },

  async resetForm(formId: FormId): Promise<object> {
    try {
      await request(`/forms/${encodeURIComponent(formId)}`, { method: 'DELETE' });
    } catch (e) {
      console.warn(`Failed to reset schema for ${formId}:`, e);
    }
    delete overrides[formId];
    const defaultSchema = DEFAULT_SCHEMAS[formId] || {};
    listeners.forEach((listener) => listener(formId, defaultSchema));
    return defaultSchema;
  },

  getMetadata(formId: FormId): FormMetadata | undefined {
    return FORM_METADATA_LIST.find((m) => m.id === formId);
  },

  subscribe(listener: SchemaChangeListener): () => void {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};
