import { describe, it, expect } from 'vitest';
import { Model, QuestionPanelDynamicModel } from 'survey-core';
import { lintSurvey } from 'survey-core/linter';
import patientRegistration from '../../src/survey/schemas/patient-registration.json';
import patientSearch from '../../src/survey/schemas/patient-search.json';
import editPatient from '../../src/survey/schemas/edit-patient.json';
import addNewVisit from '../../src/survey/schemas/add-new-visit.json';
import addNewPrescription from '../../src/survey/schemas/add-new-prescription.json';
import patientVisits from '../../src/survey/schemas/patient-visits.json';
import prescribedMedication from '../../src/survey/schemas/prescribed-medication.json';
import appointmentRequest from '../../src/survey/schemas/appointment-request.json';
import login from '../../src/survey/schemas/login.json';

const schemas: Record<string, object> = {
  login,
  'patient-registration': patientRegistration,
  'patient-search': patientSearch,
  'edit-patient': editPatient,
  'add-new-visit': addNewVisit,
  'add-new-prescription': addNewPrescription,
  'patient-visits': patientVisits,
  'prescribed-medication': prescribedMedication,
  'appointment-request': appointmentRequest,
};

describe('survey schema lint gate', () => {
  for (const [name, schema] of Object.entries(schemas)) {
    it(`${name} has no linter errors`, () => {
      const result = lintSurvey(schema as Record<string, any>);
      const errors = result.findings.filter((f) => f.severity === 'error');
      expect(errors, errors.map((f) => `${f.ruleId} ${f.path}: ${f.message}`).join('\n')).toHaveLength(0);
    });

    // The Creator's JSON Editor validates property values the same way.
    it(`${name} has only valid property values`, () => {
      const model = new Model();
      model.fromJSON(schema, { validatePropertyValues: true });
      expect((model.jsonErrors ?? []).map((e) => e.message)).toEqual([]);
    });
  }
});

describe('read-only history records', () => {
  for (const [name, panelName] of [
    ['patient-visits', 'visit_list'],
    ['prescribed-medication', 'medications'],
  ] as const) {
    it(`${name} panels are not collapsible`, () => {
      const model = new Model(schemas[name]);
      const question = model.getQuestionByName(panelName) as QuestionPanelDynamicModel;
      expect(question.panelsState).toBe('default');
      expect(question.panels[0].isCollapsed).toBe(false);
      expect(question.panels[0].state).toBe('default');
    });
  }

  it('prescribed-medication status reads Active for an ongoing course', () => {
    const model = new Model(schemas['prescribed-medication']);
    model.data = { medications: [{ medication: 'Amlodipine 5mg Tablets' }] };
    const question = model.getQuestionByName('medications') as QuestionPanelDynamicModel;
    expect(question.panels[0].getQuestionByName('status').value).toBe('Active');
  });
});

describe('exported PDF forms', () => {
  it('add-new-prescription is titled "Prescription Form"', () => {
    expect(new Model(schemas['add-new-prescription']).title).toBe('Prescription Form');
  });
});
