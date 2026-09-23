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

  it('searches by last name (case-insensitive, partial)', () => {
    const results = db.listPatients({ lastName: 'thomp' });
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('p-emma-thompson');
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

  it('clears form schema overrides on reset', () => {
    db.saveFormSchema('patient-search', { title: 'x' });
    db.resetToInitial();
    expect(db.listFormSchemas()).toEqual({});
  });
});
