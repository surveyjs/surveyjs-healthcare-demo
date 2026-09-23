import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { createHash, timingSafeEqual } from 'node:crypto';
import { Patient, Visit, Prescription } from '../src/types/patient';
import { AuthUser, RosterEntry, UserRole } from '../src/types/auth';
import { INITIAL_PATIENTS, INITIAL_USERS } from '../src/data/initialData';
import { calculateAge } from '../src/utils/age';

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS patients (
  id                       TEXT PRIMARY KEY,
  first_name               TEXT NOT NULL,
  last_name                TEXT NOT NULL,
  date_of_birth            TEXT NOT NULL,
  gender                   TEXT NOT NULL DEFAULT '',
  phone_number             TEXT NOT NULL DEFAULT '',
  nhs_number               TEXT NOT NULL DEFAULT '',
  email                    TEXT NOT NULL DEFAULT '',
  address_line1            TEXT NOT NULL DEFAULT '',
  address_line2            TEXT NOT NULL DEFAULT '',
  town_city                TEXT NOT NULL DEFAULT '',
  county                   TEXT NOT NULL DEFAULT '',
  postcode                 TEXT NOT NULL DEFAULT '',
  country                  TEXT NOT NULL DEFAULT '',
  emergency_full_name      TEXT NOT NULL DEFAULT '',
  emergency_phone_number   TEXT NOT NULL DEFAULT '',
  emergency_relationship   TEXT NOT NULL DEFAULT '',
  insurance_provider       TEXT NOT NULL DEFAULT '',
  known_allergies          TEXT NOT NULL DEFAULT '',
  registered_date          TEXT NOT NULL DEFAULT '',
  status                   TEXT NOT NULL DEFAULT 'Active',
  seq                      INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS visits (
  id                        TEXT PRIMARY KEY,
  patient_id                TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  visit_date                TEXT NOT NULL DEFAULT '',
  visit_time                TEXT NOT NULL DEFAULT '',
  visit_type                TEXT NOT NULL DEFAULT '',
  practitioner              TEXT NOT NULL DEFAULT '',
  reason_for_visit          TEXT NOT NULL DEFAULT '',
  diagnosis                 TEXT NOT NULL DEFAULT '',
  treatment_recommendations TEXT NOT NULL DEFAULT '',
  follow_up_date            TEXT NOT NULL DEFAULT '',
  symptoms_notes            TEXT NOT NULL DEFAULT '',
  internal_notes            TEXT NOT NULL DEFAULT '',
  seq                       INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_visits_patient ON visits(patient_id, seq DESC);

CREATE TABLE IF NOT EXISTS prescriptions (
  id           TEXT PRIMARY KEY,
  patient_id   TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  medication   TEXT NOT NULL,
  frequency    TEXT NOT NULL DEFAULT '',
  dosage       TEXT NOT NULL DEFAULT '',
  unit         TEXT NOT NULL DEFAULT '',
  start_date   TEXT NOT NULL DEFAULT '',
  end_date     TEXT NOT NULL DEFAULT '',
  instructions TEXT NOT NULL DEFAULT '',
  status       TEXT NOT NULL DEFAULT 'Active',
  seq          INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_prescriptions_patient ON prescriptions(patient_id, seq DESC);

CREATE TABLE IF NOT EXISTS form_schemas (
  id         TEXT PRIMARY KEY,
  json       TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY,
  username      TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  full_name     TEXT NOT NULL,
  role          TEXT NOT NULL,
  patient_id    TEXT,
  seq           INTEGER NOT NULL DEFAULT 0
);
`;

function hashPassword(password: string): string {
  return createHash('sha256').update(password).digest('hex');
}

export interface PatientSearchQuery {
  lastName?: string;
  dateOfBirth?: string;
  nhsNumber?: string;
}

export type HealthcareDb = ReturnType<typeof createDb>;

export function createDb(dbPath: string) {
  if (dbPath !== ':memory:') {
    fs.mkdirSync(path.dirname(path.resolve(dbPath)), { recursive: true });
  }

  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.exec(SCHEMA_SQL);

  const insertPatientStmt = db.prepare(`
    INSERT INTO patients (
      id, first_name, last_name, date_of_birth, gender, phone_number, nhs_number, email,
      address_line1, address_line2, town_city, county, postcode, country,
      emergency_full_name, emergency_phone_number, emergency_relationship,
      insurance_provider, known_allergies, registered_date, status, seq
    ) VALUES (
      @id, @firstName, @lastName, @dateOfBirth, @gender, @phoneNumber, @nhsNumber, @email,
      @addressLine1, @addressLine2, @townCity, @county, @postcode, @country,
      @emergencyFullName, @emergencyPhoneNumber, @emergencyRelationship,
      @insuranceProvider, @knownAllergies, @registeredDate, @status, @seq
    )
  `);

  const updatePatientStmt = db.prepare(`
    UPDATE patients SET
      first_name = @firstName, last_name = @lastName, date_of_birth = @dateOfBirth,
      gender = @gender, phone_number = @phoneNumber, nhs_number = @nhsNumber, email = @email,
      address_line1 = @addressLine1, address_line2 = @addressLine2, town_city = @townCity,
      county = @county, postcode = @postcode, country = @country,
      emergency_full_name = @emergencyFullName, emergency_phone_number = @emergencyPhoneNumber,
      emergency_relationship = @emergencyRelationship,
      insurance_provider = @insuranceProvider, known_allergies = @knownAllergies,
      registered_date = @registeredDate, status = @status
    WHERE id = @id
  `);

  const insertVisitStmt = db.prepare(`
    INSERT INTO visits (
      id, patient_id, visit_date, visit_time, visit_type, practitioner, reason_for_visit,
      diagnosis, treatment_recommendations, follow_up_date, symptoms_notes, internal_notes, seq
    ) VALUES (
      @id, @patientId, @visitDate, @visitTime, @visitType, @practitioner, @reasonForVisit,
      @diagnosis, @treatmentRecommendations, @followUpDate, @symptomsNotes, @internalNotes, @seq
    )
  `);

  const insertPrescriptionStmt = db.prepare(`
    INSERT INTO prescriptions (
      id, patient_id, medication, frequency, dosage, unit, start_date, end_date, instructions, status, seq
    ) VALUES (
      @id, @patientId, @medication, @frequency, @dosage, @unit, @startDate, @endDate, @instructions, @status, @seq
    )
  `);

  function patientToParams(p: Patient, seq: number) {
    return {
      id: p.id,
      firstName: p.firstName,
      lastName: p.lastName,
      dateOfBirth: p.dateOfBirth,
      gender: p.gender || '',
      phoneNumber: p.phoneNumber || '',
      nhsNumber: p.nhsNumber || '',
      email: p.email || '',
      addressLine1: p.address?.addressLine1 || '',
      addressLine2: p.address?.addressLine2 || '',
      townCity: p.address?.townCity || '',
      county: p.address?.county || '',
      postcode: p.address?.postcode || '',
      country: p.address?.country || '',
      emergencyFullName: p.emergencyContact?.fullName || '',
      emergencyPhoneNumber: p.emergencyContact?.phoneNumber || '',
      emergencyRelationship: p.emergencyContact?.relationship || '',
      insuranceProvider: p.insuranceProvider || '',
      knownAllergies: p.knownAllergies || '',
      registeredDate: p.registeredDate || '',
      status: p.status || 'Active',
      seq,
    };
  }

  function visitToParams(patientId: string, v: Visit, seq: number) {
    return {
      id: v.id,
      patientId,
      visitDate: v.visitDate || '',
      visitTime: v.visitTime || '',
      visitType: v.visitType || '',
      practitioner: v.practitioner || '',
      reasonForVisit: v.reasonForVisit || '',
      diagnosis: v.diagnosis || '',
      treatmentRecommendations: v.treatmentRecommendations || '',
      followUpDate: v.followUpDate || '',
      symptomsNotes: v.symptomsNotes || '',
      internalNotes: v.internalNotes || '',
      seq,
    };
  }

  function prescriptionToParams(patientId: string, rx: Prescription, seq: number) {
    return {
      id: rx.id,
      patientId,
      medication: rx.medication,
      frequency: rx.frequency || '',
      dosage: String(rx.dosage ?? ''),
      unit: rx.unit || '',
      startDate: rx.startDate || '',
      endDate: rx.endDate || '',
      instructions: rx.instructions || '',
      status: rx.status || 'Active',
      seq,
    };
  }

  function rowToVisit(row: any): Visit {
    return {
      id: row.id,
      visitDate: row.visit_date,
      visitTime: row.visit_time,
      visitType: row.visit_type,
      practitioner: row.practitioner,
      reasonForVisit: row.reason_for_visit,
      diagnosis: row.diagnosis,
      treatmentRecommendations: row.treatment_recommendations,
      followUpDate: row.follow_up_date,
      symptomsNotes: row.symptoms_notes,
      internalNotes: row.internal_notes,
    };
  }

  function rowToPrescription(row: any): Prescription {
    return {
      id: row.id,
      medication: row.medication,
      frequency: row.frequency,
      dosage: row.dosage,
      unit: row.unit,
      startDate: row.start_date,
      endDate: row.end_date,
      instructions: row.instructions,
      status: row.status,
    };
  }

  const visitsByPatientStmt = db.prepare('SELECT * FROM visits WHERE patient_id = ? ORDER BY seq DESC');
  const prescriptionsByPatientStmt = db.prepare(
    'SELECT * FROM prescriptions WHERE patient_id = ? ORDER BY seq DESC',
  );

  function rowToPatient(row: any): Patient {
    return {
      id: row.id,
      firstName: row.first_name,
      lastName: row.last_name,
      dateOfBirth: row.date_of_birth,
      age: calculateAge(row.date_of_birth),
      gender: row.gender,
      phoneNumber: row.phone_number,
      nhsNumber: row.nhs_number,
      email: row.email,
      address: {
        addressLine1: row.address_line1,
        addressLine2: row.address_line2,
        townCity: row.town_city,
        county: row.county,
        postcode: row.postcode,
        country: row.country,
      },
      emergencyContact: {
        fullName: row.emergency_full_name,
        phoneNumber: row.emergency_phone_number,
        relationship: row.emergency_relationship,
      },
      insuranceProvider: row.insurance_provider,
      knownAllergies: row.known_allergies,
      registeredDate: row.registered_date,
      status: row.status,
      visits: visitsByPatientStmt.all(row.id).map(rowToVisit),
      prescriptions: prescriptionsByPatientStmt.all(row.id).map(rowToPrescription),
    };
  }

  function nextSeq(table: 'patients' | 'visits' | 'prescriptions', patientId?: string): number {
    if (table === 'patients') {
      const r = db.prepare('SELECT COALESCE(MAX(seq), 0) + 1 AS s FROM patients').get() as { s: number };
      return r.s;
    }
    const r = db
      .prepare(`SELECT COALESCE(MAX(seq), 0) + 1 AS s FROM ${table} WHERE patient_id = ?`)
      .get(patientId) as { s: number };
    return r.s;
  }

  const insertFullPatient = db.transaction((patient: Patient, seq: number) => {
    insertPatientStmt.run(patientToParams(patient, seq));
    const visits = patient.visits || [];
    const prescriptions = patient.prescriptions || [];
    // Arrays are ordered newest-first in the app; store descending seq so ORDER BY seq DESC restores order
    visits.forEach((v, i) => insertVisitStmt.run(visitToParams(patient.id, v, visits.length - i)));
    prescriptions.forEach((rx, i) =>
      insertPrescriptionStmt.run(prescriptionToParams(patient.id, rx, prescriptions.length - i)),
    );
  });

  const seed = db.transaction(() => {
    const n = INITIAL_PATIENTS.length;
    INITIAL_PATIENTS.forEach((p, i) => insertFullPatient(p, n - i));
  });

  const insertUserStmt = db.prepare(`
    INSERT INTO users (id, username, password_hash, full_name, role, patient_id, seq)
    VALUES (@id, @username, @passwordHash, @fullName, @role, @patientId, @seq)
  `);

  const seedUsers = db.transaction(() => {
    INITIAL_USERS.forEach((u, i) =>
      insertUserStmt.run({
        id: u.id,
        username: u.username,
        passwordHash: hashPassword(u.password),
        fullName: u.fullName,
        role: u.role,
        patientId: u.patientId ?? null,
        seq: i + 1,
      }),
    );
  });

  const patientCount = db.prepare('SELECT COUNT(*) AS c FROM patients').get() as { c: number };
  if (patientCount.c === 0) {
    seed();
  }

  const userCount = db.prepare('SELECT COUNT(*) AS c FROM users').get() as { c: number };
  if (userCount.c === 0) {
    seedUsers();
  }

  function rowToAuthUser(row: any): AuthUser {
    const user: AuthUser = {
      id: row.id,
      username: row.username,
      fullName: row.full_name,
      role: row.role as UserRole,
    };
    if (row.patient_id) {
      user.patientId = row.patient_id;
    }
    return user;
  }

  return {
    listPatients(query?: PatientSearchQuery): Patient[] {
      const clauses: string[] = [];
      const params: string[] = [];

      const lastName = (query?.lastName || '').trim().toLowerCase();
      const nhs = (query?.nhsNumber || '').replace(/\s+/g, '').toLowerCase();
      const dob = (query?.dateOfBirth || '').trim().replace(/\//g, '-');

      if (lastName) {
        clauses.push("LOWER(last_name) LIKE '%' || ? || '%'");
        params.push(lastName);
      }
      if (nhs) {
        clauses.push("LOWER(REPLACE(nhs_number, ' ', '')) LIKE '%' || ? || '%'");
        params.push(nhs);
      }
      if (dob) {
        clauses.push("REPLACE(date_of_birth, '/', '-') LIKE '%' || ? || '%'");
        params.push(dob);
      }

      const where = clauses.length ? ` WHERE ${clauses.join(' AND ')}` : '';
      const rows = db.prepare(`SELECT * FROM patients${where} ORDER BY seq DESC`).all(...params);
      return rows.map(rowToPatient);
    },

    getPatient(id: string): Patient | undefined {
      const row = db.prepare('SELECT * FROM patients WHERE id = ?').get(id);
      return row ? rowToPatient(row) : undefined;
    },

    createPatient(patient: Patient): Patient {
      const withDefaults: Patient = {
        ...patient,
        id: patient.id || `p-${Date.now()}`,
        registeredDate: patient.registeredDate || new Date().toLocaleDateString('en-GB'),
        status: patient.status || 'Active',
        visits: patient.visits || [],
        prescriptions: patient.prescriptions || [],
      };
      insertFullPatient(withDefaults, nextSeq('patients'));
      return this.getPatient(withDefaults.id)!;
    },

    updatePatient(id: string, patient: Patient): Patient | undefined {
      const existing = db.prepare('SELECT id FROM patients WHERE id = ?').get(id);
      if (!existing) return undefined;
      updatePatientStmt.run(patientToParams({ ...patient, id }, 0));
      return this.getPatient(id);
    },

    addVisit(patientId: string, visit: Visit): Visit | undefined {
      if (!db.prepare('SELECT id FROM patients WHERE id = ?').get(patientId)) return undefined;
      const withId: Visit = { ...visit, id: visit.id || `v-${Date.now()}` };
      insertVisitStmt.run(visitToParams(patientId, withId, nextSeq('visits', patientId)));
      return withId;
    },

    addPrescription(patientId: string, rx: Prescription): Prescription | undefined {
      if (!db.prepare('SELECT id FROM patients WHERE id = ?').get(patientId)) return undefined;
      const withId: Prescription = { ...rx, id: rx.id || `rx-${Date.now()}` };
      insertPrescriptionStmt.run(prescriptionToParams(patientId, withId, nextSeq('prescriptions', patientId)));
      return withId;
    },

    resetToInitial(): void {
      const wipeAndSeed = db.transaction(() => {
        db.prepare('DELETE FROM prescriptions').run();
        db.prepare('DELETE FROM visits').run();
        db.prepare('DELETE FROM patients').run();
        db.prepare('DELETE FROM form_schemas').run();
        db.prepare('DELETE FROM users').run();
        seed();
        seedUsers();
      });
      wipeAndSeed();
    },

    listUserRoster(): RosterEntry[] {
      const rows = db
        .prepare('SELECT username, full_name, role FROM users ORDER BY seq ASC')
        .all() as { username: string; full_name: string; role: UserRole }[];
      return rows.map((row) => ({
        username: row.username,
        fullName: row.full_name,
        role: row.role,
        label: `${row.full_name} (${row.role === 'doctor' ? 'Doctor' : 'Patient'})`,
      }));
    },

    authenticateUser(username: string, password: string): AuthUser | undefined {
      const row = db.prepare('SELECT * FROM users WHERE username = ?').get(username.trim()) as
        | any
        | undefined;
      if (!row) return undefined;
      const expected = Buffer.from(row.password_hash, 'hex');
      const actual = Buffer.from(hashPassword(password), 'hex');
      if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
        return undefined;
      }
      return rowToAuthUser(row);
    },

    listFormSchemas(): Record<string, object> {
      const rows = db.prepare('SELECT id, json FROM form_schemas').all() as { id: string; json: string }[];
      const result: Record<string, object> = {};
      for (const row of rows) {
        result[row.id] = JSON.parse(row.json);
      }
      return result;
    },

    saveFormSchema(id: string, schema: object): void {
      db.prepare(
        `INSERT INTO form_schemas (id, json, updated_at) VALUES (?, ?, datetime('now'))
         ON CONFLICT(id) DO UPDATE SET json = excluded.json, updated_at = excluded.updated_at`,
      ).run(id, JSON.stringify(schema));
    },

    deleteFormSchema(id: string): void {
      db.prepare('DELETE FROM form_schemas WHERE id = ?').run(id);
    },

    close(): void {
      db.close();
    },
  };
}
