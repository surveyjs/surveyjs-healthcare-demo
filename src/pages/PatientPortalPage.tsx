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
import { Breadcrumbs, PageHeading, useDocumentTitle, useFormSchema } from '../ui/components';
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
  <section className="panel empty">
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
      <section className="panel portal-summary">
        <div>
          <h2>{name}</h2>
          <p className="muted">
            NHS: {patient.nhsNumber} · Date of birth: {formatDate(patient.dateOfBirth)}
          </p>
        </div>
        <Link to="/appointments/new" className="button primary">
          <Icon name="calendar" />
          Request an Appointment
        </Link>
      </section>
      <div className="profile-grid portal-grid">
        <section className="panel">
          <div className="panel-heading">
            <h2>Contact Details</h2>
          </div>
          <div className="panel-body">
            <DetailsList
              items={[
                ['Phone', patient.phoneNumber],
                ['Email', patient.email],
                ['Address', patientAddress(patient)],
              ]}
            />
          </div>
        </section>
        <section className="panel">
          <div className="panel-heading">
            <h2>Appointment Requests</h2>
          </div>
          <div className="panel-body">
            <AppointmentList requests={requests} />
          </div>
        </section>
        <section className="panel">
          <div className="panel-heading">
            <h2>Visits</h2>
          </div>
          <VisitList visits={patient.visits || []} />
        </section>
        <section className="panel">
          <div className="panel-heading">
            <h2>Prescribed Medication</h2>
          </div>
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
        <section className="panel">
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
