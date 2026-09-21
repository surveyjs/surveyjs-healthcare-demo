import React, { useState, useEffect, useMemo } from 'react';
import { Sidebar } from '../components/layout/Sidebar';
import { PatientCard } from '../components/patients/PatientCard';
import { SurveyRenderer } from '../survey/SurveyRenderer';
import { formRepository } from '../repositories/formRepository';
import { patientRepository } from '../repositories/patientRepository';
import { FormId } from '../types/forms';
import { Patient } from '../types/patient';
import { Model } from 'survey-core';
import { Search, X, Settings, UserX } from 'lucide-react';

interface ManagePatientsPageProps {
  onOpenProfile: (patientId: string) => void;
  onOpenFormBuilder: (formId: FormId) => void;
}

export const ManagePatientsPage: React.FC<ManagePatientsPageProps> = ({
  onOpenProfile,
  onOpenFormBuilder,
}) => {
  const [surveyModel, setSurveyModel] = useState<Model | null>(null);
  const [schemaVersion, setSchemaVersion] = useState(0);
  const [searchResults, setSearchResults] = useState<Patient[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  // Initial load: show Emma Thompson by default or all patients
  useEffect(() => {
    const all = patientRepository.getAllPatients();
    setSearchResults(all);
    setHasSearched(true);
  }, []);

  // Subscribe to changes in patients or schema
  useEffect(() => {
    const unsubPatients = patientRepository.subscribe(() => {
      setSearchResults(patientRepository.getAllPatients());
    });

    const unsubForms = formRepository.subscribe((changedId) => {
      if (changedId === 'patient-search') {
        setSchemaVersion((v) => v + 1);
      }
    });

    return () => {
      unsubPatients();
      unsubForms();
    };
  }, []);

  const schema = formRepository.getForm('patient-search');

  // Initial data for search form matching screenshot
  const initialData = useMemo(() => {
    return {
      last_name: 'Thompson',
      date_of_birth: '1985-03-14',
      'nhs-number': '945 128 4567',
    };
  }, []);

  const handleSearchExecute = (data: Record<string, any>) => {
    const results = patientRepository.searchPatients({
      lastName: data.last_name,
      dateOfBirth: data.date_of_birth,
      nhsNumber: data['nhs-number'],
    });
    setSearchResults(results);
    setHasSearched(true);
  };

  const handleSearchClick = () => {
    if (surveyModel) {
      // Validate or get current data
      const data = surveyModel.data || {};
      handleSearchExecute(data);
    }
  };

  const handleClearClick = () => {
    if (surveyModel) {
      surveyModel.clear(false, true);
    }
    const all = patientRepository.getAllPatients();
    setSearchResults(all);
    setHasSearched(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Left Sidebar matching screenshot */}
        <Sidebar type="manage" onOpenFormBuilder={onOpenFormBuilder} />

        {/* Main Content Area */}
        <div className="flex-1 w-full space-y-6">
          {/* Search Card */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 sm:p-8 shadow-xs space-y-6">
            <h2 className="text-xl font-bold text-gray-900 border-b border-gray-100">
              Search for a Patient
            </h2>

            {/* SurveyJS Search Form */}
            <div className="survey-container">
              <SurveyRenderer
                key={`search-${schemaVersion}`}
                schema={schema}
                initialData={initialData}
                onComplete={handleSearchExecute}
                showNavigationButtons={false}
                onModelReady={(model) => setSurveyModel(model)}
              />
            </div>

            {/* Search Actions matching screenshot */}
            <div className="pt-6 border-t border-gray-150 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleSearchClick}
                  className="inline-flex items-center gap-2 bg-[#00695c] hover:bg-[#004d40] text-white text-sm font-semibold px-5 py-2.5 rounded-md shadow-xs transition-colors cursor-pointer"
                >
                  <Search className="w-4 h-4" />
                  <span>Search</span>
                </button>

                <button
                  type="button"
                  onClick={handleClearClick}
                  className="inline-flex items-center gap-1.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-medium px-4 py-2.5 rounded-md transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4 text-gray-500" />
                  <span>Clear</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => onOpenFormBuilder('patient-search')}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-[#00695c] bg-white border border-[#00695c] rounded-md hover:bg-teal-50 transition-colors cursor-pointer"
              >
                <Settings className="w-4 h-4 text-[#00695c]" />
                <span>Customize Search Form</span>
              </button>
            </div>
          </div>

          {/* Search Results Area */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-700">
                {searchResults.length === 1
                  ? '1 match found'
                  : `${searchResults.length} matches found`}
              </h3>
            </div>

            {searchResults.length === 0 ? (
              <div className="bg-white border border-gray-200 rounded-lg p-10 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-gray-100 text-gray-400 mx-auto flex items-center justify-center">
                  <UserX className="w-6 h-6" />
                </div>
                <h4 className="text-base font-semibold text-gray-800">No patients matched your search</h4>
                <p className="text-sm text-gray-500 max-w-md mx-auto">
                  Try broadening your search criteria or register a new patient using the registration form.
                </p>
                <button
                  type="button"
                  onClick={handleClearClick}
                  className="inline-flex items-center gap-1.5 text-xs text-[#00695c] font-semibold hover:underline"
                >
                  Reset filters to view all patients
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {searchResults.map((patient) => (
                  <PatientCard
                    key={patient.id}
                    patient={patient}
                    onOpenProfile={onOpenProfile}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
