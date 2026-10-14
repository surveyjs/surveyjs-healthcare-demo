import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Model } from 'survey-core';
import { OpenFormBuilder, PatientDialog, PatientDialogs } from '../components/modals/PatientDialogs';
import { SurveyRenderer } from '../survey/SurveyRenderer';
import { Patient } from '../types/patient';
import { Icon } from '../ui/Icon';
import { Button, PageHeading, useDocumentTitle } from '../ui/components';
import { formatDate } from '../ui/format';
import {
  filterMedicationRows,
  flattenMedicationRows,
  MedicationFilters,
  MedicationSortKey,
  sortMedicationRows,
} from '../utils/medicationTable';

const EMPTY_FILTERS: MedicationFilters = { patientName: '', nhsNumber: '', medication: '', status: 'All' };

const FILTER_SCHEMA = {
  showTitle: false,
  textUpdateMode: 'onTyping',
  completeText: 'Clear filters',
  elements: [
    { type: 'text', name: 'patient', title: 'Patient name', placeholder: 'First name, last name, or both', width: '25%', minWidth: '160px' },
    { type: 'text', name: 'nhs', title: 'NHS number', placeholder: 'Full or partial number', startWithNewLine: false, width: '25%', minWidth: '150px' },
    { type: 'text', name: 'medication', title: 'Medication', placeholder: 'Medication name', startWithNewLine: false, width: '25%', minWidth: '160px' },
    { type: 'dropdown', name: 'status', title: 'Status', startWithNewLine: false, width: '25%', minWidth: '160px', choices: ['Active', 'Completed'], placeholder: 'All statuses' },
  ],
};

const COLUMNS: [MedicationSortKey, string][] = [
  ['patientName', 'Patient'],
  ['nhsNumber', 'NHS number'],
  ['medication', 'Medication'],
  ['startDate', 'Start date'],
  ['endDate', 'End date'],
  ['status', 'Status'],
];

const filtersFromSurvey = (data: Record<string, any>): MedicationFilters => ({
  patientName: data.patient ?? '',
  nhsNumber: data.nhs ?? '',
  medication: data.medication ?? '',
  status: data.status ?? 'All',
});

export function MedicationsPage({
  patients,
  onOpenFormBuilder,
}: {
  patients: Patient[];
  onOpenFormBuilder: OpenFormBuilder;
}) {
  useDocumentTitle('Medication');
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [sort, setSort] = useState<{ key: MedicationSortKey; asc: boolean }>({ key: 'patientName', asc: true });
  const [dialog, setDialog] = useState<PatientDialog | null>(null);
  const rows = sortMedicationRows(
    filterMedicationRows(flattenMedicationRows(patients), filters),
    sort.key,
    sort.asc ? 'ascending' : 'descending',
  );

  return (
    <>
      <div className="page-heading-row">
        <PageHeading
          title="Practice Medication Overview"
          description="View active and past medication records across all registered patients."
          icon="clipboard"
        />
        <Button icon="settings" onClick={() => onOpenFormBuilder('add-new-prescription')}>
          Edit Medication Prescription Form
        </Button>
      </div>
      <section className="panel medication-filters">
        <SurveyRenderer
          id="medication-filters"
          schema={FILTER_SCHEMA}
          hideTitle
          configure={(model) => {
            const clear = model.navigationBar.getActionById('sv-nav-complete');
            clear.appearance = { mode: 'tertiary-surface', size: 'large', style: 'brand', showBorder: true };
          }}
          onValueChanged={(data) => setFilters(filtersFromSurvey(data))}
          onSave={(_data, model: Model) => {
            model.clear(true, false);
            setFilters(EMPTY_FILTERS);
          }}
        />
      </section>
      <section className="panel table-panel">
        <div className="table-scroll">
          <table className="medication-table">
            <thead>
              <tr>
                {COLUMNS.map(([key, label]) => {
                  const active = sort.key === key;
                  return (
                    <th key={key} scope="col" aria-sort={active ? (sort.asc ? 'ascending' : 'descending') : 'none'}>
                      <button
                        type="button"
                        aria-label={`Sort by ${label}`}
                        onClick={() => setSort({ key, asc: active ? !sort.asc : true })}
                      >
                        {' '}
                        {label} <Icon name={active ? (sort.asc ? 'arrow-up' : 'arrow-down') : 'chevron-down'} />
                      </button>
                    </th>
                  );
                })}
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody id="medication-rows">
              {rows.length ? (
                rows.map((row) => (
                  <tr key={`${row.patientId}-${row.prescription.id}`}>
                    <td>
                      <strong>
                        <Link to={`/patients/${row.patientId}`} className="patient-name">
                          {row.patientName}
                        </Link>
                      </strong>
                    </td>
                    <td className="nowrap">{row.nhsNumber}</td>
                    <td>{row.medication}</td>
                    <td className="nowrap">{formatDate(row.startDate)}</td>
                    <td className="nowrap">{row.endDate ? formatDate(row.endDate) : 'Ongoing'}</td>
                    <td>
                      <span className={`pill ${row.status === 'Completed' ? 'neutral' : ''}`}>{row.status}</span>
                    </td>
                    <td>
                      <div className="table-actions">
                        <button
                          type="button"
                          className="button secondary x-small"
                          aria-haspopup="dialog"
                          onClick={() => setDialog({ kind: 'view-medication', prescription: row.prescription })}
                        >
                          View Medication Record
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="table-empty">
                    No medication records match these filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
      <PatientDialogs dialog={dialog} onClose={() => setDialog(null)} onSaved={() => undefined} />
    </>
  );
}
