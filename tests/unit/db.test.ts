import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createDb, HealthcareDb } from '../../server/db';
import { INITIAL_PATIENTS } from '../../src/data/initialData';

describe('healthcare SQLite db', () => {
  let db: HealthcareDb;

  beforeEach(() => {
    db = createDb(':memory:');
  });

  afterEach(() => {
    db.close();
  });

  it('seeds an empty database with the initial patients', () => {
    const patients = db.listPatients();
    expect(patients.map((p) => p.id)).toEqual(INITIAL_PATIENTS.map((p) => p.id));
  });

  it('preserves visit and prescription order (newest first)', () => {
    const emma = db.getPatient('p-emma-thompson')!;
    expect(emma.visits.map((v) => v.id)).toEqual(['v1', 'v2', 'v3']);
    expect(emma.prescriptions.map((rx) => rx.id)).toEqual(['rx1', 'rx2']);
  });

  it('round-trips full patient details', () => {
    const emma = db.getPatient('p-emma-thompson')!;
    expect(emma.firstName).toBe('Emma');
    expect(emma.address.addressLine1).toBe('12 Oakfield Road');
    expect(emma.emergencyContact.fullName).toBe('James Thompson');
    expect(emma.knownAllergies).toContain('Penicillin');
    expect(emma.age).toBeGreaterThan(0);
  });

  it('returns undefined for a missing patient', () => {
    expect(db.getPatient('nope')).toBeUndefined();
  });

  it('creates a new patient that appears first in the list', () => {
    const created = db.createPatient({
      id: '',
      firstName: 'Alice',
      lastName: 'Walker',
      dateOfBirth: '1990-01-01',
      gender: 'female',
      phoneNumber: '07000 000000',
      nhsNumber: '111 222 3333',
      email: 'alice@example.com',
      address: { addressLine1: '1 Test Lane', country: 'United Kingdom' },
      emergencyContact: { fullName: 'Bob Walker' },
      registeredDate: '',
      status: 'Active',
      visits: [],
      prescriptions: [],
    });

    expect(created.id).toBeTruthy();
    expect(created.registeredDate).toBeTruthy();
    const all = db.listPatients();
    expect(all[0].id).toBe(created.id);
    expect(all).toHaveLength(INITIAL_PATIENTS.length + 1);
  });

  it('updates patient fields without touching visits or prescriptions', () => {
    const emma = db.getPatient('p-emma-thompson')!;
    const updated = db.updatePatient('p-emma-thompson', {
      ...emma,
      phoneNumber: '07999 999999',
      address: { ...emma.address, townCity: 'London' },
    })!;

    expect(updated.phoneNumber).toBe('07999 999999');
    expect(updated.address.townCity).toBe('London');
    expect(updated.visits).toHaveLength(3);
    expect(updated.prescriptions).toHaveLength(2);
  });

  it('returns undefined when updating a missing patient', () => {
    const emma = db.getPatient('p-emma-thompson')!;
    expect(db.updatePatient('nope', emma)).toBeUndefined();
  });

  it('adds a visit as the newest entry', () => {
    const visit = db.addVisit('p-emma-thompson', {
      id: '',
      visitDate: '2024-06-01',
      visitTime: '12:00',
      visitType: 'Follow-up',
      practitioner: 'Dr. Smith',
      reasonForVisit: 'Check-up',
      diagnosis: 'Healthy',
      treatmentRecommendations: 'None',
    })!;

    expect(visit.id).toBeTruthy();
    const emma = db.getPatient('p-emma-thompson')!;
    expect(emma.visits).toHaveLength(4);
    expect(emma.visits[0].id).toBe(visit.id);
  });

  it('updates a visit dated today without changing its id or order', () => {
    const date = new Date();
    const today = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const visit = db.addVisit('p-emma-thompson', {
      id: 'today-visit',
      visitDate: today,
      visitTime: '09:00',
      visitType: 'GP Consultation',
      practitioner: 'Dr. Smith',
      reasonForVisit: 'Initial reason',
    })!;

    const updated = db.updateVisit('p-emma-thompson', visit.id, {
      ...visit,
      reasonForVisit: 'Updated reason',
      diagnosis: 'Reviewed',
    });

    expect(updated?.id).toBe(visit.id);
    expect(db.getPatient('p-emma-thompson')!.visits[0]).toMatchObject({
      id: visit.id,
      reasonForVisit: 'Updated reason',
      diagnosis: 'Reviewed',
    });
  });

  it('does not update visits that are not dated today or do not exist', () => {
    const visit = db.getPatient('p-emma-thompson')!.visits[0];
    expect(db.updateVisit('p-emma-thompson', visit.id, { ...visit, diagnosis: 'Changed' })).toBeUndefined();
    expect(db.updateVisit('p-emma-thompson', 'missing', { ...visit, visitDate: '2024-06-01' })).toBeUndefined();

    const date = new Date();
    const today = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const todayVisit = db.addVisit('p-emma-thompson', { ...visit, id: 'mutable-date', visitDate: today })!;
    expect(db.updateVisit('p-emma-thompson', todayVisit.id, { ...todayVisit, visitDate: '2024-06-01' })).toBeUndefined();
    expect(db.getPatient('p-emma-thompson')!.visits[0].visitDate).toBe(today);
  });

  it('removes a visit and reports whether anything was deleted', () => {
    expect(db.removeVisit('p-emma-thompson', 'v2')).toBe(true);
    expect(db.getPatient('p-emma-thompson')!.visits.map((v) => v.id)).toEqual(['v1', 'v3']);

    expect(db.removeVisit('p-emma-thompson', 'v2')).toBe(false);
    expect(db.removeVisit('nope', 'v1')).toBe(false);
  });

  it('adds a prescription as the newest entry', () => {
    const rx = db.addPrescription('p-emma-thompson', {
      id: '',
      medication: 'Paracetamol 500mg',
      frequency: 'Twice daily',
      dosage: '1 tablet',
      unit: 'tablet(s)',
      startDate: '01/06/2024',
      endDate: 'Ongoing',
      instructions: 'With water.',
      status: 'Active',
    })!;

    expect(rx.id).toBeTruthy();
    const emma = db.getPatient('p-emma-thompson')!;
    expect(emma.prescriptions).toHaveLength(3);
    expect(emma.prescriptions[0].medication).toBe('Paracetamol 500mg');
  });

  it('updates active prescriptions but refuses completed or missing prescriptions', () => {
    const prescription = db.addPrescription('p-emma-thompson', {
      id: 'rx-editable',
      medication: 'Original medication',
      frequency: 'Once daily',
      dosage: '1 tablet',
      unit: 'tablets',
      startDate: '2026-10-06',
      endDate: 'Ongoing',
      instructions: '',
      status: 'Active',
    })!;

    const updated = db.updatePrescription('p-emma-thompson', prescription.id, {
      ...prescription,
      medication: 'Updated medication',
      instructions: 'Take with food.',
    });
    expect(updated).toMatchObject({ medication: 'Updated medication', instructions: 'Take with food.' });
    expect(db.getPatient('p-emma-thompson')!.prescriptions[0]).toMatchObject({
      id: prescription.id,
      medication: 'Updated medication',
    });

    expect(
      db.updatePrescription('p-emma-thompson', 'rx2', {
        ...prescription,
        id: 'rx2',
        medication: 'Must remain unchanged',
      }),
    ).toBeUndefined();
    expect(db.updatePrescription('p-emma-thompson', 'missing', prescription)).toBeUndefined();
    expect(db.updatePrescription('no-patient', prescription.id, prescription)).toBeUndefined();
  });

  it('searches by last name (case-insensitive, partial)', () => {
    const results = db.listPatients({ lastName: 'thomp' });
    expect(results).toHaveLength(3);
    expect(results.map((p) => p.id)).toEqual([
      'p-emma-thompson',
      'p-oliver-thompson',
      'p-grace-thompson',
    ]);
  });

  it('searches by NHS number ignoring whitespace', () => {
    const results = db.listPatients({ nhsNumber: '9451284567' });
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('p-emma-thompson');
  });

  it('searches by date of birth with either separator', () => {
    expect(db.listPatients({ dateOfBirth: '1985-03-14' })).toHaveLength(1);
    expect(db.listPatients({ dateOfBirth: '1985/03/14' })).toHaveLength(1);
  });

  it('combines search criteria with AND', () => {
    expect(db.listPatients({ lastName: 'Miller', dateOfBirth: '1985-03-14' })).toHaveLength(0);
    expect(db.listPatients({ lastName: 'Miller', dateOfBirth: '1978-07-22' })).toHaveLength(1);
  });

  it('resets to the initial seed data', () => {
    db.addVisit('p-emma-thompson', { id: '', visitDate: '2024-06-01', visitType: 'x', practitioner: 'y' });
    db.createPatient({
      id: 'p-tmp',
      firstName: 'Tmp',
      lastName: 'Tmp',
      dateOfBirth: '2000-01-01',
      gender: 'other',
      phoneNumber: '',
      nhsNumber: '',
      email: '',
      address: {},
      emergencyContact: {},
      registeredDate: '',
      status: 'Active',
      visits: [],
      prescriptions: [],
    });

    db.resetToInitial();

    const patients = db.listPatients();
    expect(patients).toHaveLength(INITIAL_PATIENTS.length);
    expect(db.getPatient('p-emma-thompson')!.visits).toHaveLength(3);
  });

  it('stores, lists, and deletes form schema overrides', () => {
    expect(db.listFormSchemas()).toEqual({});

    const schema = { title: 'Custom Search', pages: [] };
    db.saveFormSchema('patient-search', schema);
    expect(db.listFormSchemas()).toEqual({ 'patient-search': schema });

    const updated = { title: 'Custom Search v2', pages: [] };
    db.saveFormSchema('patient-search', updated);
    expect(db.listFormSchemas()['patient-search']).toEqual(updated);

    db.deleteFormSchema('patient-search');
    expect(db.listFormSchemas()).toEqual({});
  });

  it('stores appointment requests with patient details and lists newest first', () => {
    const first = db.createAppointmentRequest('p-emma-thompson', {
      preferred_date: '2026-10-12',
      reason_for_appointment: 'Annual review',
    })!;
    const second = db.createAppointmentRequest('p-david-miller', {
      preferred_date: '2026-10-13',
      reason_for_appointment: 'Medication review',
    })!;

    expect(first).toMatchObject({ patientId: 'p-emma-thompson', patientName: 'Emma Thompson' });
    expect(first.requestData.reason_for_appointment).toBe('Annual review');
    expect(second).toMatchObject({ patientId: 'p-david-miller', patientName: 'David Miller' });
    expect(db.listAppointmentRequests().map((request) => request.id)).toEqual([second.id, first.id]);
    expect(db.createAppointmentRequest('missing', {})).toBeUndefined();
  });

  it('clears appointment requests when demo data is reset', () => {
    db.createAppointmentRequest('p-emma-thompson', { reason_for_appointment: 'Review' });
    db.resetToInitial();
    expect(db.listAppointmentRequests()).toEqual([]);
  });

  it('clears form schema overrides on reset', () => {
    db.saveFormSchema('patient-search', { title: 'x' });
    db.resetToInitial();
    expect(db.listFormSchemas()).toEqual({});
  });
});
