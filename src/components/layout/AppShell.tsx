import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AuthUser } from '../../types/auth';
import { cx } from '../../ui/components';
import { Icon } from '../../ui/Icon';

// The current tab is underlined with a bar sitting on the header's bottom border.
const NavItem: React.FC<{ label: string; path: string; active: boolean }> = ({ label, path, active }) => (
  <Link
    to={path}
    className="relative flex items-center text-[10px] font-semibold whitespace-nowrap text-muted-foreground hover:text-primary aria-[current=page]:text-primary aria-[current=page]:after:absolute aria-[current=page]:after:inset-x-0 aria-[current=page]:after:-bottom-px aria-[current=page]:after:h-0.75 aria-[current=page]:after:rounded-t-[3px] aria-[current=page]:after:bg-primary sm:text-xs xl:text-[13px]"
    aria-current={active ? 'page' : undefined}
  >
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
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-312 flex-wrap items-center gap-x-4.5 gap-y-1.5 px-4 pt-2.5 sm:px-5 md:px-6 lg:min-h-16 lg:flex-nowrap lg:gap-6 lg:pt-0 xl:gap-8 xl:px-8">
          <Link
            to={patientRole ? '/portal' : '/manage'}
            className="flex shrink-0 items-center gap-2 text-[11px] font-bold tracking-[0.12em] text-primary sm:gap-2.5 sm:text-xs xl:text-sm xl:tracking-[0.14em]"
          >
            <Icon name="heart" className="size-6 sm:size-7" />
            HEALTHCARE
          </Link>
          <nav
            className="order-3 flex min-h-9.5 basis-full justify-between gap-3.5 self-stretch sm:min-h-10 sm:justify-start sm:gap-7.5 lg:order-none lg:basis-auto lg:flex-1 lg:gap-5 xl:gap-6.5"
            aria-label="Primary navigation"
          >
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
            <div className="account ml-auto flex items-center gap-2.25 text-[11px] whitespace-nowrap sm:gap-3 sm:text-xs xl:gap-4">
              <strong className="font-semibold">{user.fullName}</strong>
              <button
                type="button"
                className="flex items-center gap-2 border-l border-border pl-2.25 text-muted-foreground hover:text-primary sm:pl-3 xl:pl-4"
                aria-label="Log Out"
                onClick={onLogout}
              >
                <Icon name="log-out" className="size-4.5" />
                <span className="hidden xl:inline">Log Out</span>
              </button>
            </div>
          ) : (
            <span className="ml-auto inline-flex shrink-0 items-center rounded-full border border-border px-3 py-1.25 text-xs font-semibold whitespace-nowrap text-muted-foreground">
              Local demo
            </span>
          )}
        </div>
      </header>
      <main
        className={cx(
          'mx-auto px-4 pb-26 sm:px-5 md:px-6 xl:px-8',
          user ? 'max-w-312 pt-6 md:pt-9.5' : 'max-w-162.5 pt-7.5 md:pt-13.5',
        )}
      >
        {children}
        <footer className="mt-6.5 text-right text-[10px] text-subtle-foreground sm:text-[11px]">
          Local Healthcare demo · Changes are saved in the local database
        </footer>
      </main>
    </>
  );
};
