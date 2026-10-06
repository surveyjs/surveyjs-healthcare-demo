import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowDown, ArrowUp, ArrowUpDown, Pill, Settings } from 'lucide-react';
import { FormId } from '../types/forms';
import { Patient, Prescription } from '../types/patient';
import { formRepository } from '../repositories/formRepository';
import { mapPrescriptionsToSurveyData } from '../repositories/surveyMapping';
import { SurveyRenderer } from '../survey/SurveyRenderer';
import {
  filterMedicationRows,
  flattenMedicationRows,
  MedicationSortKey,
  sortMedicationRows,
} from '../utils/medicationTable';

export function MedicationsPage({
  patients,
  onOpenFormBuilder,
}: {
  patients: Patient[];
  onOpenFormBuilder: (formId: FormId) => void;
}) {
  const [filters, setFilters] = useState<{
    patientName: string;
    nhsNumber: string;
    medication: string;
    status: 'All' | Prescription['status'];
  }>({ patientName: '', nhsNumber: '', medication: '', status: 'All' });
  const [sort, setSort] = useState<{ key: MedicationSortKey; direction: 'ascending' | 'descending' }>({
    key: 'patientName',
    direction: 'ascending',
  });
  const [selectedRecord, setSelectedRecord] = useState<{ patientName: string; prescription: Prescription } | null>(null);
  const [prescriptionSchema, setPrescriptionSchema] = useState(() => formRepository.getForm('prescribed-medication'));
  const rows = sortMedicationRows(filterMedicationRows(flattenMedicationRows(patients), filters), sort.key, sort.direction);

  useEffect(() => formRepository.subscribe((changedId) => {
    if (changedId === 'prescribed-medication') {
      setPrescriptionSchema(formRepository.getForm('prescribed-medication'));
    }
  }), []);

  const updateFilter = (key: 'patientName' | 'nhsNumber' | 'medication', value: string) => {
    setFilters((current) => ({ ...current, [key]: value }));
  };

  const toggleSort = (key: MedicationSortKey) => {
    setSort((current) => ({
      key,
      direction: current.key === key && current.direction === 'ascending' ? 'descending' : 'ascending',
    }));
  };

  const sortButton = (key: MedicationSortKey, label: string) => {
    const active = sort.key === key;
    const Icon = !active ? ArrowUpDown : sort.direction === 'ascending' ? ArrowUp : ArrowDown;
    return (
      <button
        type="button"
        onClick={() => toggleSort(key)}
        aria-label={`Sort by ${label}`}
        className="inline-flex items-center gap-1.5 hover:text-gray-900"
      >
        {label}
        <Icon aria-hidden="true" className="h-3.5 w-3.5" />
      </button>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Pill className="w-5 h-5 text-[#00695c]" />
            Practice Medication Overview
          </h1>
          <p className="text-sm text-gray-500">
            View active and past medication records across all registered patients.
          </p>
        </div>

        <button
          type="button"
          onClick={() => onOpenFormBuilder('add-new-prescription')}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#00695c] bg-teal-50/70 border border-teal-200 rounded-md hover:bg-teal-100/70 transition-colors"
        >
          <Settings className="w-4 h-4 text-[#00695c]" />
          <span>Customize Medication Prescription Form</span>
        </button>
      </div>

      <section aria-label="Medication filters" className="bg-white border border-gray-200 rounded-lg p-4 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
          <label className="text-xs font-semibold text-gray-600 space-y-1.5">
            Patient name
            <input
              aria-label="Filter by patient name"
              value={filters.patientName}
              onChange={(event) => updateFilter('patientName', event.target.value)}
              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm font-normal text-gray-900 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/20"
            />
          </label>
          <label className="text-xs font-semibold text-gray-600 space-y-1.5">
            NHS number
            <input
              aria-label="Filter by NHS number"
              value={filters.nhsNumber}
              onChange={(event) => updateFilter('nhsNumber', event.target.value)}
              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm font-normal text-gray-900 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/20"
            />
          </label>
          <label className="text-xs font-semibold text-gray-600 space-y-1.5">
            Medication
            <input
              aria-label="Filter by medication"
              value={filters.medication}
              onChange={(event) => updateFilter('medication', event.target.value)}
              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm font-normal text-gray-900 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/20"
            />
          </label>
          <label className="text-xs font-semibold text-gray-600 space-y-1.5">
            Status
            <select
              aria-label="Filter by status"
              value={filters.status}
              onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value as typeof current.status }))}
              className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-normal text-gray-900 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/20"
            >
              <option value="All">All statuses</option>
              <option value="Active">Active</option>
              <option value="Completed">Completed</option>
            </select>
          </label>
          <button
            type="button"
            onClick={() => setFilters({ patientName: '', nhsNumber: '', medication: '', status: 'All' })}
            className="inline-flex h-9 items-center justify-center rounded-md border border-gray-300 px-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            Clear filters
          </button>
        </div>
      </section>

      <div className="bg-white border border-gray-200 rounded-lg shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50/80 border-b border-gray-200 text-xs text-gray-500 font-semibold uppercase tracking-wider">
              <tr>
                {(['patientName', 'nhsNumber', 'medication', 'startDate', 'endDate', 'status'] as const).map((key) => {
                  const labels: Record<MedicationSortKey, string> = {
                    patientName: 'Patient',
                    nhsNumber: 'NHS number',
                    medication: 'Medication',
                    startDate: 'Start date',
                    endDate: 'End date',
                    status: 'Status',
                  };
                  return (
                    <th key={key} scope="col" aria-sort={sort.key === key ? sort.direction : 'none'} className="px-5 py-3.5">
                      {sortButton(key, labels[key])}
                    </th>
                  );
                })}
                <th scope="col" className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-sm text-gray-500">
                    No medication records match these filters.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={`${row.patientId}-${row.prescription.id}`} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-5 py-4 font-semibold text-gray-900">{row.patientName}</td>
                    <td className="px-5 py-4 text-gray-600">{row.nhsNumber}</td>
                    <td className="px-5 py-4 font-medium text-teal-900">{row.medication}</td>
                    <td className="px-5 py-4 text-gray-600">{row.startDate || 'Not recorded'}</td>
                    <td className="px-5 py-4 text-gray-600">{row.endDate || 'Ongoing'}</td>
                    <td className="px-5 py-4">
                      <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${row.status === 'Active'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-gray-100 text-gray-600 border border-gray-200'}`}>
                        {row.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right whitespace-nowrap">
                      <Link to={`/patients/${row.patientId}`} className="text-xs font-semibold text-[#00695c] hover:underline">
                        View Patient
                      </Link>
                      <button
                        type="button"
                        onClick={() => setSelectedRecord({ patientName: row.patientName, prescription: row.prescription })}
                        className="ml-4 text-xs font-semibold text-[#00695c] hover:underline"
                      >
                        View Medication Record
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedRecord && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/40 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSelectedRecord(null);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="medication-record-title"
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-6 shadow-xl"
          >
            <div className="mb-4 flex items-start justify-between gap-4 border-b border-gray-200 pb-3">
              <div>
                <h2 id="medication-record-title" className="text-lg font-bold text-gray-900">Medication Record</h2>
                <p className="text-sm text-gray-500">{selectedRecord.patientName}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRecord(null)}
                aria-label="Close medication record"
                className="rounded-md px-2 py-1 text-sm font-semibold text-gray-600 hover:bg-gray-100"
              >
                Close
              </button>
            </div>
            <SurveyRenderer
              schema={prescriptionSchema}
              initialData={mapPrescriptionsToSurveyData([selectedRecord.prescription])}
              readOnly
            />
          </section>
        </div>
      )}
    </div>
  );
}