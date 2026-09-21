import patientRegistrationSchema from '../survey/schemas/patient-registration.json';
import patientSearchSchema from '../survey/schemas/patient-search.json';
import editPatientSchema from '../survey/schemas/edit-patient.json';
import addNewVisitSchema from '../survey/schemas/add-new-visit.json';
import addNewPrescriptionSchema from '../survey/schemas/add-new-prescription.json';
import patientVisitsSchema from '../survey/schemas/patient-visits.json';
import prescribedMedicationSchema from '../survey/schemas/prescribed-medication.json';
import { FormId, FormMetadata } from '../types/forms';

const STORAGE_PREFIX = 'surveyjs_schema_';

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

export const formRepository = {
  getForm(formId: FormId): object {
    try {
      const stored = localStorage.getItem(STORAGE_PREFIX + formId);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn(`Failed to read stored form schema for ${formId}:`, e);
    }
    return DEFAULT_SCHEMAS[formId] || {};
  },

  saveForm(formId: FormId, schema: object): void {
    try {
      localStorage.setItem(STORAGE_PREFIX + formId, JSON.stringify(schema));
    } catch (e) {
      console.error(`Failed to persist schema for ${formId}:`, e);
    }
    listeners.forEach((listener) => listener(formId, schema));
  },

  resetForm(formId: FormId): object {
    try {
      localStorage.removeItem(STORAGE_PREFIX + formId);
    } catch (e) {
      console.warn(`Failed to reset schema for ${formId}:`, e);
    }
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
