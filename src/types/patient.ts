export interface Address {
  addressLine1?: string;
  addressLine2?: string;
  townCity?: string;
  county?: string;
  postcode?: string;
  country?: string;
}

export interface EmergencyContact {
  fullName?: string;
  phoneNumber?: string;
  relationship?: string;
}

export interface Visit {
  id: string;
  visitDate: string; // e.g. "18/04/2024" or "2024-04-18"
  visitTime?: string; // e.g. "09:30"
  visitType: string; // e.g. "GP Consultation", "Follow-up", "Acute Illness"
  practitioner: string; // e.g. "Dr. Sarah Miller", "Nurse James Lee"
  reasonForVisit?: string;
  diagnosis?: string;
  treatmentRecommendations?: string;
  followUpDate?: string;
  symptomsNotes?: string;
  internalNotes?: string;
}

export interface Prescription {
  id: string;
  medication: string; // e.g. "Amlodipine 5mg Tablets"
  frequency?: string; // e.g. "Once daily", "Three times daily"
  dosage?: string | number; // e.g. "1 tablet", "1-2 tablets"
  unit?: string; // e.g. "tablet(s)"
  startDate?: string; // e.g. "15/01/2024"
  endDate?: string; // e.g. "Ongoing" or "10/10/2023"
  instructions?: string;
  status: 'Active' | 'Completed';
}

export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string; // "14/03/1985"
  age?: number;
  gender: string; // "Female" or "Male"
  phoneNumber: string; // "07700 900123"
  nhsNumber: string; // "945 128 4567"
  email: string; // "emma.thompson@email.com"
  address: Address;
  emergencyContact: EmergencyContact;
  insuranceProvider?: string;
  knownAllergies?: string; // "Penicillin (rash), Pollen (seasonal)"
  registeredDate: string; // "12/05/2019"
  status: 'Active' | 'Inactive';
  visits: Visit[];
  prescriptions: Prescription[];
}
