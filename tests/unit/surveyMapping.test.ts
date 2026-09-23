import { describe, it, expect } from 'vitest';
import {
  mapSurveyToNewPatient,
  mergeSurveyIntoPatient,
  mapPatientToSurveyData,
  mapSurveyToVisit,
  mapSurveyToPrescription,
} from '../../src/repositories/surveyMapping';
import { Patient } from '../../src/types/patient';

const basePatient: Patient = {
  id: 'p-1',
  firstName: 'Emma',
  lastName: 'Thompson',
  dateOfBirth: '1985-03-14',
  gender: 'female',
  phoneNumber: '07700 900123',
  nhsNumber: '945 128 4567',
  email: 'emma@example.com',
  address: {
    addressLine1: '12 Oakfield Road',
    addressLine2: '',
    townCity: 'Bristol',
    county: 'City of Bristol',
    postcode: 'BS8 2PL',
    country: 'United Kingdom',
  },
  emergencyContact: {
    fullName: 'James Thompson',
    phoneNumber: '07870 112233',
    relationship: 'sibling',
  },
  insuranceProvider: 'none',
  knownAllergies: 'Penicillin',
  registeredDate: '12/05/2019',
  status: 'Active',
  visits: [],
  prescriptions: [],
};

describe('mapSurveyToNewPatient', () => {
  it('maps flat and nested survey fields to a patient', () => {
    const patient = mapSurveyToNewPatient({
      first_name: 'Alice',
      last_name: 'Walker',
      date_of_birth: '1990-01-15',
      gender: 'female',
      phone_number: '07000 000000',
      'nhs-number': '111 222 3333',
      email: 'alice@example.com',
      'address-line-1': '1 Test Lane',
      'town-city': 'Leeds',
      postcode: 'LS1 1AA',
      emergency_contact_full_name: 'Bob Walker',
      emergency_contact_relationship: 'spouse-partner',
      known_allergies: 'None',
    });

    expect(patient.firstName).toBe('Alice');
    expect(patient.nhsNumber).toBe('111 222 3333');
    expect(patient.address.addressLine1).toBe('1 Test Lane');
    expect(patient.address.country).toBe('United Kingdom');
    expect(patient.emergencyContact.fullName).toBe('Bob Walker');
    expect(patient.status).toBe('Active');
    expect(patient.visits).toEqual([]);
    expect(patient.id).toMatch(/^p-/);
  });
});

describe('mergeSurveyIntoPatient', () => {
  it('overrides provided fields and keeps the rest', () => {
    const merged = mergeSurveyIntoPatient(basePatient, {
      phone_number: '07999 999999',
      'town-city': 'Manchester',
    });

    expect(merged.phoneNumber).toBe('07999 999999');
    expect(merged.address.townCity).toBe('Manchester');
    // untouched fields preserved
    expect(merged.firstName).toBe('Emma');
    expect(merged.address.addressLine1).toBe('12 Oakfield Road');
    expect(merged.emergencyContact.fullName).toBe('James Thompson');
    expect(merged.registeredDate).toBe('12/05/2019');
  });
});

describe('mapPatientToSurveyData', () => {
  it('round-trips through mergeSurveyIntoPatient without data loss', () => {
    const surveyData = mapPatientToSurveyData(basePatient);
    expect(surveyData.first_name).toBe('Emma');
    expect(surveyData['nhs-number']).toBe('945 128 4567');
    expect(surveyData['address-line-1']).toBe('12 Oakfield Road');
    expect(surveyData.emergency_contact_full_name).toBe('James Thompson');

    const merged = mergeSurveyIntoPatient(basePatient, surveyData);
    expect({ ...merged, age: undefined }).toEqual({ ...basePatient, age: undefined });
  });
});

describe('mapSurveyToVisit', () => {
  it('maps dropdown values to display labels', () => {
    const visit = mapSurveyToVisit({
      visit_date: '2024-06-01',
      visit_time: '09:30',
      visit_type: 'follow_up',
      practitioner: 'dr_jones',
      reason_for_visit: 'BP check',
      diagnosis: 'Stable',
    });

    expect(visit.visitType).toBe('Follow-up');
    expect(visit.practitioner).toBe('Dr. Jones');
    expect(visit.visitDate).toBe('2024-06-01');
    expect(visit.reasonForVisit).toBe('BP check');
  });

  it('passes through free-text practitioner and type', () => {
    const visit = mapSurveyToVisit({ visit_type: 'Home Visit', practitioner: 'Dr. House' });
    expect(visit.visitType).toBe('Home Visit');
    expect(visit.practitioner).toBe('Dr. House');
  });
});

describe('mapSurveyToPrescription', () => {
  it('maps frequency, composes dosage from amount + unit', () => {
    const rx = mapSurveyToPrescription({
      medication: 'Paracetamol 500mg',
      frequency: 'twice_daily',
      question1: '2',
      unit: 'tablets',
      start_date: '2024-06-01',
    });

    expect(rx.frequency).toBe('Twice daily');
    expect(rx.dosage).toBe('2 tablets');
    expect(rx.endDate).toBe('Ongoing');
    expect(rx.status).toBe('Active');
  });

  it('marks prescriptions with a past end date as Completed', () => {
    const rx = mapSurveyToPrescription({
      medication: 'Ibuprofen',
      end_date: '2020-01-01',
    });
    expect(rx.status).toBe('Completed');
  });
});
