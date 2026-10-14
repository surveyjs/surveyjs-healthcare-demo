import React, { useEffect, useState } from 'react';
import { OpenFormBuilder, PatientDialog, PatientDialogs } from '../components/modals/PatientDialogs';
import { DetailsList, MedicationList, VisitList } from '../components/patients/PatientRecords';
import { patientRepository } from '../repositories/patientRepository';
import { Patient } from '../types/patient';
import { Icon } from '../ui/Icon';
import {
  Breadcrumbs,
  Button,
  cx,
  NotFound,
  PageHeading,
  panelClass,
  PanelHeading,
  Pill,
  useDocumentTitle,
} from '../ui/components';

const PROFILE_GRID_CLASS = 'grid gap-5 md:grid-cols-2 md:gap-6';
const PROFILE_ACTION_CLASS = 'max-md:min-w-35 max-md:flex-1 max-md:whitespace-normal';
// The tools card is only shown from xl up, so its overrides of the button defaults are xl-scoped.
const BUILDER_TOOL_CLASS = 'w-full xl:justify-start xl:text-left xl:text-[11px] xl:leading-[18px] xl:whitespace-normal';
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
  // Both headings toggle both sections, so they highlight together as one bar.
  const detailToggle = {
    'aria-expanded': detailsExpanded,
    'aria-controls': 'basic-details-content contact-details-content',
    onClick: () => setDetailsExpanded((expanded) => !expanded),
    className:
      'relative flex min-h-13 w-full items-center justify-between gap-3 px-5 py-3.5 text-left font-semibold text-foreground group-has-[button:hover]/details:bg-card-subtle group-has-[button:focus-visible]/details:bg-card-subtle focus-visible:-outline-offset-3 md:px-6',
  };
  const detailBodyClass = 'px-5 pt-1 pb-6 md:px-6';

  return (
    <>
      <Breadcrumbs items={[{ label: 'Manage Patients', path: '/manage' }, { label: name }]} />
      <PageHeading title="Patient Profile" description={name} icon="user" />
      <div className="grid items-start gap-6 xl:grid-cols-[220px_minmax(0,1fr)]">
        <aside className={cx(panelClass, 'hidden p-5 xl:block')}>
          <h3 className="text-sm leading-normal font-semibold">Form Builder Tools</h3>
          <p className="mt-1.75 mb-5 text-xs leading-[1.8] text-muted-foreground">
            Customize forms used to capture patient, visit and intake data.
          </p>
          <div className="grid auto-rows-fr gap-2">
            <Button icon="settings" size="sm" className={BUILDER_TOOL_CLASS} onClick={() => onOpenFormBuilder('edit-patient')}>
              <span>Edit Patient Form</span>
            </Button>
            <Button icon="settings" size="sm" className={BUILDER_TOOL_CLASS} onClick={() => onOpenFormBuilder('add-new-visit')}>
              <span>Edit Visit Form</span>
            </Button>
            <Button
              icon="settings"
              size="sm"
              className={BUILDER_TOOL_CLASS}
              onClick={() => onOpenFormBuilder('patient-registration')}
            >
              <span>Edit Registration Form</span>
            </Button>
          </div>
        </aside>
        <div className="min-w-0">
          <section className={cx(panelClass, 'mb-5 md:mb-6')}>
            <div className="flex flex-wrap items-center gap-3.5 border-b border-border p-5 md:gap-4.5 md:p-6">
              <span className="flex size-11.5 shrink-0 items-center justify-center rounded-full bg-primary-soft text-base font-semibold text-primary md:size-14 md:text-lg">
                {initials(name)}
              </span>
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-xl leading-[1.4] font-semibold tracking-tight md:text-[22px]">{name}</h2>
                  <Pill>{patient.status || 'Active'}</Pill>
                </div>
                <p className="mt-1.75 text-xs leading-[1.8] text-muted-foreground">
                  DOB: {dateOfBirthWithAge(patient)} · NHS: {patient.nhsNumber}
                  <br />
                  Registered: {formatDate(patient.registeredDate)}
                </p>
              </div>
              <div className="flex w-full flex-wrap gap-2.5 pt-1 md:ml-auto md:w-auto md:max-w-97.5 md:pt-0 xl:max-w-none">
                <Button
                  icon="edit-2"
                  size="sm"
                  className={PROFILE_ACTION_CLASS}
                  onClick={() => setDialog({ kind: 'edit-patient', patient })}
                >
                  Edit Patient
                </Button>
                <Button
                  icon="file-plus"
                  size="sm"
                  className={PROFILE_ACTION_CLASS}
                  onClick={() => setDialog({ kind: 'prescription', patient })}
                >
                  Add Prescription
                </Button>
                <Button
                  icon="calendar"
                  variant="primary"
                  size="sm"
                  className={PROFILE_ACTION_CLASS}
                  onClick={() => setDialog({ kind: 'visit', patient })}
                >
                  Record Visit
                </Button>
              </div>
            </div>
            <div className="group/details grid md:grid-cols-2 md:gap-6">
              <section className="min-w-0">
                <h2 className="text-sm leading-[22px]">
                  <button
                    type="button"
                    {...detailToggle}
                    className={cx(
                      detailToggle.className,
                      'md:after:absolute md:after:inset-y-0 md:after:left-full md:after:w-6 md:after:bg-inherit',
                    )}
                  >
                    <span>Basic Details</span>
                  </button>
                </h2>
                <div className={detailBodyClass} id="basic-details-content" hidden={!detailsExpanded}>
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
              <section className="min-w-0">
                <h2 className="text-sm leading-[22px]">
                  <button type="button" {...detailToggle}>
                    <span>Contact Details</span>
                    <Icon
                      name="chevron-down"
                      className={cx('size-4 text-muted-foreground transition-transform', detailsExpanded && 'rotate-180')}
                    />
                  </button>
                </h2>
                <div className={detailBodyClass} id="contact-details-content" hidden={!detailsExpanded}>
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
          <div className={PROFILE_GRID_CLASS}>
            <section className={panelClass}>
              <PanelHeading title="Visits">
                <Button
                  icon="plus"
                  variant="primary"
                  size="icon"
                  aria-label="Record Visit"
                  title="Record Visit"
                  aria-haspopup="dialog"
                  onClick={() => setDialog({ kind: 'visit', patient })}
                />
              </PanelHeading>
              <VisitList
                visits={patient.visits || []}
                onView={(visit) => setDialog({ kind: 'view-visit', visit })}
                onEdit={(visit) => setDialog({ kind: 'visit', patient, visit })}
              />
            </section>
            <section className={panelClass}>
              <PanelHeading title="Prescribed Medication">
                <Button
                  icon="plus"
                  variant="primary"
                  size="icon"
                  aria-label="Add Prescription"
                  title="Add Prescription"
                  aria-haspopup="dialog"
                  onClick={() => setDialog({ kind: 'prescription', patient })}
                />
              </PanelHeading>
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
