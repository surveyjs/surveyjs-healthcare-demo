import { describe, expect, it } from 'vitest';
import { Patient } from '../../src/types/patient';
import { filterMedicationRows, flattenMedicationRows, sortMedicationRows } from '../../src/utils/medicationTable';

const patients: Patient[] = [
  {
    id: 'p-zara',
    firstName: 'Zara',
    lastName: 'Jones',
    dateOfBirth: '1990-01-01',
    gender: 'female',
    phoneNumber: '',
    nhsNumber: '123 456 7890',
    email: '',
    address: {},
    emergencyContact: {},
    registeredDate: '',
    status: 'Active',
    visits: [],
    prescriptions: [
      { id: 'rx-z', medication: 'Aspirin', startDate: '02/01/2024', endDate: 'Ongoing', status: 'Active' },
    ],
  },
  {
    id: 'p-amy',
    firstName: 'Amy',
    lastName: 'Brown',
    dateOfBirth: '1990-01-01',
    gender: 'female',
    phoneNumber: '',
    nhsNumber: '987 654 3210',
    email: '',
    address: {},
    emergencyContact: {},
    registeredDate: '',
    status: 'Active',
    visits: [],
    prescriptions: [
      { id: 'rx-a', medication: 'Ibuprofen', startDate: '15/01/2024', endDate: '20/01/2024', status: 'Completed' },
    ],
  },
];

describe('medication table helpers', () => {
  it('flattens prescriptions while retaining patient identifiers and split dates', () => {
    expect(flattenMedicationRows(patients)).toMatchObject([
      { patientId: 'p-zara', patientName: 'Zara Jones', nhsNumber: '123 456 7890', medication: 'Aspirin', endDate: 'Ongoing' },
      { patientId: 'p-amy', patientName: 'Amy Brown', medication: 'Ibuprofen', startDate: '15/01/2024' },
    ]);
  });

  it('filters by patient, NHS number, medication, and status together', () => {
    const rows = flattenMedicationRows(patients);
    expect(filterMedicationRows(rows, { patientName: 'amy', nhsNumber: '987', medication: 'ibu', status: 'Completed' }))
      .toHaveLength(1);
    expect(filterMedicationRows(rows, { patientName: '', nhsNumber: '', medication: '', status: 'Active' }))
      .toMatchObject([{ medication: 'Aspirin' }]);
  });

  it('sorts without mutating source rows and compares day-first dates chronologically', () => {
    const rows = flattenMedicationRows(patients);
    expect(sortMedicationRows(rows, 'patientName', 'ascending').map((row) => row.patientName)).toEqual(['Amy Brown', 'Zara Jones']);
    expect(sortMedicationRows(rows, 'startDate', 'ascending').map((row) => row.medication)).toEqual(['Aspirin', 'Ibuprofen']);
    expect(rows[0].patientName).toBe('Zara Jones');
  });
});