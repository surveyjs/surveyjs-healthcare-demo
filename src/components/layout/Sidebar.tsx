import React from 'react';
import { UserPlus, Users, User, Settings } from 'lucide-react';
import { FormId } from '../../types/forms';

interface SidebarProps {
  type: 'register' | 'manage' | 'profile';
  patientName?: string;
  onOpenFormBuilder?: (formId: FormId) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  type,
  patientName,
  onOpenFormBuilder,
}) => {
  return (
    <aside className="w-full lg:w-64 shrink-0 space-y-6">
      {type === 'register' && (
        <div className="space-y-4">
          <div className="w-12 h-12 rounded-full bg-teal-100/80 text-[#00695c] flex items-center justify-center">
            <UserPlus className="w-7 h-7" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Register Patient</h1>
            <p className="text-sm text-gray-600 leading-relaxed">
              Enter new patient details using the registration form. All required fields are marked with{' '}
              <span className="text-red-500 font-bold">*</span>.
            </p>
          </div>
        </div>
      )}

      {type === 'manage' && (
        <div className="space-y-4">
          <div className="w-12 h-12 rounded-full bg-teal-100/80 text-[#00695c] flex items-center justify-center">
            <Users className="w-7 h-7" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Manage Patients</h1>
            <p className="text-sm text-gray-600 leading-relaxed">
              Search for an existing patient using one or more criteria. Leave fields blank for broader results.
            </p>
          </div>
        </div>
      )}

      {type === 'profile' && (
        <div className="space-y-6">
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-full bg-teal-100/80 text-[#00695c] flex items-center justify-center">
              <User className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h1 className="text-xl font-extrabold text-gray-900 tracking-tight">Patient Profile</h1>
              <p className="text-base font-bold text-[#00695c]">{patientName || 'Emma Thompson'}</p>
            </div>
          </div>

          {/* Form Builder Tools Card matching screenshot (staff only) */}
          {onOpenFormBuilder && (
          <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-2xs space-y-3">
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-gray-900">Form Builder Tools</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Customize forms used to capture patient, visit and intake data.
              </p>
            </div>

            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={() => onOpenFormBuilder?.('edit-patient')}
                className="w-full inline-flex items-center gap-2 px-3 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:border-[#00695c] hover:text-[#00695c] hover:bg-teal-50/50 transition-colors text-left"
              >
                <Settings className="w-3.5 h-3.5 text-[#00695c] shrink-0" />
                <span>Customize Patient Form</span>
              </button>

              <button
                type="button"
                onClick={() => onOpenFormBuilder?.('add-new-visit')}
                className="w-full inline-flex items-center gap-2 px-3 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:border-[#00695c] hover:text-[#00695c] hover:bg-teal-50/50 transition-colors text-left"
              >
                <Settings className="w-3.5 h-3.5 text-[#00695c] shrink-0" />
                <span>Customize Visit Form</span>
              </button>

              <button
                type="button"
                onClick={() => onOpenFormBuilder?.('patient-registration')}
                className="w-full inline-flex items-center gap-2 px-3 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:border-[#00695c] hover:text-[#00695c] hover:bg-teal-50/50 transition-colors text-left"
              >
                <Settings className="w-3.5 h-3.5 text-[#00695c] shrink-0" />
                <span>Create New Intake Form</span>
              </button>
            </div>
          </div>
          )}
        </div>
      )}
    </aside>
  );
};
