import React, { useState, useEffect } from 'react';
import { Header, NavTab } from './components/layout/Header';
import { RegisterPatientPage } from './pages/RegisterPatientPage';
import { ManagePatientsPage } from './pages/ManagePatientsPage';
import { PatientProfilePage } from './pages/PatientProfilePage';
import { LoginPage } from './pages/LoginPage';
import { SurveyCreatorModal } from './survey/SurveyCreatorModal';
import { ToastContainer, ToastMessage } from './components/common/Toast';
import { FormId } from './types/forms';
import { Patient } from './types/patient';
import { AuthUser } from './types/auth';
import { patientRepository } from './repositories/patientRepository';
import { authRepository } from './repositories/authRepository';
import { formRepository, FORM_METADATA_LIST } from './repositories/formRepository';
import { Pill, ShieldCheck, Settings, Users, Sparkles, Building2 } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => authRepository.getStoredUser());
  const [activeTab, setActiveTab] = useState<NavTab>('manage');
  const [selectedPatientId, setSelectedPatientId] = useState<string>('p-emma-thompson');
  const [builderFormId, setBuilderFormId] = useState<FormId | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [allPatients, setAllPatients] = useState<Patient[]>([]);

  useEffect(() => {
    const load = () => {
      patientRepository
        .getAllPatients()
        .then(setAllPatients)
        .catch((e) => console.error('Failed to load patients:', e));
    };
    load();
    return patientRepository.subscribe(load);
  }, []);

  const showToast = (type: 'success' | 'error' | 'info', title: string, message?: string) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const handlePatientCreated = (newPatient: Patient) => {
    setSelectedPatientId(newPatient.id);
    setActiveTab('profile');
    showToast(
      'success',
      'Patient Registered',
      `${newPatient.firstName} ${newPatient.lastName} has been successfully registered.`,
    );
  };

  const handleOpenProfile = (patientId: string) => {
    setSelectedPatientId(patientId);
    setActiveTab('profile');
  };

  const handleOpenFormBuilder = (formId: FormId) => {
    setBuilderFormId(formId);
  };

  const handleLogout = () => {
    authRepository.clearStoredUser();
    setCurrentUser(null);
    setActiveTab('manage');
  };

  const handleLogin = (user: AuthUser) => {
    setCurrentUser(user);
    showToast('success', 'Signed In', `Welcome, ${user.fullName}.`);
  };

  if (!currentUser) {
    return (
      <>
        <LoginPage onLogin={handleLogin} />
        <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      </>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc] text-gray-800 antialiased selection:bg-teal-100 selection:text-teal-900">
      {/* Top Application Navigation Bar matching screenshot */}
      <Header
        activeTab={activeTab}
        userName={currentUser.fullName}
        onTabChange={(tab) => {
          if (tab === 'profile') {
            setActiveTab('manage');
          } else {
            setActiveTab(tab);
          }
        }}
        onLogout={handleLogout}
      />

      {/* Main View Area */}
      <main className="flex-1">
        {activeTab === 'register' && (
          <RegisterPatientPage
            onPatientCreated={handlePatientCreated}
            onOpenFormBuilder={handleOpenFormBuilder}
          />
        )}

        {activeTab === 'manage' && (
          <ManagePatientsPage
            onOpenProfile={handleOpenProfile}
            onOpenFormBuilder={handleOpenFormBuilder}
          />
        )}

        {activeTab === 'profile' && (
          <PatientProfilePage
            patientId={selectedPatientId}
            onBackToSearch={() => setActiveTab('manage')}
            onOpenFormBuilder={handleOpenFormBuilder}
            showToast={showToast}
          />
        )}

        {activeTab === 'medications' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Pill className="w-5 h-5 text-[#00695c]" />
                  Practice Prescription Registry
                </h1>
                <p className="text-sm text-gray-500">
                  Comprehensive audit of active and completed medication courses across all registered patients.
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleOpenFormBuilder('add-new-prescription')}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#00695c] bg-teal-50/70 border border-teal-200 rounded-md hover:bg-teal-100/70 transition-colors"
              >
                <Settings className="w-4 h-4 text-[#00695c]" />
                <span>Customize Prescription Schema</span>
              </button>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50/80 border-b border-gray-200 text-xs text-gray-500 font-semibold uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-3.5">Patient</th>
                      <th className="px-6 py-3.5">Medication</th>
                      <th className="px-6 py-3.5">Dosage & Frequency</th>
                      <th className="px-6 py-3.5">Dates</th>
                      <th className="px-6 py-3.5">Status</th>
                      <th className="px-6 py-3.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {allPatients.flatMap((p) =>
                      (p.prescriptions || []).map((rx) => (
                        <tr key={rx.id} className="hover:bg-gray-50/60 transition-colors">
                          <td className="px-6 py-4 font-semibold text-gray-900">
                            {p.firstName} {p.lastName}
                            <div className="text-xs font-normal text-gray-500">NHS: {p.nhsNumber}</div>
                          </td>
                          <td className="px-6 py-4 font-medium text-teal-900">{rx.medication}</td>
                          <td className="px-6 py-4 text-gray-600">
                            {rx.dosage} • {rx.frequency}
                          </td>
                          <td className="px-6 py-4 text-xs text-gray-500">
                            {rx.startDate} → {rx.endDate || 'Ongoing'}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                                rx.status === 'Active'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-gray-100 text-gray-600 border border-gray-200'
                              }`}
                            >
                              {rx.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              type="button"
                              onClick={() => handleOpenProfile(p.id)}
                              className="text-xs font-semibold text-[#00695c] hover:underline"
                            >
                              View Profile
                            </button>
                          </td>
                        </tr>
                      )),
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-xs">
              <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-[#00695c]" />
                Inpatient & Clinical Settings
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Manage SurveyJS schema definitions, clinical practitioners, and clinic configurations.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Form Schema Management Card */}
              <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#00695c]" />
                    SurveyJS Schemas
                  </h2>
                  <span className="text-xs text-gray-500">{FORM_METADATA_LIST.length} Active Forms</span>
                </div>

                <div className="space-y-3">
                  {FORM_METADATA_LIST.map((form) => (
                    <div
                      key={form.id}
                      className="p-3.5 rounded-lg border border-gray-150 hover:border-teal-300 transition-colors flex items-center justify-between gap-4"
                    >
                      <div className="space-y-0.5">
                        <div className="text-sm font-bold text-gray-900">{form.title}</div>
                        <div className="text-xs text-gray-500 line-clamp-1">{form.description}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleOpenFormBuilder(form.id)}
                        className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-md border border-[#00695c] text-[#00695c] hover:bg-teal-50 transition-colors shrink-0"
                      >
                        <Settings className="w-3.5 h-3.5" />
                        Edit in Builder
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Clinic Roster & Data Controls */}
              <div className="space-y-6">
                <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-xs space-y-4">
                  <h2 className="text-base font-bold text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-3">
                    <Users className="w-4 h-4 text-[#00695c]" />
                    Authorized Clinical Practitioners
                  </h2>

                  <div className="space-y-3 text-sm">
                    <div className="flex items-center justify-between p-2.5 rounded-md bg-teal-50/50 border border-teal-100">
                      <div>
                        <span className="font-bold text-gray-900">Dr. Sarah Miller</span>
                        <div className="text-xs text-gray-500">General Practitioner (Current User)</div>
                      </div>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 font-semibold">
                        Logged In
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-2.5 rounded-md bg-gray-50 border border-gray-200">
                      <div>
                        <span className="font-medium text-gray-900">Dr. Smith</span>
                        <div className="text-xs text-gray-500">Cardiology & Internal Medicine</div>
                      </div>
                      <span className="text-xs text-gray-500">Active</span>
                    </div>

                    <div className="flex items-center justify-between p-2.5 rounded-md bg-gray-50 border border-gray-200">
                      <div>
                        <span className="font-medium text-gray-900">Dr. Jones</span>
                        <div className="text-xs text-gray-500">Pediatrics & Family Medicine</div>
                      </div>
                      <span className="text-xs text-gray-500">Active</span>
                    </div>

                    <div className="flex items-center justify-between p-2.5 rounded-md bg-gray-50 border border-gray-200">
                      <div>
                        <span className="font-medium text-gray-900">Dr. Williams</span>
                        <div className="text-xs text-gray-500">Pulmonology & Respiratory</div>
                      </div>
                      <span className="text-xs text-gray-500">Active</span>
                    </div>

                    <div className="flex items-center justify-between p-2.5 rounded-md bg-gray-50 border border-gray-200">
                      <div>
                        <span className="font-medium text-gray-900">Nurse James Lee</span>
                        <div className="text-xs text-gray-500">Senior Practice Nurse</div>
                      </div>
                      <span className="text-xs text-gray-500">Active</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-xs space-y-3">
                  <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    Demo State & Data Persistence
                  </h2>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Patient records, visits, prescriptions, and customized SurveyJS schemas persist in a SQLite database on the server.
                  </p>
                  <button
                    type="button"
                    onClick={async () => {
                      if (confirm('Reset demo data to initial Emma Thompson records?')) {
                        try {
                          await patientRepository.resetToInitial();
                          await Promise.all(FORM_METADATA_LIST.map((f) => formRepository.resetForm(f.id)));
                        } catch (e) {
                          console.error('Failed to reset demo data:', e);
                        }
                        setSelectedPatientId('p-emma-thompson');
                        showToast('info', 'Demo Data Reset', 'Initial sample patient records and default SurveyJS forms restored.');
                      }
                    }}
                    className="text-xs font-semibold text-rose-600 hover:text-rose-800 hover:underline cursor-pointer"
                  >
                    Reset All Demo Data to Default
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Embedded SurveyJS Form Builder Modal */}
      {builderFormId && (
        <SurveyCreatorModal
          formId={builderFormId}
          isOpen={true}
          onClose={() => setBuilderFormId(null)}
          onSaved={(formId) => {
            showToast(
              'success',
              'Schema Saved',
              `SurveyJS form for "${formRepository.getMetadata(formId)?.title}" updated. Active in app.`,
            );
          }}
        />
      )}

      {/* Floating Notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
