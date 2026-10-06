import { Patient, Prescription } from '../types/patient';

export interface MedicationTableRow {
  patientId: string;
  patientName: string;
  nhsNumber: string;
  medication: string;
  startDate: string;
  endDate: string;
  status: Prescription['status'];
  prescription: Prescription;
}

export interface MedicationFilters {
  patientName: string;
  nhsNumber: string;
  medication: string;
  status: 'All' | Prescription['status'];
}

export type MedicationSortKey = keyof Pick<
  MedicationTableRow,
  'patientName' | 'nhsNumber' | 'medication' | 'startDate' | 'endDate' | 'status'
>;

export function flattenMedicationRows(patients: Patient[]): MedicationTableRow[] {
  return patients.flatMap((patient) =>
    (patient.prescriptions ?? []).map((prescription) => ({
      patientId: patient.id,
      patientName: `${patient.firstName} ${patient.lastName}`,
      nhsNumber: patient.nhsNumber,
      medication: prescription.medication,
      startDate: prescription.startDate ?? '',
      endDate: prescription.endDate ?? 'Ongoing',
      status: prescription.status,
      prescription,
    })),
  );
}

export function filterMedicationRows(
  rows: MedicationTableRow[],
  filters: MedicationFilters,
): MedicationTableRow[] {
  const patientName = filters.patientName.trim().toLocaleLowerCase();
  const nhsNumber = filters.nhsNumber.trim().toLocaleLowerCase();
  const medication = filters.medication.trim().toLocaleLowerCase();

  return rows.filter((row) =>
    row.patientName.toLocaleLowerCase().includes(patientName) &&
    row.nhsNumber.toLocaleLowerCase().includes(nhsNumber) &&
    row.medication.toLocaleLowerCase().includes(medication) &&
    (filters.status === 'All' || row.status === filters.status),
  );
}

function dateValue(value: string): string {
  const isoDate = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoDate) return value;

  const dayFirstDate = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (dayFirstDate) return `${dayFirstDate[3]}-${dayFirstDate[2]}-${dayFirstDate[1]}`;

  return value;
}

export function sortMedicationRows(
  rows: MedicationTableRow[],
  key: MedicationSortKey,
  direction: 'ascending' | 'descending',
): MedicationTableRow[] {
  const multiplier = direction === 'ascending' ? 1 : -1;
  return [...rows].sort((left, right) => {
    const leftValue = left[key];
    const rightValue = right[key];
    const leftComparable = key === 'startDate' || key === 'endDate' ? dateValue(leftValue) : leftValue;
    const rightComparable = key === 'startDate' || key === 'endDate' ? dateValue(rightValue) : rightValue;

    return String(leftComparable).localeCompare(String(rightComparable), undefined, { sensitivity: 'base' }) * multiplier;
  });
}