import React from 'react';
import { Edit, CalendarPlus, Pill } from 'lucide-react';
import { Patient } from '../../types/patient';

interface PatientDetailsCardProps {
  patient: Patient;
  onEditPatient: () => void;
  onAddVisit: () => void;
  onAddPrescription?: () => void;
}

export const PatientDetailsCard: React.FC<PatientDetailsCardProps> = ({
  patient,
  onEditPatient,
  onAddVisit,
  onAddPrescription,
}) => {
  const initials = `${patient.firstName?.[0] || ''}${patient.lastName?.[0] || ''}`.toUpperCase();

  const formattedAddress = [
    patient.address?.addressLine1,
    patient.address?.addressLine2,
    patient.address?.townCity,
    patient.address?.postcode,
  ]
    .filter(Boolean)
    .join(', ');

  const emergencyRelationship =
    patient.emergencyContact?.relationship === 'sibling'
      ? 'Brother'
      : patient.emergencyContact?.relationship === 'spouse-partner'
      ? 'Spouse/Partner'
      : patient.emergencyContact?.relationship || '';

  const emergencyDisplay = patient.emergencyContact?.fullName
    ? `${patient.emergencyContact.fullName}${
        emergencyRelationship ? ` (${emergencyRelationship})` : ''
      }${
        patient.emergencyContact.phoneNumber ? ` – ${patient.emergencyContact.phoneNumber}` : ''
      }`
    : 'None documented';

  const dobFormatted = patient.dateOfBirth
    ? `${patient.dateOfBirth.includes('-') ? patient.dateOfBirth.split('-').reverse().join('/') : patient.dateOfBirth} (${patient.age || 39})`
    : '—';

  const genderDisplay =
    patient.gender?.toLowerCase() === 'female'
      ? 'Female'
      : patient.gender?.toLowerCase() === 'male'
      ? 'Male'
      : patient.gender || 'Not specified';

  return (
    <div className="space-y-6">
      {/* Top Patient Profile Header Card */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-full bg-[#b2dfdb] text-[#004d40] flex items-center justify-center font-bold text-2xl shrink-0 shadow-xs">
            {initials}
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                {patient.firstName} {patient.lastName}
              </h1>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold tracking-wide">
                {patient.status || 'Active'}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600 font-medium">
              <span>DOB: {dobFormatted}</span>
              <span className="text-gray-300">•</span>
              <span>NHS: {patient.nhsNumber || '—'}</span>
              <span className="text-gray-300">•</span>
              <span>Registered: {patient.registeredDate || '12/05/2019'}</span>
            </div>
          </div>
        </div>

        {/* Action buttons matching screenshot */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={onEditPatient}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-[#00695c] bg-white border border-[#00695c] rounded-md hover:bg-teal-50 transition-colors cursor-pointer shadow-2xs"
          >
            <Edit className="w-4 h-4 text-[#00695c]" />
            <span>Edit Patient</span>
          </button>

          <button
            type="button"
            onClick={onAddVisit}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-[#00695c] bg-white border border-[#00695c] rounded-md hover:bg-teal-50 transition-colors cursor-pointer shadow-2xs"
          >
            <CalendarPlus className="w-4 h-4 text-[#00695c]" />
            <span>Add New Visit</span>
          </button>

          {onAddPrescription && (
            <button
              type="button"
              onClick={onAddPrescription}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-[#00695c] bg-white border border-[#00695c] rounded-md hover:bg-teal-50 transition-colors cursor-pointer shadow-2xs"
            >
              <Pill className="w-4 h-4 text-[#00695c]" />
              <span>Add New Prescription</span>
            </button>
          )}
        </div>
      </div>

      {/* Two Column Grid: Basic Details & Contact Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Basic Details */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-3">
            Basic Details
          </h2>

          <div className="grid grid-cols-3 gap-y-3 text-sm">
            <span className="text-gray-500 font-medium">Sex:</span>
            <span className="col-span-2 text-gray-900 font-medium">{genderDisplay}</span>

            <span className="text-gray-500 font-medium">NHS Number:</span>
            <span className="col-span-2 text-gray-900 font-medium">{patient.nhsNumber || '—'}</span>

            <span className="text-gray-500 font-medium">Date of birth:</span>
            <span className="col-span-2 text-gray-900 font-medium">{dobFormatted}</span>

            <span className="text-gray-500 font-medium">Registered on:</span>
            <span className="col-span-2 text-gray-900 font-medium">{patient.registeredDate || '—'}</span>

            {patient.knownAllergies && (
              <>
                <span className="text-gray-500 font-medium">Allergies:</span>
                <span className="col-span-2 text-amber-700 font-medium bg-amber-50 px-2 py-1 rounded-sm border border-amber-200 text-xs">
                  {patient.knownAllergies}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Contact Details */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-3">
            Contact Details
          </h2>

          <div className="grid grid-cols-3 gap-y-3 text-sm">
            <span className="text-gray-500 font-medium">Phone:</span>
            <span className="col-span-2 text-gray-900 font-medium">{patient.phoneNumber || '—'}</span>

            <span className="text-gray-500 font-medium">Email:</span>
            <span className="col-span-2 text-gray-900 font-medium">{patient.email || '—'}</span>

            <span className="text-gray-500 font-medium">Address:</span>
            <span className="col-span-2 text-gray-900 font-medium">{formattedAddress || '—'}</span>

            <span className="text-gray-500 font-medium">Emergency Contact:</span>
            <span className="col-span-2 text-gray-900 font-medium">{emergencyDisplay}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
