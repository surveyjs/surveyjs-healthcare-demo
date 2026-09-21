import React, { useState, useEffect } from 'react';
import { Sidebar } from '../components/layout/Sidebar';
import { SurveyRenderer } from '../survey/SurveyRenderer';
import { formRepository } from '../repositories/formRepository';
import { patientRepository } from '../repositories/patientRepository';
import { FormId } from '../types/forms';
import { Patient } from '../types/patient';
import { Model } from 'survey-core';
import { Check, RotateCcw, Settings } from 'lucide-react';

interface RegisterPatientPageProps {
  onPatientCreated: (patient: Patient) => void;
  onOpenFormBuilder: (formId: FormId) => void;
}

export const RegisterPatientPage: React.FC<RegisterPatientPageProps> = ({
  onPatientCreated,
  onOpenFormBuilder,
}) => {
  const [surveyModel, setSurveyModel] = useState<Model | null>(null);
  const [schemaVersion, setSchemaVersion] = useState(0);

  // Subscribe to schema changes in formRepository
  useEffect(() => {
    const unsubscribe = formRepository.subscribe((changedId) => {
      if (changedId === 'patient-registration') {
        setSchemaVersion((v) => v + 1);
      }
    });
    return unsubscribe;
  }, []);

  const schema = formRepository.getForm('patient-registration');

  const handleComplete = (data: Record<string, any>) => {
    try {
      const newPatient = patientRepository.createPatientFromSurvey(data);
      onPatientCreated(newPatient);
    } catch (e) {
      console.error('Failed to create patient:', e);
    }
  };

  const handleSaveClick = () => {
    if (surveyModel) {
      surveyModel.completeLastPage();
    }
  };

  const handleResetClick = () => {
    if (surveyModel) {
      surveyModel.clear(false, true);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Left Sidebar matching screenshot */}
        <Sidebar type="register" onOpenFormBuilder={onOpenFormBuilder} />

        {/* Main Content Area */}
        <div className="flex-1 w-full space-y-6">
          <div className="bg-white border border-gray-200 rounded-lg p-6 sm:p-8 shadow-xs space-y-6">
            <h2 className="text-xl font-bold text-gray-900 border-b border-gray-100 pb-4">
              Patient Registration Form
            </h2>

            {/* SurveyJS Form Renderer */}
            <div className="survey-container">
              <SurveyRenderer
                key={`reg-${schemaVersion}`}
                schema={schema}
                onComplete={handleComplete}
                showNavigationButtons={false}
                onModelReady={(model) => setSurveyModel(model)}
              />
            </div>

            {/* Form Action Controls matching screenshot */}
            <div className="pt-6 border-t border-gray-150 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleSaveClick}
                  className="inline-flex items-center gap-2 bg-[#00695c] hover:bg-[#004d40] text-white text-sm font-semibold px-5 py-2.5 rounded-md shadow-xs transition-colors cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Save Patient</span>
                </button>

                <button
                  type="button"
                  onClick={handleResetClick}
                  className="inline-flex items-center gap-1.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-medium px-4 py-2.5 rounded-md transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4 text-gray-500" />
                  <span>Reset</span>
                </button>
              </div>

              {/* Right-aligned Customize Button */}
              <button
                type="button"
                onClick={() => onOpenFormBuilder('patient-registration')}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-[#00695c] bg-white border border-[#00695c] rounded-md hover:bg-teal-50 transition-colors cursor-pointer"
              >
                <Settings className="w-4 h-4 text-[#00695c]" />
                <span>Customize Registration Form</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
