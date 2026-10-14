import React, { useRef } from 'react';
import { Model } from 'survey-core';
import { OpenFormBuilder } from '../components/modals/PatientDialogs';
import { SurveyRenderer } from '../survey/SurveyRenderer';
import { patientRepository } from '../repositories/patientRepository';
import { Patient } from '../types/patient';
import { editFormAction, PageHeading, panelClass, useDocumentTitle, useFormSchema } from '../ui/components';

interface RegisterPatientPageProps {
  onPatientCreated: (patient: Patient) => void;
  onOpenFormBuilder: OpenFormBuilder;
}

export const RegisterPatientPage: React.FC<RegisterPatientPageProps> = ({ onPatientCreated, onOpenFormBuilder }) => {
  useDocumentTitle('Register Patient');
  const schema = useFormSchema('patient-registration');
  const model = useRef<Model | null>(null);

  return (
    <>
      <PageHeading
        title="Register Patient"
        description="Enter new patient details using the registration form. All required fields are marked with *."
        icon="user-plus"
      />
      <section className={panelClass}>
        <SurveyRenderer
          id="registration-form"
          schema={schema}
          onModelReady={(m) => (model.current = m)}
          onSave={(data) =>
            patientRepository
              .createPatientFromSurvey(data)
              .then(onPatientCreated)
              .catch((e) => console.error('Failed to create patient:', e))
          }
          actions={[
            { id: 'reset-registration', title: 'Reset', css: 'clinic-clear', action: () => model.current?.clear(true, false) },
            editFormAction('patient-registration', 'Edit Patient Registration Form', () =>
              onOpenFormBuilder('patient-registration'),
            ),
          ]}
        />
      </section>
    </>
  );
};
