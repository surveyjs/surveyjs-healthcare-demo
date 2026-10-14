import React, { useEffect, useState } from 'react';
import { OpenFormBuilder, PatientDialog, PatientDialogs } from '../components/modals/PatientDialogs';
import { DetailsList, MedicationList, VisitList } from '../components/patients/PatientRecords';
import { patientRepository } from '../repositories/patientRepository';
import { Patient } from '../types/patient';
import { Icon } from '../ui/Icon';
import { Breadcrumbs, Button, NotFound, PageHeading, useDocumentTitle } from '../ui/components';
import { dateOfBirthWithAge, formatDate, formatPhone, fullName, initials, patientAddress } from '../ui/format';

interface PatientProfilePageProps {
  patientId: string;
  onOpenFormBuilder: OpenFormBuilder;
  showToast: (message: string) => void;
}

export const PatientProfilePage: React.FC<PatientProfilePageProps> = ({ patientId, onOpenFormBuilder, showToast }) => {
  useDocumentTitle('Patient Profile');
  const [patient, setPatient] = useState<Patient | null | undefined>(undefined);
  const [dialog, setDialog] = useState<PatientDialog | null>(null);
  const [detailsExpanded, setDetailsExpanded] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = () =>
      patientRepository
        .getPatientById(patientId)
        .then((loaded) => {
          if (!cancelled) setPatient(loaded ?? null);
        })
        .catch((e) => console.error('Failed to load patient:', e));
    load();
    const unsubscribe = patientRepository.subscribe(load);
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [patientId]);

  if (patient === undefined) return null;
  if (patient === null) return <NotFound backPath="/manage" backLabel="Back to Manage Patients" />;

  const name = fullName(patient);
  const sex = patient.gender?.toLowerCase() === 'female' ? 'Female' : patient.gender?.toLowerCase() === 'male' ? 'Male' : '';
  const emergency = patient.emergencyContact;
  const detailToggle = {
    'aria-expanded': detailsExpanded,
    'aria-controls': 'basic-details-content contact-details-content',
    onClick: () => setDetailsExpanded((expanded) => !expanded),
  };

  return (
    <>
      <Breadcrumbs items={[{ label: 'Manage Patients', path: '/manage' }, { label: name }]} />
      <PageHeading title="Patient Profile" description={name} icon="user" />
      <div className="profile-layout">
        <aside className="panel builder-tools">
          <h3>Form Builder Tools</h3>
          <p className="muted">Customize forms used to capture patient, visit and intake data.</p>
          <div className="builder-tool-actions">
            <Button icon="settings" onClick={() => onOpenFormBuilder('edit-patient')}>
              <span>Edit Patient Form</span>
            </Button>
            <Button icon="settings" onClick={() => onOpenFormBuilder('add-new-visit')}>
              <span>Edit Visit Form</span>
            </Button>
            <Button icon="settings" onClick={() => onOpenFormBuilder('patient-registration')}>
              <span>Edit Registration Form</span>
            </Button>
          </div>
        </aside>
        <div className="profile-main">
          <section className="panel patient-overview">
            <div className="profile-summary">
              <span className="avatar">{initials(name)}</span>
              <div>
                <div className="name-row">
                  <h2>{name}</h2>
                  <span className="pill">{patient.status || 'Active'}</span>
                </div>
                <p className="muted">
                  DOB: {dateOfBirthWithAge(patient)} · NHS: {patient.nhsNumber}
                  <br />
                  Registered: {formatDate(patient.registeredDate)}
                </p>
              </div>
              <div className="profile-actions">
                <Button icon="edit-2" onClick={() => setDialog({ kind: 'edit-patient', patient })}>
                  Edit Patient
                </Button>
                <Button icon="file-plus" onClick={() => setDialog({ kind: 'prescription', patient })}>
                  Add Prescription
                </Button>
                <Button icon="calendar" variant="primary" onClick={() => setDialog({ kind: 'visit', patient })}>
                  Record Visit
                </Button>
              </div>
            </div>
            <div className="profile-grid profile-details-grid">
              <section className="profile-detail-section">
                <h2 className="profile-detail-title">
                  <button type="button" className="profile-detail-heading" {...detailToggle}>
                    <span>Basic Details</span>
                  </button>
                </h2>
                <div className="panel-body" id="basic-details-content" hidden={!detailsExpanded}>
                  <DetailsList
                    items={[
                      ['Sex', sex],
                      ['NHS Number', patient.nhsNumber],
                      ['Date of birth', dateOfBirthWithAge(patient)],
                      ['Registered on', formatDate(patient.registeredDate)],
                      ['Allergies', patient.knownAllergies],
                    ]}
                  />
                </div>
              </section>
              <section className="profile-detail-section">
                <h2 className="profile-detail-title">
                  <button type="button" className="profile-detail-heading" {...detailToggle}>
                    <span>Contact Details</span>
                    <Icon name="chevron-down" />
                  </button>
                </h2>
                <div className="panel-body" id="contact-details-content" hidden={!detailsExpanded}>
                  <DetailsList
                    items={[
                      ['Phone', patient.phoneNumber],
                      ['Email', patient.email],
                      ['Address', patientAddress(patient)],
                      [
                        'Emergency Contact',
                        [emergency?.fullName, formatPhone(emergency?.phoneNumber)].filter(Boolean).join(' · '),
                      ],
                    ]}
                  />
                </div>
              </section>
            </div>
          </section>
          <div className="profile-grid">
            <section className="panel history-panel">
              <div className="panel-heading history-heading">
                <h2>Visits</h2>
                <Button
                  icon="plus"
                  variant="primary history-add-button"
                  aria-label="Record Visit"
                  title="Record Visit"
                  aria-haspopup="dialog"
                  onClick={() => setDialog({ kind: 'visit', patient })}
                />
              </div>
              <VisitList
                visits={patient.visits || []}
                onView={(visit) => setDialog({ kind: 'view-visit', visit })}
                onEdit={(visit) => setDialog({ kind: 'visit', patient, visit })}
              />
            </section>
            <section className="panel history-panel">
              <div className="panel-heading history-heading">
                <h2>Prescribed Medication</h2>
                <Button
                  icon="plus"
                  variant="primary history-add-button"
                  aria-label="Add Prescription"
                  title="Add Prescription"
                  aria-haspopup="dialog"
                  onClick={() => setDialog({ kind: 'prescription', patient })}
                />
              </div>
              <MedicationList
                prescriptions={patient.prescriptions || []}
                onEdit={(prescription) => setDialog({ kind: 'prescription', patient, prescription })}
              />
            </section>
          </div>
        </div>
      </div>
      <PatientDialogs
        dialog={dialog}
        onClose={() => setDialog(null)}
        onSaved={showToast}
        onOpenBuilder={(formId, reopen) => {
          setDialog(null);
          onOpenFormBuilder(formId, () => setDialog(reopen));
        }}
      />
    </>
  );
};
