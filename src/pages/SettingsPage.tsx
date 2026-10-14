import React, { useEffect, useState } from 'react';
import { Modal } from '../components/common/Dialog';
import {
  AppointmentList,
  ROW_CARD_CLASS,
  ROW_CARD_TEXT_CLASS,
  ROW_CARD_TITLE_CLASS,
} from '../components/patients/PatientRecords';
import { OpenFormBuilder } from '../components/modals/PatientDialogs';
import { appointmentRepository } from '../repositories/appointmentRepository';
import { authRepository } from '../repositories/authRepository';
import { FORM_METADATA_LIST, formRepository } from '../repositories/formRepository';
import { patientRepository } from '../repositories/patientRepository';
import { AppointmentRequest } from '../types/appointmentRequest';
import { AuthUser, RosterEntry } from '../types/auth';
import { Icon } from '../ui/Icon';
import {
  Button,
  cx,
  iconButtonClass,
  PageHeading,
  panelBodyClass,
  panelClass,
  PanelHeading,
  Pill,
  useDocumentTitle,
} from '../ui/components';

const PANEL_TEXT_CLASS = 'text-xs leading-[1.8] text-muted-foreground sm:text-[13px]';

interface SettingsPageProps {
  currentUser: AuthUser;
  onOpenFormBuilder: OpenFormBuilder;
  showToast: (message: string) => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ currentUser, onOpenFormBuilder, showToast }) => {
  useDocumentTitle('Inpatient Settings');
  const [practitioners, setPractitioners] = useState<RosterEntry[]>([]);
  const [requests, setRequests] = useState<AppointmentRequest[] | null>(null);
  const [requestError, setRequestError] = useState('');
  const [confirmingReset, setConfirmingReset] = useState(false);

  const loadRequests = () =>
    appointmentRepository
      .getAll()
      .then((loaded) => {
        setRequests(loaded);
        setRequestError('');
      })
      .catch((cause) => setRequestError(cause instanceof Error ? cause.message : 'Requests could not be loaded.'));

  useEffect(() => {
    authRepository
      .getRoster()
      .then((roster) => setPractitioners(roster.filter((user) => user.role === 'doctor')))
      .catch((e) => console.error('Failed to load user roster:', e));
    void loadRequests();
  }, []);

  const resetDemoData = async () => {
    try {
      await patientRepository.resetToInitial();
      await Promise.all(FORM_METADATA_LIST.map((form) => formRepository.resetForm(form.id)));
      await loadRequests();
    } catch (e) {
      console.error('Failed to reset demo data:', e);
    }
    setConfirmingReset(false);
    showToast('Local demo restored.');
  };

  return (
    <>
      <PageHeading
        title="Inpatient & Clinical Settings"
        description="Manage SurveyJS schema definitions, clinical practitioners, and clinic configurations."
        icon="settings"
      />
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.25fr)_minmax(340px,1fr)] lg:gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(340px,1fr)]">
        <section className={panelClass}>
          <PanelHeading title="SurveyJS Schemas" icon="file-text">
            <span className="text-[11px] whitespace-nowrap text-muted-foreground sm:text-xs">
              {FORM_METADATA_LIST.length} Active Forms
            </span>
          </PanelHeading>
          <div className="flex flex-col gap-2.5 px-5 pt-3.5 pb-5 sm:pt-4 sm:pb-6 md:px-6">
            {FORM_METADATA_LIST.map((form) => (
              <article
                key={form.id}
                className="flex min-h-21.5 items-center gap-3 rounded-md border border-border p-3.25 sm:gap-5 sm:p-4"
              >
                <div className="min-w-0 flex-1">
                  <h3 className="text-xs leading-normal font-semibold sm:text-sm">{form.title}</h3>
                  <p className="mt-1 truncate text-[11px] text-muted-foreground sm:text-xs" title={form.description}>
                    {form.description}
                  </p>
                </div>
                <Button
                  icon="settings"
                  size="sm"
                  className="w-27 shrink-0 max-sm:text-[11px] sm:w-33 max-sm:[&_svg]:hidden"
                  aria-label={`Edit in Builder: ${form.title}`}
                  onClick={() => onOpenFormBuilder(form.id)}
                >
                  Edit in Builder
                </Button>
              </article>
            ))}
          </div>
        </section>
        <div className="flex flex-col gap-5 lg:gap-6">
          <section className={panelClass}>
            <PanelHeading title="Authorized Clinical Practitioners" icon="users" />
            <div className="flex flex-col gap-3 px-5 pt-4 pb-6 md:px-6">
              {practitioners.map((practitioner) => {
                const current = practitioner.username === currentUser.username;
                return (
                  <div
                    key={practitioner.username}
                    data-testid="practitioner-row"
                    className={cx(ROW_CARD_CLASS, current ? 'border-primary-border' : 'border-border')}
                  >
                    <div>
                      <h3 className={ROW_CARD_TITLE_CLASS}>{practitioner.fullName}</h3>
                      <p className={ROW_CARD_TEXT_CLASS}>Doctor{current ? ' (Current User)' : ''}</p>
                    </div>
                    {current ? <Pill>Logged In</Pill> : <Pill tone="neutral">Active</Pill>}
                  </div>
                );
              })}
            </div>
          </section>
          <section className={cx(panelClass, 'appointments')}>
            <PanelHeading title="Appointment Requests" description="Requests submitted through the patient portal.">
              <button
                type="button"
                className={iconButtonClass}
                aria-label="Refresh appointment requests"
                onClick={() => loadRequests().then(() => showToast('Appointment requests refreshed.'))}
              >
                <Icon name="refresh-cw" />
              </button>
            </PanelHeading>
            <div className={cx('px-5 pt-4 pb-6 md:px-6', PANEL_TEXT_CLASS)}>
              {requestError ? (
                <p role="alert">{requestError}</p>
              ) : requests === null ? (
                <p role="status">Loading requests…</p>
              ) : (
                <AppointmentList requests={requests} />
              )}
            </div>
          </section>
          <section className={panelClass}>
            <PanelHeading title="Demo State & Data Persistence" icon="database" />
            <div className={panelBodyClass}>
              <p className={PANEL_TEXT_CLASS}>
                Patient records, visits, prescriptions, appointment requests, and customized forms are saved in the
                local SQLite database.
              </p>
              <button
                type="button"
                className="mt-4.5 text-xs leading-[22px] font-semibold text-danger hover:underline sm:text-[13px]"
                onClick={() => setConfirmingReset(true)}
              >
                Reset All Demo Data to Default
              </button>
            </div>
          </section>
        </div>
      </div>
      {confirmingReset && (
        <Modal
          heading="Reset All Demo Data to Default"
          description="Restore the local demo to its starting state."
          onClose={() => setConfirmingReset(false)}
          footer={
            <>
              <Button onClick={() => setConfirmingReset(false)}>Cancel</Button>
              <Button variant="danger" onClick={() => void resetDemoData()}>
                Reset to Default
              </Button>
            </>
          }
        >
          <p>
            This resets patients, visits, prescriptions, appointment requests and form changes in the local database.
          </p>
        </Modal>
      )}
    </>
  );
};
