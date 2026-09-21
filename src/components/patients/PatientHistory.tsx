import React from 'react';
import { Pill, Clock } from 'lucide-react';
import { Visit, Prescription } from '../../types/patient';

interface PatientHistoryProps {
  visits: Visit[];
  prescriptions: Prescription[];
  onOpenVisitModal?: () => void;
  onOpenPrescriptionModal?: () => void;
}

export const PatientHistory: React.FC<PatientHistoryProps> = ({
  visits,
  prescriptions,
  onOpenVisitModal,
  onOpenPrescriptionModal,
}) => {
  // Helper to format date into Day, Month Year, Time
  const parseVisitDate = (dateStr?: string, timeStr?: string) => {
    if (!dateStr) return { day: '01', monthYear: 'Jan 2024', time: timeStr || '09:00' };

    // Check if ISO YYYY-MM-DD
    if (dateStr.includes('-')) {
      const d = new Date(dateStr);
      if (!isNaN(d.getTime())) {
        const day = String(d.getDate()).padStart(2, '0');
        const monthYear = d.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
        return { day, monthYear, time: timeStr || '09:00' };
      }
    }

    // If DD/MM/YYYY
    if (dateStr.includes('/')) {
      const parts = dateStr.split('/');
      if (parts.length === 3) {
        const d = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
        if (!isNaN(d.getTime())) {
          const day = parts[0];
          const monthYear = d.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
          return { day, monthYear, time: timeStr || '09:00' };
        }
      }
    }

    return { day: dateStr.slice(0, 2), monthYear: dateStr.slice(3), time: timeStr || '09:00' };
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left Column: Visits (Past Visits - Read Only) */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-xs flex flex-col">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 text-gray-500">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <rect width="18" height="18" x="3" y="4" rx="2" ry="2" strokeWidth="2" />
                <line x1="16" x2="16" y1="2" y2="6" strokeWidth="2" />
                <line x1="8" x2="8" y1="2" y2="6" strokeWidth="2" />
                <line x1="3" x2="21" y1="10" strokeWidth="2" />
              </svg>
            </span>
            <h2 className="text-base font-bold text-gray-900">
              Visits <span className="text-xs font-normal text-gray-500">(Past Visits - Read Only)</span>
            </h2>
          </div>
          {onOpenVisitModal && (
            <button
              type="button"
              onClick={onOpenVisitModal}
              className="text-xs font-medium text-[#00695c] hover:underline"
            >
              + Record Visit
            </button>
          )}
        </div>

        {visits.length === 0 ? (
          <div className="py-8 text-center text-sm text-gray-500">
            No clinical visits recorded yet.
          </div>
        ) : (
          <div className="space-y-4">
            {visits.map((visit) => {
              const { day, monthYear, time } = parseVisitDate(visit.visitDate, visit.visitTime);

              return (
                <div
                  key={visit.id}
                  className="flex items-start gap-4 p-3.5 rounded-lg border border-gray-150 bg-gray-50/50 hover:bg-gray-50 transition-colors"
                >
                  {/* Date Block */}
                  <div className="w-16 shrink-0 text-center bg-white border border-gray-200 rounded-md py-2 px-1 shadow-2xs">
                    <div className="text-xl font-extrabold text-gray-900 leading-none">{day}</div>
                    <div className="text-[11px] font-semibold text-gray-600 uppercase tracking-tight mt-0.5">
                      {monthYear}
                    </div>
                    <div className="text-[10px] text-gray-400 font-mono mt-0.5 flex items-center justify-center gap-0.5">
                      <Clock className="w-2.5 h-2.5 inline" />
                      {time}
                    </div>
                  </div>

                  {/* Visit Details Grid matching screenshot */}
                  <div className="flex-1 space-y-1.5 text-xs">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-gray-500 font-medium">Visit Type:</span>{' '}
                        <span className="font-semibold text-gray-800">{visit.visitType}</span>
                      </div>
                      <div>
                        <span className="text-gray-500 font-medium">Practitioner:</span>{' '}
                        <span className="font-semibold text-gray-800">{visit.practitioner}</span>
                      </div>
                    </div>

                    {visit.reasonForVisit && (
                      <div>
                        <span className="text-gray-500 font-medium">Reason:</span>{' '}
                        <span className="text-gray-800">{visit.reasonForVisit}</span>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-0.5 border-t border-gray-200/60">
                      {visit.diagnosis && (
                        <div>
                          <span className="text-gray-500 font-medium">Diagnosis:</span>{' '}
                          <span className="text-gray-800 font-medium">{visit.diagnosis}</span>
                        </div>
                      )}
                      {visit.treatmentRecommendations && (
                        <div>
                          <span className="text-gray-500 font-medium">Treatment:</span>{' '}
                          <span className="text-gray-700">{visit.treatmentRecommendations}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Right Column: Prescribed Medication (Active & Past) */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-xs flex flex-col">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Pill className="w-4 h-4 text-teal-700" />
            <h2 className="text-base font-bold text-gray-900">
              Prescribed Medication <span className="text-xs font-normal text-gray-500">(Active & Past)</span>
            </h2>
          </div>
          {onOpenPrescriptionModal && (
            <button
              type="button"
              onClick={onOpenPrescriptionModal}
              className="text-xs font-medium text-[#00695c] hover:underline"
            >
              + Add Prescription
            </button>
          )}
        </div>

        {prescriptions.length === 0 ? (
          <div className="py-8 text-center text-sm text-gray-500">
            No active or past medications prescribed.
          </div>
        ) : (
          <div className="space-y-4">
            {prescriptions.map((rx) => {
              const isActive = rx.status === 'Active';

              return (
                <div
                  key={rx.id}
                  className="flex items-start gap-4 p-4 rounded-lg border border-gray-150 bg-white shadow-2xs hover:border-teal-200 transition-colors"
                >
                  {/* Pill Icon badge */}
                  <div
                    className={`w-11 h-11 rounded-lg flex items-center justify-center shrink-0 ${
                      isActive
                        ? 'bg-teal-50 text-[#00695c] border border-teal-200'
                        : 'bg-gray-50 text-gray-500 border border-gray-200'
                    }`}
                  >
                    <Pill className="w-5 h-5 rotate-45" />
                  </div>

                  {/* Medication Specs */}
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-gray-900">{rx.medication}</h4>
                      <span
                        className={`text-[11px] px-2.5 py-0.5 rounded-full font-semibold border ${
                          isActive
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-gray-100 text-gray-600 border-gray-200'
                        }`}
                      >
                        {rx.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-600">
                      <div>
                        <span className="text-gray-500">Dosage:</span>{' '}
                        <span className="font-medium text-gray-900">{rx.dosage || '—'}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Frequency:</span>{' '}
                        <span className="font-medium text-gray-900">{rx.frequency || '—'}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Start Date:</span>{' '}
                        <span className="font-medium text-gray-900">{rx.startDate || '—'}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">End Date:</span>{' '}
                        <span className="font-medium text-gray-900">{rx.endDate || 'Ongoing'}</span>
                      </div>
                    </div>

                    {rx.instructions && (
                      <p className="text-xs text-gray-500 bg-gray-50 p-2 rounded-sm border border-gray-150">
                        {rx.instructions}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
