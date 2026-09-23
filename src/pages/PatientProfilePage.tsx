import React, { useState, useEffect } from 'react';
import { Sidebar } from '../components/layout/Sidebar';
import { PatientDetailsCard } from '../components/patients/PatientDetailsCard';
import { PatientHistory } from '../components/patients/PatientHistory';
import { EditPatientModal } from '../components/modals/EditPatientModal';
import { AddVisitModal } from '../components/modals/AddVisitModal';
import { AddPrescriptionModal } from '../components/modals/AddPrescriptionModal';
import { patientRepository } from '../repositories/patientRepository';
import { Patient } from '../types/patient';
import { FormId } from '../types/forms';
import { ArrowLeft } from 'lucide-react';

interface PatientProfilePageProps {
  patientId: string;
  onBackToSearch: () => void;
  onOpenFormBuilder: (formId: FormId) => void;
  showToast: (type: 'success' | 'error' | 'info', title: string, message?: string) => void;
}

export const PatientProfilePage: React.FC<PatientProfilePageProps> = ({
  patientId,
  onBackToSearch,
  onOpenFormBuilder,
  showToast,
}) => {
  const [patient, setPatient] = useState<Patient | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isVisitModalOpen, setIsVisitModalOpen] = useState(false);
  const [isPrescriptionModalOpen, setIsPrescriptionModalOpen] = useState(false);

  // Load patient from the database
  useEffect(() => {
    let cancelled = false;
    patientRepository
      .getPatientById(patientId)
      .then((loaded) => {
        if (!cancelled && loaded) {
          setPatient(loaded);
        }
      })
      .catch((e) => console.error('Failed to load patient:', e));
    return () => {
      cancelled = true;
    };
  }, [patientId]);

  // Subscribe to changes in patientRepository
  useEffect(() => {
    const unsubscribe = patientRepository.subscribe(() => {
      patientRepository
        .getPatientById(patientId)
        .then((updated) => {
          if (updated) {
            setPatient(updated);
          }
        })
        .catch((e) => console.error('Failed to reload patient:', e));
    });
    return unsubscribe;
  }, [patientId]);

  if (!patient) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center">
        <p className="text-gray-500 mb-4">Patient record not found.</p>
        <button
          type="button"
          onClick={onBackToSearch}
          className="inline-flex items-center gap-2 text-sm font-semibold text-[#00695c] hover:underline"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Manage Patients
        </button>
      </div>
    );
  }

  const patientFullName = `${patient.firstName} ${patient.lastName}`;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Left Sidebar matching screenshot */}
        <Sidebar
          type="profile"
          patientName={patientFullName}
          onOpenFormBuilder={onOpenFormBuilder}
        />

        {/* Main Profile Layout */}
        <div className="flex-1 w-full space-y-6">
          {/* Top Patient Profile Header & Details */}
          <PatientDetailsCard
            patient={patient}
            onEditPatient={() => setIsEditModalOpen(true)}
            onAddVisit={() => setIsVisitModalOpen(true)}
            onAddPrescription={() => setIsPrescriptionModalOpen(true)}
          />

          {/* Clinical Visits & Medication History */}
          <PatientHistory
            visits={patient.visits || []}
            prescriptions={patient.prescriptions || []}
            onOpenVisitModal={() => setIsVisitModalOpen(true)}
            onOpenPrescriptionModal={() => setIsPrescriptionModalOpen(true)}
          />
        </div>
      </div>

      {/* Edit Patient Modal */}
      <EditPatientModal
        isOpen={isEditModalOpen}
        patient={patient}
        onClose={() => setIsEditModalOpen(false)}
        onSaved={(updated) => {
          setPatient(updated);
          showToast('success', 'Patient updated', 'Patient details successfully saved.');
        }}
        onOpenBuilder={(formId) => {
          setIsEditModalOpen(false);
          onOpenFormBuilder(formId);
        }}
      />

      {/* Add New Visit Modal */}
      <AddVisitModal
        isOpen={isVisitModalOpen}
        patient={patient}
        onClose={() => setIsVisitModalOpen(false)}
        onSaved={(updated) => {
          setPatient(updated);
          showToast('success', 'Visit recorded', 'Clinical encounter added to patient history.');
        }}
        onOpenBuilder={(formId) => {
          setIsVisitModalOpen(false);
          onOpenFormBuilder(formId);
        }}
      />

      {/* Add New Prescription Modal */}
      <AddPrescriptionModal
        isOpen={isPrescriptionModalOpen}
        patient={patient}
        onClose={() => setIsPrescriptionModalOpen(false)}
        onSaved={(updated) => {
          setPatient(updated);
          showToast('success', 'Prescription added', 'Medication course added to patient profile.');
        }}
        onOpenBuilder={(formId) => {
          setIsPrescriptionModalOpen(false);
          onOpenFormBuilder(formId);
        }}
      />
    </div>
  );
};
