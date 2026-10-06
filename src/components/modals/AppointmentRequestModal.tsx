import React, { useEffect, useMemo, useRef, useState } from 'react';
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
  const dialogRef = useRef<HTMLElement>(null);
  const onCloseRef = useRef(onClose);
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

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;

    const previouslyFocusedElement = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    const dialog = dialogRef.current;
    const getFocusableElements = (): HTMLElement[] => {
      const elements = dialog?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      const focusableElements: HTMLElement[] = [];
      elements?.forEach((element) => {
        if (element instanceof HTMLElement && element.getClientRects().length > 0) {
          focusableElements.push(element);
        }
      });
      return focusableElements;
    };

    (getFocusableElements()[0] ?? dialog)?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onCloseRef.current();
        return;
      }

      if (event.key !== 'Tab' || !dialog) return;

      const focusableElements = getFocusableElements();
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (!firstElement || !lastElement) {
        event.preventDefault();
        dialog.focus();
      } else if (event.shiftKey && (document.activeElement === firstElement || !dialog.contains(document.activeElement))) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && (document.activeElement === lastElement || !dialog.contains(document.activeElement))) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      previouslyFocusedElement?.focus();
    };
  }, [isOpen]);

  const handleComplete = async (data: Record<string, unknown>) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setError('');
    try {
      await appointmentRepository.create(patient.id, data);
      onSubmitted();
      setIsSubmitting(false);
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
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="appointment-request-title"
        tabIndex={-1}
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
            className="survey-modal"
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