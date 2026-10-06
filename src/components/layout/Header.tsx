import React from 'react';
import { Link } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { UserRole } from '../../types/auth';

export type NavTab = 'register' | 'manage' | 'profile' | 'medications' | 'settings';

interface HeaderProps {
  activeTab: NavTab;
  userName: string;
  role?: UserRole;
  onLogout?: () => void;
}

const ACTIVE_CLASSES =
  'text-[#006b5c] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-[#006b5c]';

const navLinkClass = (isActive: boolean, inactiveClasses: string) =>
  `relative flex h-8 shrink-0 items-center whitespace-nowrap text-sm font-semibold transition-colors sm:h-14 ${
    isActive ? ACTIVE_CLASSES : inactiveClasses
  }`;

export const Header: React.FC<HeaderProps> = ({ activeTab, userName, role = 'doctor', onLogout }) => {
  const patientProfileIsActive = role === 'patient' && activeTab === 'profile';

  return (
    <header className="sticky top-0 z-30 w-full border-b border-gray-200 bg-white">
      <div className="mx-auto flex min-h-14 max-w-[1220px] flex-wrap items-center gap-x-5 gap-y-2 px-4 py-3 sm:flex-nowrap sm:px-8 sm:py-0">
        <Link
          to={role === 'patient' ? '/my-profile' : '/manage'}
          aria-label="Healthcare home"
          className="order-1 block h-6 w-[139px] shrink-0"
        >
          <img alt="" aria-hidden="true" className="block h-6 w-[139px]" src="/healthcare-logo.svg" />
        </Link>

        <div aria-hidden="true" className="hidden h-5 w-px shrink-0 bg-[#d0d5dd] sm:block" />

        <nav
          aria-label="Primary navigation"
          className="order-3 flex h-8 min-w-0 w-full items-center gap-5 overflow-x-auto sm:order-2 sm:h-14 sm:w-auto sm:flex-1"
        >
          {role === 'patient' ? (
            <Link
              to="/my-profile"
              aria-current={patientProfileIsActive ? 'page' : undefined}
              className={navLinkClass(patientProfileIsActive, 'text-[#98a1af] hover:text-[#475567]')}
            >
              My Profile
            </Link>
          ) : (
            <>
              <Link
                to="/register"
                aria-current={activeTab === 'register' ? 'page' : undefined}
                className={navLinkClass(activeTab === 'register', 'text-[#98a1af] hover:text-[#475567]')}
              >
                Register Patient
              </Link>

              <Link
                to="/manage"
                aria-current={activeTab === 'manage' || activeTab === 'profile' ? 'page' : undefined}
                className={navLinkClass(
                  activeTab === 'manage' || activeTab === 'profile',
                  'text-[#98a1af] hover:text-[#475567]',
                )}
              >
                Manage Patients
              </Link>

              <Link
                to="/medications"
                aria-current={activeTab === 'medications' ? 'page' : undefined}
                className={navLinkClass(activeTab === 'medications', 'text-[#98a1af] hover:text-[#475567]')}
              >
                Medication
              </Link>

              <Link
                to="/settings"
                aria-current={activeTab === 'settings' ? 'page' : undefined}
                className={navLinkClass(activeTab === 'settings', 'text-[#98a1af] hover:text-[#475567]')}
              >
                Inpatient Settings
              </Link>
            </>
          )}
        </nav>

        <div className="order-2 ml-auto flex shrink-0 items-center gap-2 text-sm font-semibold sm:order-3 sm:gap-5">
          <div className="flex items-center gap-2 whitespace-nowrap leading-5">
            <span className="hidden text-[#98a1af] md:inline">Logged as:</span>
            <span className="text-xs text-[#475567] sm:text-sm">{userName}</span>
          </div>
          <div aria-hidden="true" className="hidden h-5 w-px shrink-0 bg-[#d0d5dd] sm:block" />
          <button
            type="button"
            onClick={onLogout}
            aria-label="Log Out"
            title="Log Out"
            className="flex items-center gap-1 text-sm font-semibold text-[#475567] transition-colors hover:text-[#006b5c]"
          >
            <LogOut aria-hidden="true" className="h-[18px] w-[18px]" />
            <span className="hidden sm:inline">Log Out</span>
          </button>
        </div>
      </div>
    </header>
  );
};
