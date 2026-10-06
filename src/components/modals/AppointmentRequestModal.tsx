import React, { useEffect, useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { Patient } from '../../types/patient';
import { formRepository } from '../../repositories/formRepository';
import { appointmentRepository } from '../../repositories/appointmentRepository';
import { SurveyRenderer } from '../../survey/SurveyRenderer';

interface AppointmentRequestModalProps {
  isOpen: boolean;
  patient: Patient;
  onClose: () => void;
  onSubmitted: () => void;
}

export const AppointmentRequestModal: React.FC<AppointmentRequestModalProps> = ({
  isOpen,
  patient,
  onClose,
  onSubmitted,
}) => {
  const [schema, setSchema] = useState(() => formRepository.getForm('appointment-request'));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const initialData = useMemo(
    () => ({
      patient_name: `${patient.firstName} ${patient.lastName}`,
      date_of_birth: patient.dateOfBirth,
      nhs_number: patient.nhsNumber,
      phone_number: patient.phoneNumber,
      email: patient.email,
    }),
    [patient],
  );

  useEffect(() => formRepository.subscribe((changedId) => {
    if (changedId === 'appointment-request') {
      setSchema(formRepository.getForm('appointment-request'));
    }
  }), []);

  const handleComplete = async (data: Record<string, unknown>) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setError('');
    try {
      await appointmentRepository.create(patient.id, data);
      onSubmitted();
      onClose();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'The request could not be submitted.');
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-2xs">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="appointment-request-title"
        className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden border border-gray-200"
      >
        <header className="flex items-center justify-between px-6 py-4 border-b border-gray-200 shrink-0">
          <h2 id="appointment-request-title" className="text-lg font-bold text-gray-900">
            Request an Appointment
          </h2>
          <button
            type="button"
            aria-label="Close appointment request"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 rounded-md p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-6">
          {error && <p role="alert" className="mb-4 text-sm text-rose-700">{error}</p>}
          {isSubmitting && <p role="status" className="mb-4 text-sm text-gray-500">Submitting request…</p>}
          <SurveyRenderer
            schema={schema}
            initialData={initialData}
            onComplete={handleComplete}
            showCompletePage={false}
          />
        </div>

        <footer className="flex justify-end px-6 py-3.5 bg-gray-50 border-t border-gray-200 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-medium px-4 py-2 rounded-md"
          >
            <X className="w-4 h-4 text-gray-500" />
            Cancel
          </button>
        </footer>
      </section>
    </div>
  );
};