import express, { Express } from 'express';
import { HealthcareDb } from './db';

export function createApp(db: HealthcareDb): Express {
  const app = express();
  app.use(express.json({ limit: '2mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.get('/api/auth/roster', (_req, res) => {
    res.json(db.listUserRoster());
  });

  app.post('/api/auth/login', (req, res) => {
    const body = req.body;
    if (!body || typeof body.username !== 'string' || typeof body.password !== 'string') {
      res.status(400).json({ error: 'username and password are required' });
      return;
    }
    const user = db.authenticateUser(body.username, body.password);
    if (!user) {
      res.status(401).json({ error: 'Invalid username or password' });
      return;
    }
    res.json(user);
  });

  app.get('/api/patients', (req, res) => {
    const { lastName, dateOfBirth, nhsNumber } = req.query;
    const patients = db.listPatients({
      lastName: typeof lastName === 'string' ? lastName : undefined,
      dateOfBirth: typeof dateOfBirth === 'string' ? dateOfBirth : undefined,
      nhsNumber: typeof nhsNumber === 'string' ? nhsNumber : undefined,
    });
    res.json(patients);
  });

  app.get('/api/patients/:id', (req, res) => {
    const patient = db.getPatient(req.params.id);
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
    const created = db.createPatient(body);
    res.status(201).json(created);
  });

  app.put('/api/patients/:id', (req, res) => {
    const body = req.body;
    if (!body || typeof body.firstName !== 'string' || typeof body.lastName !== 'string') {
      res.status(400).json({ error: 'firstName and lastName are required' });
      return;
    }
    const updated = db.updatePatient(req.params.id, body);
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
    const visit = db.addVisit(req.params.id, body);
    if (!visit) {
      res.status(404).json({ error: 'Patient not found' });
      return;
    }
    res.status(201).json({ visit, patient: db.getPatient(req.params.id) });
  });

  app.delete('/api/patients/:id/visits/:visitId', (req, res) => {
    const removed = db.removeVisit(req.params.id, req.params.visitId);
    if (!removed) {
      res.status(404).json({ error: 'Visit not found' });
      return;
    }
    res.json({ status: 'deleted', patient: db.getPatient(req.params.id) });
  });

  app.post('/api/patients/:id/prescriptions', (req, res) => {
    const body = req.body;
    if (!body || typeof body.medication !== 'string' || !body.medication.trim()) {
      res.status(400).json({ error: 'medication is required' });
      return;
    }
    const prescription = db.addPrescription(req.params.id, body);
    if (!prescription) {
      res.status(404).json({ error: 'Patient not found' });
      return;
    }
    res.status(201).json({ prescription, patient: db.getPatient(req.params.id) });
  });

  app.post('/api/admin/reset', (_req, res) => {
    db.resetToInitial();
    res.json({ status: 'reset' });
  });

  app.get('/api/forms', (_req, res) => {
    res.json(db.listFormSchemas());
  });

  app.put('/api/forms/:id', (req, res) => {
    const schema = req.body;
    if (!schema || typeof schema !== 'object' || Array.isArray(schema)) {
      res.status(400).json({ error: 'A survey schema object is required' });
      return;
    }
    db.saveFormSchema(req.params.id, schema);
    res.json({ status: 'saved' });
  });

  app.delete('/api/forms/:id', (req, res) => {
    db.deleteFormSchema(req.params.id);
    res.json({ status: 'deleted' });
  });

  return app;
}
