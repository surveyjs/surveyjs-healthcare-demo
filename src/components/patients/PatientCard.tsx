import React from 'react';
import { UserCheck } from 'lucide-react';
import { Patient } from '../../types/patient';

interface PatientCardProps {
  patient: Patient;
  onOpenProfile: (patientId: string) => void;
}

export const PatientCard: React.FC<PatientCardProps> = ({ patient, onOpenProfile }) => {
  const initials = `${patient.firstName?.[0] || ''}${patient.lastName?.[0] || ''}`.toUpperCase();

  const formattedAddress = [
    patient.address?.addressLine1,
    patient.address?.addressLine2,
    patient.address?.townCity,
    patient.address?.postcode,
  ]
    .filter(Boolean)
    .join(', ');

  // Format DOB display
  const dobDisplay = patient.dateOfBirth
    ? `${patient.dateOfBirth.includes('-') ? patient.dateOfBirth.split('-').reverse().join('/') : patient.dateOfBirth} (${patient.age || 39})`
    : 'Unknown';

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:border-teal-300">
      <div className="flex items-start gap-4">
        {/* Teal Initials Avatar */}
        <div className="w-14 h-14 rounded-full bg-[#b2dfdb] text-[#004d40] flex items-center justify-center font-bold text-xl shrink-0 shadow-2xs">
          {initials}
        </div>

        {/* Info cluster */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-bold text-gray-900 tracking-tight">
              {patient.firstName} {patient.lastName}
            </h3>
            {patient.status === 'Active' && (
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
                Active
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-sm text-gray-600">
            <div>
              <span className="text-gray-500">Date of birth</span>{' '}
              <span className="font-medium text-gray-800">{dobDisplay}</span>
            </div>
            <div>
              <span className="text-gray-500">NHS number</span>{' '}
              <span className="font-medium text-gray-800">{patient.nhsNumber || '—'}</span>
            </div>
            <div>
              <span className="text-gray-500">Phone</span>{' '}
              <span className="font-medium text-gray-800">{patient.phoneNumber || '—'}</span>
            </div>
            <div>
              <span className="text-gray-500">Registered</span>{' '}
              <span className="font-medium text-gray-800">{patient.registeredDate || '—'}</span>
            </div>
          </div>

          {formattedAddress && (
            <p className="text-sm text-gray-500 pt-0.5">{formattedAddress}</p>
          )}
        </div>
      </div>

      {/* Action button matching screenshot */}
      <div className="self-end md:self-center shrink-0">
        <button
          type="button"
          onClick={() => onOpenProfile(patient.id)}
          className="inline-flex items-center gap-2 bg-[#00695c] hover:bg-[#004d40] text-white text-sm font-medium px-4 py-2 rounded-md shadow-xs transition-colors cursor-pointer"
        >
          <UserCheck className="w-4 h-4" />
          <span>Open Profile</span>
        </button>
      </div>
    </div>
  );
};
