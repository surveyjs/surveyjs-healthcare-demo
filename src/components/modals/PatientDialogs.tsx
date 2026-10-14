import React, { useRef } from 'react';
import { Model } from 'survey-core';
import { SurveyPDF } from 'survey-pdf';
import { Modal } from '../common/Dialog';
import { SurveyNavigationAction, SurveyRenderer } from '../../survey/SurveyRenderer';
import { patientRepository } from '../../repositories/patientRepository';
import { authRepository } from '../../repositories/authRepository';
import { mapPrescriptionsToSurveyData, mapVisitsToSurveyData } from '../../repositories/surveyMapping';
import { FormId } from '../../types/forms';
import { Patient, Prescription, Visit } from '../../types/patient';
import { editFormAction, useFormSchema } from '../../ui/components';
import { fullName, patientContext, todayIso } from '../../ui/format';

export type PatientDialog =
  | { kind: 'edit-patient'; patient: Patient }
  | { kind: 'visit'; patient: Patient; visit?: Visit }
  | { kind: 'prescription'; patient: Patient; prescription?: Prescription }
  | { kind: 'view-visit'; visit: Visit }
  | { kind: 'view-medication'; prescription: Prescription };

/** onReturn reopens the originating dialog after the builder's "Save & Apply Form". */
export type OpenFormBuilder = (formId: FormId, onReturn?: () => void) => void;

interface FormDialogProps {
  formId: FormId;
  heading: string;
  description?: string;
  data?: Record<string, unknown>;
  readOnly?: boolean;
  actions?: SurveyNavigationAction[];
  onSave?: (data: Record<string, any>) => void;
  onModelReady?: (model: Model) => void;
  onClose: () => void;
}

const FormDialog: React.FC<FormDialogProps> = ({
  formId,
  heading,
  description,
  data,
  readOnly = false,
  actions = [],
  onSave,
  onModelReady,
  onClose,
}) => {
  const schema = useFormSchema(formId);
  return (
    <Modal className="form-dialog" heading={heading} description={description} onClose={onClose}>
      <SurveyRenderer
        id="modal-form"
        schema={schema}
        data={data}
        readOnly={readOnly}
        hideTitle
        showNavigation={!readOnly}
        onSave={onSave}
        onModelReady={onModelReady}
        actions={readOnly ? [] : [{ id: 'cancel-modal', title: 'Cancel', css: 'clinic-clear', action: onClose }, ...actions]}
      />
    </Modal>
  );
};

type SchemaChoice = string | { value?: string; text?: string };
const choiceValue = (c: SchemaChoice) => (typeof c === 'string' ? c : (c.value ?? ''));
const choiceText = (c: SchemaChoice) => (typeof c === 'string' ? c : (c.text ?? c.value ?? ''));

/**
 * The logged-in doctor is the default practitioner. If they are not among the
 * schema's choices, their full name selects the dropdown's "Other" item
 * (SurveyJS moves unlisted values into the comment). Non-doctor contexts fall
 * back to the first choice.
 */
function getPractitionerDefault(schema: object): string | undefined {
  const pages = (schema as { pages?: { elements?: { name?: string; choices?: SchemaChoice[] }[] }[] }).pages ?? [];
  const question = pages.flatMap((p) => p.elements ?? []).find((el) => el.name === 'practitioner');
  const choices = question?.choices ?? [];
  const user = authRepository.getStoredUser();
  if (user?.role === 'doctor') {
    const match = choices.find((c) => choiceText(c) === user.fullName);
    return match ? choiceValue(match) : user.fullName;
  }
  return choices.length > 0 ? choiceValue(choices[0]) : undefined;
}

interface PatientDialogsProps {
  dialog: PatientDialog | null;
  onClose: () => void;
  /** Called after a successful save with the toast message. */
  onSaved: (message: string) => void;
  /** Opens a form in the builder; the dialog closes and reopens after "Save & Apply Form". */
  onOpenBuilder?: (formId: FormId, reopen: PatientDialog) => void;
}

export const PatientDialogs: React.FC<PatientDialogsProps> = ({ dialog, onClose, onSaved, onOpenBuilder }) => {
  const prescriptionModel = useRef<Model | null>(null);
  const visitSchema = useFormSchema('add-new-visit');
  const prescriptionSchema = useFormSchema('add-new-prescription');
  if (!dialog) return null;

  const builderAction = (formId: FormId, label: string): SurveyNavigationAction[] =>
    onOpenBuilder ? [editFormAction(formId, label, () => onOpenBuilder(formId, dialog))] : [];
  const save = (task: () => Promise<unknown>, message: string) =>
    task()
      .then(() => {
        onClose();
        onSaved(message);
      })
      .catch((e) => console.error('Failed to save:', e));

  switch (dialog.kind) {
    case 'edit-patient': {
      const { patient } = dialog;
      return (
        <FormDialog
          key={`edit-${patient.id}`}
          formId="edit-patient"
          heading={`Edit Patient — ${fullName(patient)}`}
          description={patientContext(patient)}
          data={patientRepository.mapPatientToSurveyData(patient)}
          actions={builderAction('edit-patient', 'Edit Patient Form')}
          onSave={(data) => save(() => patientRepository.updatePatientFromSurvey(patient.id, data), 'Patient details saved.')}
          onClose={onClose}
        />
      );
    }
    case 'visit': {
      const { patient, visit } = dialog;
      const now = new Date();
      const data = visit
        ? patientRepository.mapVisitToSurveyData(visit)
        : {
            visit_date: todayIso(),
            visit_time: `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`,
            visit_type: 'consultation',
            practitioner: getPractitionerDefault(visitSchema),
          };
      return (
        <FormDialog
          key={`visit-${patient.id}-${visit?.id ?? 'new'}`}
          formId="add-new-visit"
          heading={`${visit ? 'Edit Visit' : 'Record Visit'} — ${fullName(patient)}`}
          description={patientContext(patient)}
          data={data}
          actions={builderAction('add-new-visit', 'Edit Visit Form')}
          onSave={(values) =>
            visit
              ? save(() => patientRepository.updateVisit(patient.id, visit.id, values), 'Visit updated.')
              : save(() => patientRepository.addVisit(patient.id, values), 'Visit recorded.')
          }
          onClose={onClose}
        />
      );
    }
    case 'prescription': {
      const { patient, prescription } = dialog;
      const data = prescription
        ? patientRepository.mapPrescriptionToSurveyData(prescription)
        : { start_date: todayIso(), frequency: 'once_daily', unit: 'tablets', question1: '1' };
      const previewAndPrint = async () => {
        const model = prescriptionModel.current;
        if (!model) return;
        try {
          const pdf = new SurveyPDF(prescriptionSchema);
          pdf.data = model.data;
          const recordName = prescription?.medication || model.data.medication || 'prescription';
          const fileName =
            `${patient.lastName}-${recordName}`
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, '-')
              .replace(/^-|-$/g, '') + '.pdf';
          await pdf.save(fileName);
        } catch (error) {
          console.error('Failed to export prescription PDF:', error);
        }
      };
      return (
        <FormDialog
          key={`rx-${patient.id}-${prescription?.id ?? 'new'}`}
          formId="add-new-prescription"
          heading={`${prescription ? 'Edit Prescription' : 'Add Prescription'} — ${fullName(patient)}`}
          description={patientContext(patient)}
          data={data}
          actions={[
            { id: 'preview-print', title: 'Preview and Print', css: 'clinic-clear', action: () => void previewAndPrint() },
            ...builderAction('add-new-prescription', 'Edit Prescription Form'),
          ]}
          onModelReady={(model) => (prescriptionModel.current = model)}
          onSave={(values) =>
            prescription
              ? save(() => patientRepository.updatePrescription(patient.id, prescription.id, values), 'Prescription saved.')
              : save(() => patientRepository.addPrescription(patient.id, values), 'Prescription saved.')
          }
          onClose={onClose}
        />
      );
    }
    case 'view-visit':
      return (
        <FormDialog
          key={`view-visit-${dialog.visit.id}`}
          formId="patient-visits"
          heading="Visit Details"
          data={mapVisitsToSurveyData([dialog.visit])}
          readOnly
          onClose={onClose}
        />
      );
    case 'view-medication':
      return (
        <FormDialog
          key={`view-rx-${dialog.prescription.id}`}
          formId="prescribed-medication"
          heading="Medication Record"
          data={mapPrescriptionsToSurveyData([dialog.prescription])}
          readOnly
          onClose={onClose}
        />
      );
  }
};
