import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PatientDialog, PatientDialogs } from '../components/modals/PatientDialogs';
import { AppointmentList, DetailsList, MedicationList, VisitList } from '../components/patients/PatientRecords';
import { appointmentRepository } from '../repositories/appointmentRepository';
import { patientRepository } from '../repositories/patientRepository';
import { SurveyRenderer } from '../survey/SurveyRenderer';
import { AppointmentRequest } from '../types/appointmentRequest';
import { Patient } from '../types/patient';
import { Icon } from '../ui/Icon';
import {
  Breadcrumbs,
  buttonClass,
  cx,
  emptyPanelClass,
  PageHeading,
  panelBodyClass,
  panelClass,
  PanelHeading,
  useDocumentTitle,
  useFormSchema,
} from '../ui/components';
import { formatDate, fullName, patientAddress } from '../ui/format';

/** Loads the signed-in patient's own record; null when it does not exist. */
function useOwnPatient(patientId?: string): Patient | null | undefined {
  const [patient, setPatient] = useState<Patient | null | undefined>(undefined);
  useEffect(() => {
    if (!patientId) {
      setPatient(null);
      return;
    }
    patientRepository
      .getPatientById(patientId)
      .then((loaded) => setPatient(loaded ?? null))
      .catch((e) => console.error('Failed to load patient:', e));
  }, [patientId]);
  return patient;
}

const NoLinkedRecord = () => (
  <section className={emptyPanelClass}>
    <p>No patient record is linked to your account. Please contact the practice.</p>
  </section>
);

export const PatientPortalPage: React.FC<{ patientId?: string }> = ({ patientId }) => {
  useDocumentTitle('Patient Portal');
  const patient = useOwnPatient(patientId);
  const [requests, setRequests] = useState<AppointmentRequest[]>([]);
  const [dialog, setDialog] = useState<PatientDialog | null>(null);

  useEffect(() => {
    appointmentRepository
      .getAll()
      .then((all) => setRequests(all.filter((request) => request.patientId === patientId)))
      .catch((e) => console.error('Failed to load appointment requests:', e));
  }, [patientId]);

  if (patient === undefined) return null;
  if (patient === null) {
    return (
      <>
        <PageHeading title="Patient Portal" icon="user" />
        <NoLinkedRecord />
      </>
    );
  }

  const name = fullName(patient);
  return (
    <>
      <PageHeading title="Patient Portal" description={`Welcome, ${name}.`} icon="user" />
      <section
        className={cx(
          panelClass,
          'mb-6 flex flex-col items-start gap-6 p-5 md:flex-row md:items-center md:justify-between md:p-6',
        )}
      >
        <div>
          <h2 className="text-lg leading-normal font-semibold tracking-tight">{name}</h2>
          <p className="mt-1.5 text-[13px] text-muted-foreground">
            NHS: {patient.nhsNumber} · Date of birth: {formatDate(patient.dateOfBirth)}
          </p>
        </div>
        <Link to="/appointments/new" className={buttonClass('primary', 'md', 'max-md:w-full')}>
          <Icon name="calendar" />
          Request an Appointment
        </Link>
      </section>
      <div className="grid gap-5 md:grid-cols-2 md:gap-6">
        <section className={panelClass}>
          <PanelHeading title="Contact Details" />
          <div className={panelBodyClass}>
            <DetailsList
              items={[
                ['Phone', patient.phoneNumber],
                ['Email', patient.email],
                ['Address', patientAddress(patient)],
              ]}
            />
          </div>
        </section>
        <section className={panelClass}>
          <PanelHeading title="Appointment Requests" />
          <div className={cx(panelBodyClass, 'text-[13px] text-muted-foreground')}>
            <AppointmentList requests={requests} />
          </div>
        </section>
        <section className={panelClass}>
          <PanelHeading title="Visits" />
          <VisitList visits={patient.visits || []} />
        </section>
        <section className={panelClass}>
          <PanelHeading title="Prescribed Medication" />
          <MedicationList
            prescriptions={patient.prescriptions || []}
            onView={(prescription) => setDialog({ kind: 'view-medication', prescription })}
          />
        </section>
      </div>
      <PatientDialogs dialog={dialog} onClose={() => setDialog(null)} onSaved={() => undefined} />
    </>
  );
};

export const AppointmentRequestPage: React.FC<{ patientId?: string; showToast: (message: string) => void }> = ({
  patientId,
  showToast,
}) => {
  useDocumentTitle('Request Appointment');
  const navigate = useNavigate();
  const schema = useFormSchema('appointment-request');
  const patient = useOwnPatient(patientId);
  const [submitting, setSubmitting] = useState(false);

  if (patient === undefined) return null;

  return (
    <>
      <Breadcrumbs items={[{ label: 'Patient Portal', path: '/portal' }, { label: 'Request an Appointment' }]} />
      <PageHeading title="Request an Appointment" description="Send a request to your practice." icon="calendar" />
      {patient === null ? (
        <NoLinkedRecord />
      ) : (
        <section className={panelClass}>
          <SurveyRenderer
            id="appointment-form"
            schema={schema}
            data={{
              patient_name: fullName(patient),
              date_of_birth: patient.dateOfBirth,
              nhs_number: patient.nhsNumber,
              phone_number: patient.phoneNumber,
              email: patient.email,
              urgency: 'Routine',
            }}
            onSave={(data) => {
              if (submitting) return;
              setSubmitting(true);
              appointmentRepository
                .create(patient.id, data)
                .then(() => {
                  navigate('/portal');
                  showToast('Appointment request sent.');
                })
                .catch((e) => {
                  console.error('Failed to submit appointment request:', e);
                  showToast('The request could not be submitted.');
                })
                .finally(() => setSubmitting(false));
            }}
            actions={[{ id: 'cancel-appointment', title: 'Cancel', css: 'clinic-clear', action: () => navigate('/portal') }]}
          />
        </section>
      )}
    </>
  );
};
