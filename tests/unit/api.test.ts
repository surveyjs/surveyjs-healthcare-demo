import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';
import { createDb, HealthcareDb } from '../../server/db';
import { createApp } from '../../server/app';
import { INITIAL_PATIENTS, INITIAL_USERS, DEMO_PASSWORD } from '../../src/data/initialData';

let db: HealthcareDb;
let server: Server;
let baseUrl: string;

async function api(path: string, init?: RequestInit) {
  const res = await fetch(`${baseUrl}/api${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
  return res;
}

beforeAll(async () => {
  db = createDb(':memory:');
  const app = createApp(db);
  server = app.listen(0);
  await new Promise<void>((resolve) => server.once('listening', () => resolve()));
  baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

afterAll(async () => {
  await new Promise<void>((resolve) => server.close(() => resolve()));
  db.close();
});

describe('patients API', () => {
  it('GET /api/health responds ok', async () => {
    const res = await api('/health');
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: 'ok' });
  });

  it('GET /api/patients returns the seeded patients', async () => {
    await api('/admin/reset', { method: 'POST' });
    const res = await api('/patients');
    expect(res.status).toBe(200);
    const patients = await res.json();
    expect(patients.map((p: any) => p.id)).toEqual(INITIAL_PATIENTS.map((p) => p.id));
  });

  it('GET /api/patients supports search filters', async () => {
    const res = await api('/patients?lastName=benn&nhsNumber=6714902814');
    const patients = await res.json();
    expect(patients).toHaveLength(1);
    expect(patients[0].id).toBe('p-sophie-bennett');
  });

  it('GET /api/patients/:id returns one patient and 404 for missing', async () => {
    const ok = await api('/patients/p-emma-thompson');
    expect(ok.status).toBe(200);
    expect((await ok.json()).firstName).toBe('Emma');

    const missing = await api('/patients/nope');
    expect(missing.status).toBe(404);
  });

  it('POST /api/patients validates and creates', async () => {
    const bad = await api('/patients', { method: 'POST', body: JSON.stringify({ firstName: 'X' }) });
    expect(bad.status).toBe(400);

    const good = await api('/patients', {
      method: 'POST',
      body: JSON.stringify({
        firstName: 'Test',
        lastName: 'Person',
        dateOfBirth: '1999-09-09',
        gender: 'other',
        address: {},
        emergencyContact: {},
        visits: [],
        prescriptions: [],
      }),
    });
    expect(good.status).toBe(201);
    const created = await good.json();
    expect(created.id).toBeTruthy();

    const list = await (await api('/patients')).json();
    expect(list[0].id).toBe(created.id);
  });

  it('PUT /api/patients/:id updates and 404s for missing', async () => {
    const emma = await (await api('/patients/p-emma-thompson')).json();
    const res = await api('/patients/p-emma-thompson', {
      method: 'PUT',
      body: JSON.stringify({ ...emma, email: 'new@email.com' }),
    });
    expect(res.status).toBe(200);
    expect((await res.json()).email).toBe('new@email.com');

    const missing = await api('/patients/nope', { method: 'PUT', body: JSON.stringify(emma) });
    expect(missing.status).toBe(404);
  });

  it('POST /api/patients/:id/visits adds a visit and returns updated patient', async () => {
    await api('/admin/reset', { method: 'POST' });
    const res = await api('/patients/p-david-miller/visits', {
      method: 'POST',
      body: JSON.stringify({
        visitDate: '2024-06-15',
        visitTime: '09:00',
        visitType: 'Follow-up',
        practitioner: 'Dr. Jones',
        reasonForVisit: 'BP check',
      }),
    });
    expect(res.status).toBe(201);
    const { visit, patient } = await res.json();
    expect(visit.id).toBeTruthy();
    expect(patient.visits[0].id).toBe(visit.id);
    expect(patient.visits).toHaveLength(2);
  });

  it('DELETE /api/patients/:id/visits/:visitId revokes a visit and 404s for missing', async () => {
    await api('/admin/reset', { method: 'POST' });
    const res = await api('/patients/p-emma-thompson/visits/v2', { method: 'DELETE' });
    expect(res.status).toBe(200);
    const { patient } = await res.json();
    expect(patient.visits.map((v: any) => v.id)).toEqual(['v1', 'v3']);

    const missing = await api('/patients/p-emma-thompson/visits/v2', { method: 'DELETE' });
    expect(missing.status).toBe(404);
  });

  it('POST /api/patients/:id/prescriptions validates medication and adds', async () => {
    const bad = await api('/patients/p-david-miller/prescriptions', {
      method: 'POST',
      body: JSON.stringify({ frequency: 'Once daily' }),
    });
    expect(bad.status).toBe(400);

    const res = await api('/patients/p-david-miller/prescriptions', {
      method: 'POST',
      body: JSON.stringify({
        medication: 'Atorvastatin 20mg',
        frequency: 'Once daily',
        dosage: '1 tablet',
        status: 'Active',
      }),
    });
    expect(res.status).toBe(201);
    const { prescription, patient } = await res.json();
    expect(patient.prescriptions[0].id).toBe(prescription.id);
  });

  it('POST /api/admin/reset restores seed data', async () => {
    const res = await api('/admin/reset', { method: 'POST' });
    expect(res.status).toBe(200);
    const patients = await (await api('/patients')).json();
    expect(patients).toHaveLength(INITIAL_PATIENTS.length);
  });
});

describe('form schemas API', () => {
  it('PUT, GET, and DELETE form schema overrides', async () => {
    await api('/admin/reset', { method: 'POST' });

    expect(await (await api('/forms')).json()).toEqual({});

    const schema = { title: 'Customized Registration', pages: [] };
    const put = await api('/forms/patient-registration', { method: 'PUT', body: JSON.stringify(schema) });
    expect(put.status).toBe(200);

    const list = await (await api('/forms')).json();
    expect(list['patient-registration']).toEqual(schema);

    const del = await api('/forms/patient-registration', { method: 'DELETE' });
    expect(del.status).toBe(200);
    expect(await (await api('/forms')).json()).toEqual({});
  });

  it('rejects non-object schema bodies', async () => {
    const res = await api('/forms/patient-registration', { method: 'PUT', body: JSON.stringify([1, 2]) });
    expect(res.status).toBe(400);
  });
});

describe('auth API', () => {
  it('GET /api/auth/roster lists the seeded demo users without secrets', async () => {
    await api('/admin/reset', { method: 'POST' });
    const res = await api('/auth/roster');
    expect(res.status).toBe(200);
    const roster = await res.json();
    expect(roster.map((u: any) => u.username)).toEqual(INITIAL_USERS.map((u) => u.username));
    expect(roster.filter((u: any) => u.role === 'doctor')).toHaveLength(2);
    expect(roster.filter((u: any) => u.role === 'patient')).toHaveLength(2);
    for (const entry of roster) {
      expect(entry.label).toContain(entry.fullName);
      expect(entry).not.toHaveProperty('password');
      expect(entry).not.toHaveProperty('password_hash');
    }
  });

  it('POST /api/auth/login authenticates a seeded doctor', async () => {
    const res = await api('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username: 'sarah.miller', password: DEMO_PASSWORD }),
    });
    expect(res.status).toBe(200);
    const user = await res.json();
    expect(user.fullName).toBe('Dr. Sarah Miller');
    expect(user.role).toBe('doctor');
    expect(user).not.toHaveProperty('password_hash');
  });

  it('POST /api/auth/login links patient accounts to their patient record', async () => {
    const res = await api('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username: 'emma.thompson', password: DEMO_PASSWORD }),
    });
    expect(res.status).toBe(200);
    const user = await res.json();
    expect(user.role).toBe('patient');
    expect(user.patientId).toBe('p-emma-thompson');
  });

  it('POST /api/auth/login rejects invalid credentials with 401', async () => {
    const wrongPassword = await api('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username: 'sarah.miller', password: 'nope' }),
    });
    expect(wrongPassword.status).toBe(401);

    const unknownUser = await api('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username: 'ghost', password: DEMO_PASSWORD }),
    });
    expect(unknownUser.status).toBe(401);
  });

  it('POST /api/auth/login validates the request body', async () => {
    const res = await api('/auth/login', { method: 'POST', body: JSON.stringify({ username: 'x' }) });
    expect(res.status).toBe(400);
  });
});
