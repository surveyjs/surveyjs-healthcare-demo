export type UserRole = 'doctor' | 'patient';

/** Public user shape returned by the auth API and stored in the client session. */
export interface AuthUser {
  id: string;
  username: string;
  fullName: string;
  role: UserRole;
  /** Links a patient account to its patient record. */
  patientId?: string;
}

/** Seed shape for pre-provisioned demo accounts (demo passwords are intentionally public). */
export interface DemoUser extends AuthUser {
  password: string;
}

/** Roster entry exposed by GET /api/auth/roster for the quick sign-in dropdown. */
export interface RosterEntry {
  username: string;
  fullName: string;
  role: UserRole;
  label: string;
}
