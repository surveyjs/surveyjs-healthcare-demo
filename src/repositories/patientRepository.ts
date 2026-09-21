import { INITIAL_PATIENTS } from '../data/initialData';
import { Patient, Visit, Prescription } from '../types/patient';

const STORAGE_KEY = 'surveyjs_patient_records';

function calculateAge(dobString: string): number {
  if (!dobString) return 0;
  // Support YYYY-MM-DD or DD/MM/YYYY
  let birthDate: Date;
  if (dobString.includes('/')) {
    const parts = dobString.split('/');
    if (parts.length === 3) {
      birthDate = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
    } else {
      birthDate = new Date(dobString);
    }
  } else {
    birthDate = new Date(dobString);
  }

  if (isNaN(birthDate.getTime())) return 0;

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return Math.max(0, age);
}

type PatientChangeListener = () => void;
const listeners: Set<PatientChangeListener> = new Set();

function notifyListeners() {
  listeners.forEach((fn) => fn());
}

export const patientRepository = {
  getAllPatients(): Patient[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Failed to load patients from localStorage:', e);
    }
    // Seed with INITIAL_PATIENTS on first run
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_PATIENTS));
    return INITIAL_PATIENTS;
  },

  getPatientById(id: string): Patient | undefined {
    const list = this.getAllPatients();
    return list.find((p) => p.id === id);
  },

  savePatient(patient: Patient): Patient {
    const list = this.getAllPatients();
    const index = list.findIndex((p) => p.id === patient.id);
    let updatedList: Patient[];

    if (index >= 0) {
      updatedList = [...list];
      updatedList[index] = { ...patient, age: calculateAge(patient.dateOfBirth) };
    } else {
      const newPatient = {
        ...patient,
        id: patient.id || `p-${Date.now()}`,
        age: calculateAge(patient.dateOfBirth),
        registeredDate: patient.registeredDate || new Date().toLocaleDateString('en-GB'),
        visits: patient.visits || [],
        prescriptions: patient.prescriptions || [],
      };
      updatedList = [newPatient, ...list];
    }

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedList));
    } catch (e) {
      console.error('Failed to save patient to localStorage:', e);
    }

    notifyListeners();
    return this.getPatientById(patient.id) || patient;
  },

  createPatientFromSurvey(surveyData: Record<string, any>): Patient {
    const dob = surveyData.date_of_birth || '';
    const age = calculateAge(dob);
    const addr = surveyData.addres || {};
    const ec = surveyData.emergency_contact || {};

    const newPatient: Patient = {
      id: `p-${Date.now()}`,
      firstName: surveyData.first_name || '',
      lastName: surveyData.last_name || '',
      dateOfBirth: dob,
      age: age || 39,
      gender: surveyData.gender || 'female',
      phoneNumber: surveyData.phone_number || '',
      nhsNumber: surveyData['nhs-number'] || '',
      email: surveyData.email || '',
      address: {
        addressLine1: addr['address-line-1'] || '',
        addressLine2: addr['address-line-2'] || '',
        townCity: addr['town-city'] || '',
        county: addr.county || '',
        postcode: addr.postcode || '',
        country: addr.country || 'United Kingdom',
      },
      emergencyContact: {
        fullName: ec.emergency_contact_full_name || '',
        phoneNumber: ec.emergency_contact_phone_number || '',
        relationship: ec.emergency_contact_relationship || '',
      },
      insuranceProvider: surveyData.insurance_provider || '',
      knownAllergies: surveyData.known_allergies || '',
      registeredDate: new Date().toLocaleDateString('en-GB'),
      status: 'Active',
      visits: [],
      prescriptions: [],
    };

    return this.savePatient(newPatient);
  },

  updatePatientFromSurvey(patientId: string, surveyData: Record<string, any>): Patient {
    const existing = this.getPatientById(patientId);
    if (!existing) {
      throw new Error(`Patient ${patientId} not found`);
    }

    const addr = surveyData.addres || {};
    const ec = surveyData.emergency_contact || {};
    const dob = surveyData.date_of_birth ?? existing.dateOfBirth;

    const updated: Patient = {
      ...existing,
      firstName: surveyData.first_name ?? existing.firstName,
      lastName: surveyData.last_name ?? existing.lastName,
      dateOfBirth: dob,
      age: calculateAge(dob),
      gender: surveyData.gender ?? existing.gender,
      phoneNumber: surveyData.phone_number ?? existing.phoneNumber,
      nhsNumber: surveyData['nhs-number'] ?? existing.nhsNumber,
      email: surveyData.email ?? existing.email,
      address: {
        ...existing.address,
        addressLine1: addr['address-line-1'] ?? existing.address.addressLine1,
        addressLine2: addr['address-line-2'] ?? existing.address.addressLine2,
        townCity: addr['town-city'] ?? existing.address.townCity,
        county: addr.county ?? existing.address.county,
        postcode: addr.postcode ?? existing.address.postcode,
        country: addr.country ?? existing.address.country,
      },
      emergencyContact: {
        ...existing.emergencyContact,
        fullName: ec.emergency_contact_full_name ?? existing.emergencyContact.fullName,
        phoneNumber: ec.emergency_contact_phone_number ?? existing.emergencyContact.phoneNumber,
        relationship: ec.emergency_contact_relationship ?? existing.emergencyContact.relationship,
      },
      insuranceProvider: surveyData.insurance_provider ?? existing.insuranceProvider,
      knownAllergies: surveyData.known_allergies ?? existing.knownAllergies,
    };

    return this.savePatient(updated);
  },

  mapPatientToSurveyData(patient: Patient): Record<string, any> {
    return {
      first_name: patient.firstName,
      last_name: patient.lastName,
      date_of_birth: patient.dateOfBirth,
      gender: patient.gender,
      phone_number: patient.phoneNumber,
      'nhs-number': patient.nhsNumber,
      email: patient.email,
      addres: {
        'address-line-1': patient.address?.addressLine1 || '',
        'address-line-2': patient.address?.addressLine2 || '',
        'town-city': patient.address?.townCity || '',
        county: patient.address?.county || '',
        postcode: patient.address?.postcode || '',
        country: patient.address?.country || 'United Kingdom',
      },
      emergency_contact: {
        emergency_contact_full_name: patient.emergencyContact?.fullName || '',
        emergency_contact_phone_number: patient.emergencyContact?.phoneNumber || '',
        emergency_contact_relationship: patient.emergencyContact?.relationship || '',
      },
      insurance_provider: patient.insuranceProvider || '',
      known_allergies: patient.knownAllergies || '',
    };
  },

  addVisit(patientId: string, visitData: Record<string, any>): Visit {
    const patient = this.getPatientById(patientId);
    if (!patient) {
      throw new Error(`Patient ${patientId} not found`);
    }

    const practitionerValue = visitData.practitioner || 'Dr. Sarah Miller';
    const practitionerMap: Record<string, string> = {
      dr_smith: 'Dr. Smith',
      dr_jones: 'Dr. Jones',
      dr_williams: 'Dr. Williams',
    };
    const practitionerDisplay = practitionerMap[practitionerValue] || practitionerValue;

    const visitTypeMap: Record<string, string> = {
      consultation: 'GP Consultation',
      follow_up: 'Follow-up',
      emergency: 'Emergency',
      routine: 'Routine',
    };
    const visitTypeDisplay = visitTypeMap[visitData.visit_type] || visitData.visit_type || 'GP Consultation';

    const newVisit: Visit = {
      id: `v-${Date.now()}`,
      visitDate: visitData.visit_date || new Date().toISOString().split('T')[0],
      visitTime: visitData.visit_time || '10:00',
      visitType: visitTypeDisplay,
      practitioner: practitionerDisplay,
      reasonForVisit: visitData.reason_for_visit || '',
      diagnosis: visitData.diagnosis || '',
      treatmentRecommendations: visitData.treatment_recommendations || '',
      followUpDate: visitData.follow_up_date || '',
      symptomsNotes: visitData.symptoms_notes || '',
      internalNotes: visitData.internal_notes || '',
    };

    const updatedPatient: Patient = {
      ...patient,
      visits: [newVisit, ...(patient.visits || [])],
    };

    this.savePatient(updatedPatient);
    return newVisit;
  },

  addPrescription(patientId: string, rxData: Record<string, any>): Prescription {
    const patient = this.getPatientById(patientId);
    if (!patient) {
      throw new Error(`Patient ${patientId} not found`);
    }

    const freqMap: Record<string, string> = {
      once_daily: 'Once daily',
      twice_daily: 'Twice daily',
      three_times_daily: 'Three times daily',
      four_times_daily: 'Four times daily',
      as_needed: 'As needed',
    };
    const freqDisplay = freqMap[rxData.frequency] || rxData.frequency || 'Once daily';

    const unit = rxData.unit || 'tablet(s)';
    const dosage = rxData.question1 ? `${rxData.question1} ${unit}` : rxData.dosage || '1 tablet';

    const newPrescription: Prescription = {
      id: `rx-${Date.now()}`,
      medication: rxData.medication || 'Medication',
      frequency: freqDisplay,
      dosage: dosage,
      unit: unit,
      startDate: rxData.start_date || new Date().toLocaleDateString('en-GB'),
      endDate: rxData.end_date || 'Ongoing',
      instructions: rxData.instructions || '',
      status: rxData.end_date && new Date(rxData.end_date) < new Date() ? 'Completed' : 'Active',
    };

    const updatedPatient: Patient = {
      ...patient,
      prescriptions: [newPrescription, ...(patient.prescriptions || [])],
    };

    this.savePatient(updatedPatient);
    return newPrescription;
  },

  searchPatients(query: { lastName?: string; dateOfBirth?: string; nhsNumber?: string }): Patient[] {
    const all = this.getAllPatients();
    const cleanLast = (query.lastName || '').trim().toLowerCase();
    const cleanNhs = (query.nhsNumber || '').replace(/\s+/g, '').toLowerCase();
    const cleanDob = (query.dateOfBirth || '').trim();

    if (!cleanLast && !cleanNhs && !cleanDob) {
      return all;
    }

    return all.filter((p) => {
      let matches = true;

      if (cleanLast) {
        matches = matches && p.lastName.toLowerCase().includes(cleanLast);
      }

      if (cleanNhs) {
        const pNhs = (p.nhsNumber || '').replace(/\s+/g, '').toLowerCase();
        matches = matches && pNhs.includes(cleanNhs);
      }

      if (cleanDob) {
        // match YYYY-MM-DD or DD/MM/YYYY
        const pDob = p.dateOfBirth || '';
        const normalizedQuery = cleanDob.replace(/\//g, '-');
        const normalizedPatient = pDob.replace(/\//g, '-');
        matches = matches && (
          normalizedPatient.includes(normalizedQuery) ||
          pDob.includes(cleanDob) ||
          (pDob === cleanDob)
        );
      }

      return matches;
    });
  },

  resetToInitial(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_PATIENTS));
    notifyListeners();
  },

  subscribe(listener: PatientChangeListener): () => void {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};
