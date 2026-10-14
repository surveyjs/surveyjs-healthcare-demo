import React, { useEffect, useRef, useState } from 'react';
import { Navigate, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import { Toast } from './components/common/Toast';
import { LoginPage } from './pages/LoginPage';
import { ManagePatientsPage } from './pages/ManagePatientsPage';
import { MedicationsPage } from './pages/MedicationsPage';
import { PatientProfilePage } from './pages/PatientProfilePage';
import { AppointmentRequestPage, PatientPortalPage } from './pages/PatientPortalPage';
import { RegisterPatientPage } from './pages/RegisterPatientPage';
import { SettingsPage } from './pages/SettingsPage';
import { SurveyCreatorModal } from './survey/SurveyCreatorModal';
import { authRepository } from './repositories/authRepository';
import { patientRepository } from './repositories/patientRepository';
import { AuthUser } from './types/auth';
import { FormId } from './types/forms';
import { Patient } from './types/patient';

type OpenFormBuilder = (formId: FormId, onReturn?: () => void) => void;

/** Staff patient profile at /patients/:patientId. */
function PatientProfileRoute(props: { onOpenFormBuilder: OpenFormBuilder; showToast: (message: string) => void }) {
  const { patientId } = useParams<{ patientId: string }>();
  return <PatientProfilePage key={patientId} patientId={patientId!} {...props} />;
}

export default function App() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => authRepository.getStoredUser());
  const [builderFormId, setBuilderFormId] = useState<FormId | null>(null);
  // Restores the view (e.g. reopens a dialog) the form builder was opened from after "Save & Apply Form"
  const builderReturnRef = useRef<(() => void) | null>(null);
  const [toast, setToast] = useState({ message: '', visible: false });
  const toastTimer = useRef<ReturnType<typeof setTimeout>>();
  const [allPatients, setAllPatients] = useState<Patient[]>([]);

  useEffect(() => {
    // Patients only see their own record; skip loading the full registry
    if (currentUser?.role !== 'doctor') return;
    const load = () =>
      patientRepository
        .getAllPatients()
        .then(setAllPatients)
        .catch((e) => console.error('Failed to load patients:', e));
    load();
    return patientRepository.subscribe(load);
  }, [currentUser?.role]);

  const showToast = (message: string) => {
    setToast({ message, visible: true });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast((current) => ({ ...current, visible: false })), 3300);
  };

  const openFormBuilder: OpenFormBuilder = (formId, onReturn) => {
    builderReturnRef.current = onReturn ?? null;
    setBuilderFormId(formId);
  };

  const handleLogin = (user: AuthUser) => {
    setCurrentUser(user);
    navigate(user.role === 'patient' ? '/portal' : '/manage', { replace: true });
  };

  const handleLogout = () => {
    authRepository.clearStoredUser();
    setCurrentUser(null);
    navigate('/login');
  };

  let routes: React.ReactNode;
  if (!currentUser) {
    routes = (
      <Routes>
        <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  } else if (currentUser.role === 'patient') {
    // Patient portal: own record only — no registry, no form builder, no prescribing
    routes = (
      <Routes>
        <Route path="/portal" element={<PatientPortalPage patientId={currentUser.patientId} />} />
        <Route
          path="/appointments/new"
          element={<AppointmentRequestPage patientId={currentUser.patientId} showToast={showToast} />}
        />
        <Route path="*" element={<Navigate to="/portal" replace />} />
      </Routes>
    );
  } else {
    routes = (
      <Routes>
        <Route
          path="/manage"
          element={<ManagePatientsPage onOpenFormBuilder={openFormBuilder} showToast={showToast} />}
        />
        <Route
          path="/register"
          element={
            <RegisterPatientPage
              onOpenFormBuilder={openFormBuilder}
              onPatientCreated={(patient) => {
                navigate(`/patients/${patient.id}`);
                showToast('Patient saved.');
              }}
            />
          }
        />
        <Route
          path="/patients/:patientId"
          element={<PatientProfileRoute onOpenFormBuilder={openFormBuilder} showToast={showToast} />}
        />
        <Route
          path="/medications"
          element={<MedicationsPage patients={allPatients} onOpenFormBuilder={openFormBuilder} />}
        />
        <Route
          path="/settings"
          element={<SettingsPage currentUser={currentUser} onOpenFormBuilder={openFormBuilder} showToast={showToast} />}
        />
        <Route path="*" element={<Navigate to="/manage" replace />} />
      </Routes>
    );
  }

  return (
    <>
      <AppShell user={currentUser} onLogout={handleLogout}>
        {routes}
      </AppShell>
      <Toast message={toast.message} visible={toast.visible} />
      {currentUser?.role === 'doctor' && builderFormId && (
        <SurveyCreatorModal
          key={builderFormId}
          formId={builderFormId}
          onClose={() => {
            builderReturnRef.current = null;
            setBuilderFormId(null);
          }}
          onApplied={() => {
            setBuilderFormId(null);
            const restoreView = builderReturnRef.current;
            builderReturnRef.current = null;
            showToast('Form saved.');
            restoreView?.();
          }}
        />
      )}
    </>
  );
}
