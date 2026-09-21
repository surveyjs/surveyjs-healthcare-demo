import React, { useState, useEffect } from 'react';
import { X, Check, Settings } from 'lucide-react';
import { Patient } from '../../types/patient';
import { formRepository } from '../../repositories/formRepository';
import { patientRepository } from '../../repositories/patientRepository';
import { SurveyRenderer } from '../../survey/SurveyRenderer';
import { Model } from 'survey-core';
import { FormId } from '../../types/forms';

interface EditPatientModalProps {
  isOpen: boolean;
  patient: Patient | null;
  onClose: () => void;
  onSaved: (updatedPatient: Patient) => void;
  onOpenBuilder?: (formId: FormId) => void;
}

export const EditPatientModal: React.FC<EditPatientModalProps> = ({
  isOpen,
  patient,
  onClose,
  onSaved,
  onOpenBuilder,
}) => {
  const [surveyModel, setSurveyModel] = useState<Model | null>(null);
  const [schemaVersion, setSchemaVersion] = useState(0);

  useEffect(() => {
    const unsubscribe = formRepository.subscribe((changedId) => {
      if (changedId === 'edit-patient') {
        setSchemaVersion((v) => v + 1);
      }
    });
    return unsubscribe;
  }, []);

  if (!isOpen || !patient) return null;

  const schema = formRepository.getForm('edit-patient');
  const initialData = patientRepository.mapPatientToSurveyData(patient);

  const handleComplete = (data: Record<string, any>) => {
    try {
      const updated = patientRepository.updatePatientFromSurvey(patient.id, data);
      onSaved(updated);
      onClose();
    } catch (e) {
      console.error('Failed to update patient:', e);
    }
  };

  const handleSaveClick = () => {
    if (surveyModel) {
      // Trigger SurveyJS complete validation
      surveyModel.completeLastPage();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-2xs animate-in fade-in duration-150">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden border border-gray-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white shrink-0">
          <h2 className="text-lg font-bold text-gray-900">Edit Patient</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 rounded-md p-1 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content / Survey Form */}
        <div className="flex-1 overflow-y-auto p-6">
          <SurveyRenderer
            key={`edit-${patient.id}-${schemaVersion}`}
            schema={schema}
            initialData={initialData}
            onComplete={handleComplete}
            showNavigationButtons={false}
            onModelReady={(model) => setSurveyModel(model)}
          />

          {onOpenBuilder && (
            <div className="mt-4 pt-4 border-t border-gray-100 flex justify-end">
              <button
                type="button"
                onClick={() => onOpenBuilder('edit-patient')}
                className="inline-flex items-center gap-1.5 text-xs text-[#00695c] hover:underline"
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Customize Edit Patient Form in Builder</span>
              </button>
            </div>
          )}
        </div>

        {/* Modal Footer matching screenshot buttons */}
        <div className="flex items-center justify-between px-6 py-3.5 bg-gray-50 border-t border-gray-200 shrink-0">
          <button
            type="button"
            onClick={handleSaveClick}
            className="inline-flex items-center gap-2 bg-[#00695c] hover:bg-[#004d40] text-white text-sm font-medium px-4 py-2 rounded-md shadow-xs transition-colors cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>Save Changes</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-medium px-4 py-2 rounded-md transition-colors cursor-pointer"
          >
            <X className="w-4 h-4 text-gray-500" />
            <span>Cancel</span>
          </button>
        </div>
      </div>
    </div>
  );
};
