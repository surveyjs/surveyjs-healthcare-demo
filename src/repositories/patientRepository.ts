import { Patient, Visit, Prescription } from '../types/patient';
import {
  mapSurveyToNewPatient,
  mergeSurveyIntoPatient,
  mapPatientToSurveyData,
  mapSurveyToVisit,
  mapSurveyToPrescription,
} from './surveyMapping';

const API_BASE = '/api';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `API request failed: ${res.status} ${path}`);
  }
  return res.json() as Promise<T>;
}

type PatientChangeListener = () => void;
const listeners: Set<PatientChangeListener> = new Set();

function notifyListeners() {
  listeners.forEach((fn) => fn());
}

export const patientRepository = {
  async getAllPatients(): Promise<Patient[]> {
    return request<Patient[]>('/patients');
  },

  async getPatientById(id: string): Promise<Patient | undefined> {
    try {
      return await request<Patient>(`/patients/${encodeURIComponent(id)}`);
    } catch {
      return undefined;
    }
  },

  async createPatientFromSurvey(surveyData: Record<string, any>): Promise<Patient> {
    const newPatient = mapSurveyToNewPatient(surveyData);
    const created = await request<Patient>('/patients', {
      method: 'POST',
      body: JSON.stringify(newPatient),
    });
    notifyListeners();
    return created;
  },

  async updatePatientFromSurvey(patientId: string, surveyData: Record<string, any>): Promise<Patient> {
    const existing = await this.getPatientById(patientId);
    if (!existing) {
      throw new Error(`Patient ${patientId} not found`);
    }
    const merged = mergeSurveyIntoPatient(existing, surveyData);
    const updated = await request<Patient>(`/patients/${encodeURIComponent(patientId)}`, {
      method: 'PUT',
      body: JSON.stringify(merged),
    });
    notifyListeners();
    return updated;
  },

  mapPatientToSurveyData(patient: Patient): Record<string, any> {
    return mapPatientToSurveyData(patient);
  },

  async addVisit(patientId: string, visitData: Record<string, any>): Promise<Visit> {
    const visit = mapSurveyToVisit(visitData);
    const result = await request<{ visit: Visit; patient: Patient }>(
      `/patients/${encodeURIComponent(patientId)}/visits`,
      { method: 'POST', body: JSON.stringify(visit) },
    );
    notifyListeners();
    return result.visit;
  },

  async removeVisit(patientId: string, visitId: string): Promise<void> {
    await request<{ status: string }>(
      `/patients/${encodeURIComponent(patientId)}/visits/${encodeURIComponent(visitId)}`,
      { method: 'DELETE' },
    );
    notifyListeners();
  },

  async addPrescription(patientId: string, rxData: Record<string, any>): Promise<Prescription> {
    const prescription = mapSurveyToPrescription(rxData);
    const result = await request<{ prescription: Prescription; patient: Patient }>(
      `/patients/${encodeURIComponent(patientId)}/prescriptions`,
      { method: 'POST', body: JSON.stringify(prescription) },
    );
    notifyListeners();
    return result.prescription;
  },

  async searchPatients(query: { lastName?: string; dateOfBirth?: string; nhsNumber?: string }): Promise<Patient[]> {
    const params = new URLSearchParams();
    if (query.lastName?.trim()) params.set('lastName', query.lastName.trim());
    if (query.dateOfBirth?.trim()) params.set('dateOfBirth', query.dateOfBirth.trim());
    if (query.nhsNumber?.trim()) params.set('nhsNumber', query.nhsNumber.trim());
    const qs = params.toString();
    return request<Patient[]>(`/patients${qs ? `?${qs}` : ''}`);
  },

  async resetToInitial(): Promise<void> {
    await request<{ status: string }>('/admin/reset', { method: 'POST' });
    notifyListeners();
  },

  subscribe(listener: PatientChangeListener): () => void {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};

