import React, { useEffect, useRef, useState } from 'react';
import { ActionContainer, Model } from 'survey-core';
import { PatientCard } from '../components/patients/PatientCard';
import { OpenFormBuilder, PatientDialog, PatientDialogs } from '../components/modals/PatientDialogs';
import { SurveyRenderer } from '../survey/SurveyRenderer';
import { patientRepository } from '../repositories/patientRepository';
import { Patient } from '../types/patient';
import { Icon } from '../ui/Icon';
import { editFormAction, PageHeading, useDocumentTitle, useFormSchema } from '../ui/components';
import { filterPatients, PatientQuery } from '../ui/format';

interface ManagePatientsPageProps {
  onOpenFormBuilder: OpenFormBuilder;
  showToast: (message: string) => void;
}

const EMPTY_QUERY: PatientQuery = { name: '', dob: '', nhs: '' };
// Filters survive navigating to a profile and back, like the search form's answers.
let lastQuery: PatientQuery = EMPTY_QUERY;

const queryFromSurvey = (data: Record<string, any>): PatientQuery => ({
  name: data.patient_name ?? data.last_name ?? '',
  dob: data.date_of_birth ?? '',
  nhs: data['nhs-number'] ?? '',
});

export const ManagePatientsPage: React.FC<ManagePatientsPageProps> = ({ onOpenFormBuilder, showToast }) => {
  useDocumentTitle('Manage Patients');
  const schema = useFormSchema('patient-search');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [query, setQueryState] = useState(lastQuery);
  const [dialog, setDialog] = useState<PatientDialog | null>(null);
  const searchModel = useRef<Model | null>(null);

  const setQuery = (next: PatientQuery) => {
    lastQuery = next;
    setQueryState(next);
  };

  useEffect(() => {
    const load = () =>
      patientRepository
        .getAllPatients()
        .then(setPatients)
        .catch((e) => console.error('Failed to load patients:', e));
    load();
    return patientRepository.subscribe(load);
  }, []);

  // The row menus close on an outside click, and Escape returns focus to the open menu's button.
  useEffect(() => {
    const handleClick = (event: MouseEvent) =>
      document.querySelectorAll<HTMLDetailsElement>('.patient-menu[open]').forEach((menu) => {
        if (!menu.contains(event.target as Node)) menu.open = false;
      });
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || document.querySelector('dialog[open]')) return;
      const menu = document.querySelector<HTMLDetailsElement>('.patient-menu[open]');
      if (menu) {
        event.preventDefault();
        menu.open = false;
        menu.querySelector('summary')?.focus({ preventScroll: true });
      }
    };
    document.addEventListener('click', handleClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('click', handleClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Enter commits the current field and applies filters without clearing them.
  useEffect(() => {
    const host = document.getElementById('survey-search');
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (
        event.key !== 'Enter' ||
        event.isComposing ||
        event.ctrlKey ||
        event.altKey ||
        event.metaKey ||
        event.shiftKey ||
        !target.matches('input') ||
        target.getAttribute('aria-expanded') === 'true'
      )
        return;
      event.preventDefault();
      event.stopPropagation();
      target.blur();
      target.focus({ preventScroll: true });
      if (searchModel.current) setQuery(queryFromSurvey(searchModel.current.data));
    };
    host?.addEventListener('keydown', handleKeyDown, true);
    return () => host?.removeEventListener('keydown', handleKeyDown, true);
  }, [schema]);

  const clearFilters = () => {
    searchModel.current?.clear(true, false);
    setQuery(EMPTY_QUERY);
  };

  const rows = filterPatients(patients, query);
  const matchText = `${rows.length} ${rows.length === 1 ? 'match' : 'matches'} found`;

  return (
    <>
      <PageHeading
        title="Manage Patients"
        description="Search for an existing patient using one or more criteria. Leave fields blank for broader results."
        icon="users"
      />
      <section className="panel search-panel">
        <SurveyRenderer
          id="survey-search"
          schema={schema}
          data={{ patient_name: query.name, date_of_birth: query.dob, 'nhs-number': query.nhs }}
          onSave={(data) => setQuery(queryFromSurvey(data))}
          onValueChanged={(data) => setQuery(queryFromSurvey(data))}
          actions={[{ id: 'clear-search', title: 'Clear filters', css: 'clinic-clear', action: clearFilters }]}
          configure={(model) => {
            model.textUpdateMode = 'onTyping';
            model.showCompleteButton = false;
            const toolbar = new ActionContainer();
            toolbar.setActionsAppearance({ mode: 'tertiary-surface', size: 'large', style: 'brand', showBorder: true });
            toolbar.cssClasses = { ...model.navigationBar.cssClasses, root: 'sd-action-bar search-header-actions' };
            toolbar.setItems([
              editFormAction('patient-search', 'Edit Search Form', () => onOpenFormBuilder('patient-search')),
            ]);
            model.addLayoutElement({
              id: 'search-header-actions',
              container: 'header',
              component: 'sv-action-bar',
              data: toolbar,
            });
          }}
          onModelReady={(model) => (searchModel.current = model)}
        />
      </section>
      <section className="results">
        <h3 className="result-count" id="result-count" tabIndex={-1} aria-live="polite" aria-atomic="true">
          {matchText}
        </h3>
        <div id="patient-results">
          {rows.length ? (
            <div className="patient-list">
              {rows.map((patient) => (
                <PatientCard
                  key={patient.id}
                  patient={patient}
                  onRecordVisit={(p) => setDialog({ kind: 'visit', patient: p })}
                  onAddPrescription={(p) => setDialog({ kind: 'prescription', patient: p })}
                  onEditPatient={(p) => setDialog({ kind: 'edit-patient', patient: p })}
                />
              ))}
            </div>
          ) : (
            <div className="panel empty">
              <span className="empty-icon">
                <Icon name="users" />
              </span>
              <h3>No patients matched your search</h3>
              <p>Try broadening your search criteria or register a new patient using the registration form.</p>
              <button type="button" className="button" onClick={clearFilters}>
                <Icon name="refresh-cw" />
                Reset filters to view all patients
              </button>
            </div>
          )}
        </div>
      </section>
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
