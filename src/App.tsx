import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route, Navigate, useNavigate, useParams, useLocation } from 'react-router-dom';
import { Header, NavTab } from './components/layout/Header';
import { RegisterPatientPage } from './pages/RegisterPatientPage';
import { ManagePatientsPage } from './pages/ManagePatientsPage';
import { MedicationsPage } from './pages/MedicationsPage';
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
import { ShieldCheck, Settings, Users, Sparkles, Building2, RefreshCw } from 'lucide-react';
import { appointmentRepository } from './repositories/appointmentRepository';
import { AppointmentRequest } from './types/appointmentRequest';

type ShowToast = (type: 'success' | 'error' | 'info', title: string, message?: string) => void;

/** Staff patient profile at /patients/:patientId. */
function PatientProfileRoute({
  onOpenFormBuilder,
  showToast,
}: {
  onOpenFormBuilder: (formId: FormId, onReturn?: () => void) => void;
  showToast: ShowToast;
}) {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  return (
    <PatientProfilePage
      patientId={patientId!}
      onBackToSearch={() => navigate('/manage')}
      onOpenFormBuilder={onOpenFormBuilder}
      showToast={showToast}
    />
  );
}

/** Maps the current URL to the highlighted header tab. */
function tabForPath(pathname: string): NavTab {
  if (pathname.startsWith('/register')) return 'register';
  if (pathname.startsWith('/patients')) return 'profile';
  if (pathname.startsWith('/medications')) return 'medications';
  if (pathname.startsWith('/settings')) return 'settings';
  return 'manage';
}

function AppointmentRequestsPanel() {
  const [requests, setRequests] = useState<AppointmentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadRequests = async () => {
    setLoading(true);
    try {
      setRequests(await appointmentRepository.getAll());
      setError('');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Requests could not be loaded.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadRequests();
  }, []);

  return (
    <section className="bg-white border border-gray-200 rounded-lg p-6 shadow-xs space-y-4">
      <div className="flex items-center justify-between border-b border-gray-200 pb-3">
        <div>
          <h2 className="text-base font-bold text-gray-900">Appointment Requests</h2>
          <p className="text-xs text-gray-500 mt-1">Requests submitted through the patient portal.</p>
        </div>
        <button
          type="button"
          aria-label="Refresh appointment requests"
          onClick={() => void loadRequests()}
          className="p-2 text-gray-500 hover:text-gray-900 rounded-md"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>
      {loading ? (
        <p role="status" className="text-sm text-gray-500">Loading requests…</p>
      ) : error ? (
        <p role="alert" className="text-sm text-rose-700">{error}</p>
      ) : requests.length === 0 ? (
        <p className="text-sm text-gray-500">No appointment requests yet.</p>
      ) : (
        <div className="divide-y divide-gray-100">
          {requests.map((request) => (
            <article key={request.id} className="py-4 first:pt-0 last:pb-0">
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <h3 className="text-sm font-semibold text-gray-900">{request.patientName}</h3>
                <time className="text-xs text-gray-500">{request.createdAt}</time>
              </div>
              <dl className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 text-xs">
                {Object.entries(request.requestData)
                  .filter(([, value]) => value !== '' && value !== null && value !== undefined)
                  .map(([key, value]) => (
                    <div key={key} className="min-w-0">
                      <dt className="inline font-medium text-gray-500">
                        {key.replace(/[_-]+/g, ' ')}:{' '}
                      </dt>
                      <dd className="inline break-words text-gray-800">
                        {Array.isArray(value) ? value.join(', ') : String(value)}
                      </dd>
                    </div>
                  ))}
              </dl>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => authRepository.getStoredUser());
  const [builderFormId, setBuilderFormId] = useState<FormId | null>(null);
  // Restores the view (e.g. reopens a modal) the form builder was opened from after "Save & Apply Form"
  const builderReturnRef = useRef<(() => void) | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [allPatients, setAllPatients] = useState<Patient[]>([]);

  useEffect(() => {
    // Patients only see their own record; skip loading the full registry
    if (currentUser?.role !== 'doctor') return;
    const load = () => {
      patientRepository
        .getAllPatients()
        .then(setAllPatients)
        .catch((e) => console.error('Failed to load patients:', e));
    };
    load();
    return patientRepository.subscribe(load);
  }, [currentUser?.role]);

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
    navigate(`/patients/${newPatient.id}`);
    showToast(
      'success',
      'Patient Registered',
      `${newPatient.firstName} ${newPatient.lastName} has been successfully registered.`,
    );
  };

  const handleOpenProfile = (patientId: string) => {
    navigate(`/patients/${patientId}`);
  };

  const handleOpenFormBuilder = (formId: FormId, onReturn?: () => void) => {
    builderReturnRef.current = onReturn ?? null;
    setBuilderFormId(formId);
  };

  const handleLogout = () => {
    authRepository.clearStoredUser();
    setCurrentUser(null);
  };

  const handleLogin = (user: AuthUser) => {
    setCurrentUser(user);
    showToast('success', 'Signed In', `Welcome, ${user.fullName}.`);
    navigate(user.role === 'patient' ? '/my-profile' : '/manage', { replace: true });
  };

  if (!currentUser) {
    return (
      <>
        <Routes>
          <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
        <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      </>
    );
  }

  // Patient portal: own profile only — no registry, no form builder, no prescribing
  if (currentUser.role === 'patient') {
    return (
      <div className="min-h-screen flex flex-col bg-[#f8fafc] text-gray-800 antialiased selection:bg-teal-100 selection:text-teal-900">
        <Header
          activeTab="profile"
          role="patient"
          userName={currentUser.fullName}
          onLogout={handleLogout}
        />

        <main className="flex-1">
          <Routes>
            <Route
              path="/my-profile"
              element={
                currentUser.patientId ? (
                  <PatientProfilePage
                    patientId={currentUser.patientId}
                    viewerRole="patient"
                    showToast={showToast}
                  />
                ) : (
                  <div className="max-w-7xl mx-auto px-4 py-12 text-center text-gray-500">
                    No patient record is linked to your account. Please contact the practice.
                  </div>
                )
              }
            />
            <Route path="*" element={<Navigate to="/my-profile" replace />} />
          </Routes>
        </main>

        <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      </div>
    );
  }

  const activeTab = tabForPath(location.pathname);

  const settingsView = (
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
                <div className="flex items-center justify-between border-b border-gray-200 pb-3">
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
                      className="p-3.5 rounded-lg border border-gray-200 hover:border-gray-400 transition-colors flex items-center justify-between gap-4"
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
                  <h2 className="text-base font-bold text-gray-900 flex items-center gap-2 border-b border-gray-200 pb-3">
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

            <AppointmentRequestsPanel />
          </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc] text-gray-800 antialiased selection:bg-teal-100 selection:text-teal-900">
      {/* Top Application Navigation Bar matching screenshot */}
      <Header activeTab={activeTab} userName={currentUser.fullName} onLogout={handleLogout} />

      {/* Main View Area */}
      <main className="flex-1">
        <Routes>
          <Route
            path="/register"
            element={
              <RegisterPatientPage
                onPatientCreated={handlePatientCreated}
                onOpenFormBuilder={handleOpenFormBuilder}
              />
            }
          />
          <Route
            path="/manage"
            element={
              <ManagePatientsPage
                onOpenProfile={handleOpenProfile}
                onOpenFormBuilder={handleOpenFormBuilder}
              />
            }
          />
          <Route
            path="/patients/:patientId"
            element={
              <PatientProfileRoute onOpenFormBuilder={handleOpenFormBuilder} showToast={showToast} />
            }
          />
          <Route
            path="/medications"
            element={
              <MedicationsPage
                patients={allPatients}
                onOpenFormBuilder={handleOpenFormBuilder}
              />
            }
          />
          <Route path="/settings" element={settingsView} />
          <Route path="*" element={<Navigate to="/manage" replace />} />
        </Routes>
      </main>

      {/* Embedded SurveyJS Form Builder Modal */}
      {builderFormId && (
        <SurveyCreatorModal
          formId={builderFormId}
          isOpen={true}
          onClose={() => {
            builderReturnRef.current = null;
            setBuilderFormId(null);
          }}
          onApplied={() => {
            setBuilderFormId(null);
            const restoreView = builderReturnRef.current;
            builderReturnRef.current = null;
            restoreView?.();
          }}
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
