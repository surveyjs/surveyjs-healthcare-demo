import { Patient } from '../types/patient';
import { calculateAge } from '../utils/age';

/** Normalizes ISO (yyyy-mm-dd) and UK (dd/mm/yyyy) dates to ISO; other values pass through. */
export function toIsoDate(value?: string): string {
  if (!value) return '';
  const uk = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  return uk ? `${uk[3]}-${uk[2]}-${uk[1]}` : value;
}

/** Displays a stored date as dd/mm/yyyy; non-date values such as "Ongoing" pass through. */
export function formatDate(value?: string): string {
  if (!value) return '—';
  const iso = toIsoDate(value);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return value;
  return new Date(iso + 'T12:00:00').toLocaleDateString('en-GB');
}

export function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export const fullName = (patient: Patient) => `${patient.firstName} ${patient.lastName}`.trim();

export const initials = (name: string) =>
  name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

export const patientAge = (patient: Patient) => calculateAge(patient.dateOfBirth);

export const dateOfBirthWithAge = (patient: Patient) => `${formatDate(patient.dateOfBirth)} (${patientAge(patient)})`;

export const patientAddress = (patient: Patient) =>
  [patient.address?.addressLine1, patient.address?.addressLine2, patient.address?.townCity, patient.address?.postcode]
    .filter(Boolean)
    .join(', ');

const compact = (value?: string) => String(value || '').replace(/\s/g, '');

export const formatPhone = (value?: string) => compact(value).replace(/^(\d{5})(\d{6})$/, '$1 $2');

export const patientContext = (patient: Patient) =>
  `Date of birth: ${formatDate(patient.dateOfBirth)} · NHS: ${patient.nhsNumber}`;

const normalizeName = (value?: string) =>
  String(value || '')
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();

export interface PatientQuery {
  name: string;
  dob: string;
  nhs: string;
}

/** Matches every name term against first + last name, an exact birth date, and a partial NHS number. */
export function filterPatients(patients: Patient[], query: PatientQuery): Patient[] {
  const terms = normalizeName(query.name).split(' ').filter(Boolean);
  return patients.filter((patient) => {
    const name = normalizeName(fullName(patient)).replace(/ /g, '');
    return (
      terms.every((term) => name.includes(term)) &&
      (!query.dob || toIsoDate(patient.dateOfBirth) === query.dob) &&
      compact(patient.nhsNumber).includes(compact(query.nhs))
    );
  });
}
