import { Patient, Visit, Prescription } from '../types/patient';
import { calculateAge } from '../utils/age';

export function mapSurveyToNewPatient(surveyData: Record<string, any>): Patient {
  const dob = surveyData.date_of_birth || '';
  const age = calculateAge(dob);

  return {
    id: `p-${Date.now()}`,
    firstName: surveyData.first_name || '',
    lastName: surveyData.last_name || '',
    dateOfBirth: dob,
    age: age || 39,
    gender: surveyData.gender || 'female',
    phoneNumber: surveyData.phone_number || '',
    nhsNumber: surveyData['nhs-number'] || '',
    email: surveyData.email || '',
    // Static SurveyJS panels are layout-only: child values live flat in survey.data
    address: {
      addressLine1: surveyData['address-line-1'] || '',
      addressLine2: surveyData['address-line-2'] || '',
      townCity: surveyData['town-city'] || '',
      county: surveyData.county || '',
      postcode: surveyData.postcode || '',
      country: surveyData.country || 'United Kingdom',
    },
    emergencyContact: {
      fullName: surveyData.emergency_contact_full_name || '',
      phoneNumber: surveyData.emergency_contact_phone_number || '',
      relationship: surveyData.emergency_contact_relationship || '',
    },
    insuranceProvider: surveyData.insurance_provider || '',
    knownAllergies: surveyData.known_allergies || '',
    registeredDate: new Date().toLocaleDateString('en-GB'),
    status: 'Active',
    visits: [],
    prescriptions: [],
  };
}

export function mergeSurveyIntoPatient(existing: Patient, surveyData: Record<string, any>): Patient {
  const dob = surveyData.date_of_birth ?? existing.dateOfBirth;

  return {
    ...existing,
    firstName: surveyData.first_name ?? existing.firstName,
    lastName: surveyData.last_name ?? existing.lastName,
    dateOfBirth: dob,
    age: calculateAge(dob),
    gender: surveyData.gender ?? existing.gender,
    phoneNumber: surveyData.phone_number ?? existing.phoneNumber,
    nhsNumber: surveyData['nhs-number'] ?? existing.nhsNumber,
    email: surveyData.email ?? existing.email,
    // Static SurveyJS panels are layout-only: child values live flat in survey.data
    address: {
      ...existing.address,
      addressLine1: surveyData['address-line-1'] ?? existing.address.addressLine1,
      addressLine2: surveyData['address-line-2'] ?? existing.address.addressLine2,
      townCity: surveyData['town-city'] ?? existing.address.townCity,
      county: surveyData.county ?? existing.address.county,
      postcode: surveyData.postcode ?? existing.address.postcode,
      country: surveyData.country ?? existing.address.country,
    },
    emergencyContact: {
      ...existing.emergencyContact,
      fullName: surveyData.emergency_contact_full_name ?? existing.emergencyContact.fullName,
      phoneNumber: surveyData.emergency_contact_phone_number ?? existing.emergencyContact.phoneNumber,
      relationship: surveyData.emergency_contact_relationship ?? existing.emergencyContact.relationship,
    },
    insuranceProvider: surveyData.insurance_provider ?? existing.insuranceProvider,
    knownAllergies: surveyData.known_allergies ?? existing.knownAllergies,
  };
}

export function mapPatientToSurveyData(patient: Patient): Record<string, any> {
  return {
    first_name: patient.firstName,
    last_name: patient.lastName,
    date_of_birth: patient.dateOfBirth,
    gender: patient.gender,
    phone_number: patient.phoneNumber,
    'nhs-number': patient.nhsNumber,
    email: patient.email,
    // Static SurveyJS panels are layout-only: child values live flat in survey.data
    'address-line-1': patient.address?.addressLine1 || '',
    'address-line-2': patient.address?.addressLine2 || '',
    'town-city': patient.address?.townCity || '',
    county: patient.address?.county || '',
    postcode: patient.address?.postcode || '',
    country: patient.address?.country || 'United Kingdom',
    emergency_contact_full_name: patient.emergencyContact?.fullName || '',
    emergency_contact_phone_number: patient.emergencyContact?.phoneNumber || '',
    emergency_contact_relationship: patient.emergencyContact?.relationship || '',
    insurance_provider: patient.insuranceProvider || '',
    known_allergies: patient.knownAllergies || '',
  };
}

export function mapSurveyToVisit(visitData: Record<string, any>): Visit {
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

  return {
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
}

export function mapSurveyToPrescription(rxData: Record<string, any>): Prescription {
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

  return {
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
}
