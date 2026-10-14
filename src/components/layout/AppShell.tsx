import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AuthUser } from '../../types/auth';
import { Icon } from '../../ui/Icon';

const NavItem: React.FC<{ label: string; path: string; active: boolean }> = ({ label, path, active }) => (
  <Link to={path} className={active ? 'active' : ''} aria-current={active ? 'page' : undefined}>
    {label}
  </Link>
);

interface AppShellProps {
  user: AuthUser | null;
  onLogout?: () => void;
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ user, onLogout, children }) => {
  const { pathname } = useLocation();
  const patientRole = user?.role === 'patient';
  const at = (path: string) => pathname === path || pathname.startsWith(path + '/');

  return (
    <>
      <header className="topbar">
        <div className="topbar-inner">
          <Link to={patientRole ? '/portal' : '/manage'} className="brand">
            <Icon name="heart" />
            HEALTHCARE
          </Link>
          <nav className="main-nav" aria-label="Primary navigation">
            {!user ? null : patientRole ? (
              <>
                <NavItem label="Patient Portal" path="/portal" active={at('/portal')} />
                <NavItem label="Request Appointment" path="/appointments/new" active={at('/appointments/new')} />
              </>
            ) : (
              <>
                <NavItem label="Manage Patients" path="/manage" active={at('/manage') || at('/patients')} />
                <NavItem label="Register Patient" path="/register" active={at('/register')} />
                <NavItem label="Medication" path="/medications" active={at('/medications')} />
                <NavItem label="Inpatient Settings" path="/settings" active={at('/settings')} />
              </>
            )}
          </nav>
          {user ? (
            <div className="account">
              <strong>{user.fullName}</strong>
              <button type="button" className="logout" aria-label="Log Out" onClick={onLogout}>
                <Icon name="log-out" />
                <span>Log Out</span>
              </button>
            </div>
          ) : (
            <span className="local-badge">Local demo</span>
          )}
        </div>
      </header>
      <main className={`page ${user ? '' : 'login-page'}`}>
        {children}
        <footer className="preview-note">Local Healthcare demo · Changes are saved in the local database</footer>
      </main>
    </>
  );
};
