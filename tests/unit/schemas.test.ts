import { describe, it, expect } from 'vitest';
import { lintSurvey } from 'survey-core/linter';
import patientRegistration from '../../src/survey/schemas/patient-registration.json';
import patientSearch from '../../src/survey/schemas/patient-search.json';
import editPatient from '../../src/survey/schemas/edit-patient.json';
import addNewVisit from '../../src/survey/schemas/add-new-visit.json';
import addNewPrescription from '../../src/survey/schemas/add-new-prescription.json';
import patientVisits from '../../src/survey/schemas/patient-visits.json';
import prescribedMedication from '../../src/survey/schemas/prescribed-medication.json';

const schemas: Record<string, object> = {
  'patient-registration': patientRegistration,
  'patient-search': patientSearch,
  'edit-patient': editPatient,
  'add-new-visit': addNewVisit,
  'add-new-prescription': addNewPrescription,
  'patient-visits': patientVisits,
  'prescribed-medication': prescribedMedication,
};

describe('survey schema lint gate', () => {
  for (const [name, schema] of Object.entries(schemas)) {
    it(`${name} has no linter errors`, () => {
      const result = lintSurvey(schema as Record<string, any>);
      const errors = result.findings.filter((f) => f.severity === 'error');
      expect(errors, errors.map((f) => `${f.ruleId} ${f.path}: ${f.message}`).join('\n')).toHaveLength(0);
    });
  }
});
