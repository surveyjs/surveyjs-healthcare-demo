import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Model } from 'survey-core';
import { OpenFormBuilder, PatientDialog, PatientDialogs } from '../components/modals/PatientDialogs';
import { SurveyRenderer } from '../survey/SurveyRenderer';
import { Patient } from '../types/patient';
import { Icon } from '../ui/Icon';
import { Button, cx, PageHeading, panelClass, Pill, useDocumentTitle } from '../ui/components';
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

// Cell styling lives on the table so every header and data cell stays uniform.
const TABLE_CLASS = cx(
  'w-full border-collapse text-left text-xs max-md:min-w-235',
  '[&_th]:border-b [&_th]:border-border [&_th]:bg-card-subtle [&_th]:px-3.5 [&_th]:py-4.25 [&_th]:font-semibold [&_th]:whitespace-nowrap [&_th]:text-muted-foreground xl:[&_th]:px-4.5',
  '[&_td]:border-b [&_td]:border-border-subtle [&_td]:px-3.5 [&_td]:py-4.5 [&_td]:align-middle xl:[&_td]:px-4.5 [&_tr:last-child>td]:border-b-0',
);

const filtersFromSurvey =(data: Record<string, any>): MedicationFilters => ({
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
      <PageHeading
        title="Practice Medication Overview"
        description="View active and past medication records across all registered patients."
        icon="clipboard"
        action={
          <Button
            icon="settings"
            size="sm"
            className="self-start max-md:w-full max-md:whitespace-normal md:ml-16.5 xl:mt-1 xl:ml-0"
            onClick={() => onOpenFormBuilder('add-new-prescription')}
          >
            Edit Medication Prescription Form
          </Button>
        }
      />
      <section className={cx(panelClass, 'mb-6')}>
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
      <section className={panelClass}>
        <div className="overflow-x-auto">
          <table className={TABLE_CLASS}>
            <thead>
              <tr>
                {COLUMNS.map(([key, label]) => {
                  const active = sort.key === key;
                  return (
                    <th key={key} scope="col" aria-sort={active ? (sort.asc ? 'ascending' : 'descending') : 'none'}>
                      <button
                        type="button"
                        className="flex items-center gap-2"
                        aria-label={`Sort by ${label}`}
                        onClick={() => setSort({ key, asc: active ? !sort.asc : true })}
                      >
                        {' '}
                        {label}{' '}
                        <Icon
                          name={active ? (sort.asc ? 'arrow-up' : 'arrow-down') : 'chevron-down'}
                          className={cx('size-3.5', active ? 'text-primary' : 'text-muted-foreground')}
                        />
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
                  <tr key={`${row.patientId}-${row.prescription.id}`} className="hover:bg-card-hover">
                    <td className="min-w-32.5">
                      <strong>
                        <Link
                          to={`/patients/${row.patientId}`}
                          className="text-primary underline underline-offset-3 wrap-anywhere hover:text-primary-hover"
                        >
                          {row.patientName}
                        </Link>
                      </strong>
                    </td>
                    <td className="whitespace-nowrap">{row.nhsNumber}</td>
                    <td className="min-w-42.5">{row.medication}</td>
                    <td className="whitespace-nowrap">{formatDate(row.startDate)}</td>
                    <td className="whitespace-nowrap">{row.endDate ? formatDate(row.endDate) : 'Ongoing'}</td>
                    <td>
                      <Pill tone={row.status === 'Completed' ? 'neutral' : 'brand'}>{row.status}</Pill>
                    </td>
                    <td className="min-w-45">
                      <Button
                        size="xs"
                        aria-haspopup="dialog"
                        onClick={() => setDialog({ kind: 'view-medication', prescription: row.prescription })}
                      >
                        View Medication Record
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="h-30 text-center text-muted-foreground">
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
