import express, { Express, NextFunction, Request, Response } from 'express';
import { HealthcareDb } from './db';
import { SessionStore, sessionMiddleware } from './sessions';

/** The database of the visitor making the request. */
const dbOf = (res: Response): HealthcareDb => res.locals.db;

/**
 * A single database is shared by every client (tests, `DEMO_SANDBOX=off`);
 * a session store gives each visitor their own database.
 */
export function createApp(source: HealthcareDb | SessionStore): Express {
  const app = express();
  app.use(express.json({ limit: '2mb' }));
  // Before the session middleware: health probes never create a visitor sandbox.
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
  });
  if ('closeAll' in source) {
    app.use('/api', sessionMiddleware(source));
  } else {
    app.use((_req, res, next) => {
      res.locals.db = source;
      next();
    });
  }

  app.get('/api/auth/roster', (_req, res) => {
    res.json(dbOf(res).listUserRoster());
  });

  app.post('/api/auth/login', (req, res) => {
    const body = req.body;
    if (!body || typeof body.username !== 'string' || typeof body.password !== 'string') {
      res.status(400).json({ error: 'username and password are required' });
      return;
    }
    const user = dbOf(res).authenticateUser(body.username, body.password);
    if (!user) {
      res.status(401).json({ error: 'Invalid username or password' });
      return;
    }
    res.json(user);
  });

  app.get('/api/appointment-requests', (_req, res) => {
    res.json(dbOf(res).listAppointmentRequests());
  });

  app.post('/api/appointment-requests', (req, res) => {
    const body = req.body;
    if (
      !body ||
      typeof body.patientId !== 'string' ||
      !body.patientId.trim() ||
      !body.requestData ||
      typeof body.requestData !== 'object' ||
      Array.isArray(body.requestData)
    ) {
      res.status(400).json({ error: 'patientId and requestData are required' });
      return;
    }

    const request = dbOf(res).createAppointmentRequest(body.patientId, body.requestData);
    if (!request) {
      res.status(404).json({ error: 'Patient not found' });
      return;
    }
    res.status(201).json(request);
  });

  app.get('/api/patients', (req, res) => {
    const { lastName, dateOfBirth, nhsNumber } = req.query;
    const patients = dbOf(res).listPatients({
      lastName: typeof lastName === 'string' ? lastName : undefined,
      dateOfBirth: typeof dateOfBirth === 'string' ? dateOfBirth : undefined,
      nhsNumber: typeof nhsNumber === 'string' ? nhsNumber : undefined,
    });
    res.json(patients);
  });

  app.get('/api/patients/:id', (req, res) => {
    const patient = dbOf(res).getPatient(req.params.id);
    if (!patient) {
      res.status(404).json({ error: 'Patient not found' });
      return;
    }
    res.json(patient);
  });

  app.post('/api/patients', (req, res) => {
    const body = req.body;
    if (!body || typeof body.firstName !== 'string' || typeof body.lastName !== 'string') {
      res.status(400).json({ error: 'firstName and lastName are required' });
      return;
    }
    const created = dbOf(res).createPatient(body);
    res.status(201).json(created);
  });

  app.put('/api/patients/:id', (req, res) => {
    const body = req.body;
    if (!body || typeof body.firstName !== 'string' || typeof body.lastName !== 'string') {
      res.status(400).json({ error: 'firstName and lastName are required' });
      return;
    }
    const updated = dbOf(res).updatePatient(req.params.id, body);
    if (!updated) {
      res.status(404).json({ error: 'Patient not found' });
      return;
    }
    res.json(updated);
  });

  app.post('/api/patients/:id/visits', (req, res) => {
    const body = req.body;
    if (!body || typeof body !== 'object') {
      res.status(400).json({ error: 'Visit body is required' });
      return;
    }
    const visit = dbOf(res).addVisit(req.params.id, body);
    if (!visit) {
      res.status(404).json({ error: 'Patient not found' });
      return;
    }
    res.status(201).json({ visit, patient: dbOf(res).getPatient(req.params.id) });
  });

  app.put('/api/patients/:id/visits/:visitId', (req, res) => {
    const body = req.body;
    if (!body || typeof body !== 'object' || typeof body.visitDate !== 'string') {
      res.status(400).json({ error: 'A visit with a visitDate is required' });
      return;
    }

    const patient = dbOf(res).getPatient(req.params.id);
    const existingVisit = patient?.visits.find((visit) => visit.id === req.params.visitId);
    if (!existingVisit) {
      res.status(404).json({ error: 'Visit not found' });
      return;
    }

    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    if (existingVisit.visitDate !== today || body.visitDate !== today) {
      res.status(400).json({ error: 'Only visits dated today can be edited' });
      return;
    }

    const visit = dbOf(res).updateVisit(req.params.id, req.params.visitId, body);
    if (!visit) {
      res.status(404).json({ error: 'Visit not found or no longer editable' });
      return;
    }
    res.json({ visit, patient: dbOf(res).getPatient(req.params.id) });
  });

  app.delete('/api/patients/:id/visits/:visitId', (req, res) => {
    const removed = dbOf(res).removeVisit(req.params.id, req.params.visitId);
    if (!removed) {
      res.status(404).json({ error: 'Visit not found' });
      return;
    }
    res.json({ status: 'deleted', patient: dbOf(res).getPatient(req.params.id) });
  });

  app.post('/api/patients/:id/prescriptions', (req, res) => {
    const body = req.body;
    if (!body || typeof body.medication !== 'string' || !body.medication.trim()) {
      res.status(400).json({ error: 'medication is required' });
      return;
    }
    const prescription = dbOf(res).addPrescription(req.params.id, body);
    if (!prescription) {
      res.status(404).json({ error: 'Patient not found' });
      return;
    }
    res.status(201).json({ prescription, patient: dbOf(res).getPatient(req.params.id) });
  });

  app.put('/api/patients/:id/prescriptions/:prescriptionId', (req, res) => {
    const body = req.body;
    if (!body || typeof body !== 'object' || typeof body.medication !== 'string' || !body.medication.trim()) {
      res.status(400).json({ error: 'medication is required' });
      return;
    }

    const patient = dbOf(res).getPatient(req.params.id);
    const existingPrescription = patient?.prescriptions.find(
      (prescription) => prescription.id === req.params.prescriptionId,
    );
    if (!existingPrescription) {
      res.status(404).json({ error: 'Prescription not found' });
      return;
    }
    if (existingPrescription.status !== 'Active') {
      res.status(400).json({ error: 'Only active prescriptions can be edited' });
      return;
    }

    const prescription = dbOf(res).updatePrescription(req.params.id, req.params.prescriptionId, body);
    if (!prescription) {
      res.status(409).json({ error: 'Prescription is no longer editable' });
      return;
    }
    res.json({ prescription, patient: dbOf(res).getPatient(req.params.id) });
  });

  app.post('/api/admin/reset', (_req, res) => {
    dbOf(res).resetToInitial();
    res.json({ status: 'reset' });
  });

  app.get('/api/forms', (_req, res) => {
    res.json(dbOf(res).listFormSchemas());
  });

  app.put('/api/forms/:id', (req, res) => {
    const schema = req.body;
    if (!schema || typeof schema !== 'object' || Array.isArray(schema)) {
      res.status(400).json({ error: 'A survey schema object is required' });
      return;
    }
    dbOf(res).saveFormSchema(req.params.id, schema);
    res.json({ status: 'saved' });
  });

  app.delete('/api/forms/:id', (req, res) => {
    dbOf(res).deleteFormSchema(req.params.id);
    res.json({ status: 'deleted' });
  });

  // A visitor's sandbox is size-capped; a write past the cap is refused rather than growing memory.
  app.use((error: unknown, _req: Request, res: Response, next: NextFunction) => {
    if ((error as { code?: string })?.code === 'SQLITE_FULL') {
      res.status(507).json({ error: 'Demo storage limit reached. Reset the demo data to continue.' });
      return;
    }
    next(error);
  });

  return app;
}
