import React, { useEffect, useState } from 'react';
import { Modal } from '../components/common/Dialog';
import { AppointmentList } from '../components/patients/PatientRecords';
import { OpenFormBuilder } from '../components/modals/PatientDialogs';
import { appointmentRepository } from '../repositories/appointmentRepository';
import { authRepository } from '../repositories/authRepository';
import { FORM_METADATA_LIST, formRepository } from '../repositories/formRepository';
import { patientRepository } from '../repositories/patientRepository';
import { AppointmentRequest } from '../types/appointmentRequest';
import { AuthUser, RosterEntry } from '../types/auth';
import { Icon } from '../ui/Icon';
import { Button, PageHeading, useDocumentTitle } from '../ui/components';

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
      <div className="settings-grid">
        <section className="panel schemas-panel">
          <div className="panel-heading">
            <h2>
              <Icon name="file-text" />
              SurveyJS Schemas
            </h2>
            <span className="section-meta">{FORM_METADATA_LIST.length} Active Forms</span>
          </div>
          <div className="schema-list">
            {FORM_METADATA_LIST.map((form) => (
              <article key={form.id} className="schema-row">
                <div className="schema-copy">
                  <h3>{form.title}</h3>
                  <p title={form.description}>{form.description}</p>
                </div>
                <Button
                  icon="settings"
                  aria-label={`Edit in Builder: ${form.title}`}
                  onClick={() => onOpenFormBuilder(form.id)}
                >
                  Edit in Builder
                </Button>
              </article>
            ))}
          </div>
        </section>
        <div className="settings-side">
          <section className="panel">
            <div className="panel-heading">
              <h2>
                <Icon name="users" />
                Authorized Clinical Practitioners
              </h2>
            </div>
            <div className="practitioners">
              {practitioners.map((practitioner) => {
                const current = practitioner.username === currentUser.username;
                return (
                  <div
                    key={practitioner.username}
                    data-testid="practitioner-row"
                    className={`practitioner ${current ? 'current' : ''}`}
                  >
                    <div>
                      <h3>{practitioner.fullName}</h3>
                      <p>Doctor{current ? ' (Current User)' : ''}</p>
                    </div>
                    {current ? <span className="pill">Logged In</span> : <span className="pill neutral">Active</span>}
                  </div>
                );
              })}
            </div>
          </section>
          <section className="panel appointments">
            <div className="panel-heading">
              <div>
                <h2>Appointment Requests</h2>
                <p className="section-description">Requests submitted through the patient portal.</p>
              </div>
              <button
                type="button"
                className="icon-button"
                aria-label="Refresh appointment requests"
                onClick={() => loadRequests().then(() => showToast('Appointment requests refreshed.'))}
              >
                <Icon name="refresh-cw" />
              </button>
            </div>
            <div className="panel-body">
              {requestError ? (
                <p role="alert">{requestError}</p>
              ) : requests === null ? (
                <p role="status">Loading requests…</p>
              ) : (
                <AppointmentList requests={requests} />
              )}
            </div>
          </section>
          <section className="panel">
            <div className="panel-heading">
              <h2>
                <Icon name="database" />
                Demo State & Data Persistence
              </h2>
            </div>
            <div className="panel-body">
              <p>
                Patient records, visits, prescriptions, appointment requests, and customized forms are saved in the
                local SQLite database.
              </p>
              <button type="button" className="danger-link" onClick={() => setConfirmingReset(true)}>
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
