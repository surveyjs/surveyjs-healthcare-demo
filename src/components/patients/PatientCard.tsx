import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { Patient } from '../../types/patient';
import { buttonClass } from '../../ui/components';
import { Icon } from '../../ui/Icon';
import { dateOfBirthWithAge, formatDate, fullName, initials, patientAddress } from '../../ui/format';

interface PatientCardProps {
  patient: Patient;
  onRecordVisit: (patient: Patient) => void;
  onAddPrescription: (patient: Patient) => void;
  onEditPatient: (patient: Patient) => void;
}

const MENU_ITEM_CLASS =
  'flex min-h-10 w-full items-center gap-2 rounded px-2.5 py-2 text-left text-[13px] text-primary hover:bg-primary-soft';

// Patient actions stay in the results list, with profile navigation on the name.
export const PatientCard: React.FC<PatientCardProps> = ({ patient, onRecordVisit, onAddPrescription, onEditPatient }) => {
  const menuRef = useRef<HTMLDetailsElement>(null);
  const name = fullName(patient);
  const profilePath = `/patients/${patient.id}`;

  // Menu items return focus to the menu button so the dialog restores it on close.
  const fromMenu = (action: (patient: Patient) => void) => () => {
    const menu = menuRef.current;
    if (menu) {
      menu.open = false;
      menu.querySelector('summary')?.focus({ preventScroll: true });
    }
    action(patient);
  };

  return (
    <article className="patient-card relative grid items-center gap-3.5 rounded-card border border-border bg-card p-5 sm:grid-cols-[48px_minmax(0,1fr)] sm:gap-5 sm:p-5.5 md:p-6 lg:grid-cols-[48px_minmax(0,1fr)_auto]">
      <span
        className="hidden size-12 items-center justify-center self-start rounded-full bg-primary-soft text-base font-semibold text-primary sm:flex lg:self-center"
        aria-hidden="true"
      >
        {initials(name)}
      </span>
      <div className="min-w-0">
        <h3 className="mb-2 pr-10 text-base leading-normal font-semibold tracking-tight sm:pr-0 md:text-[17px]">
          <Link
            to={profilePath}
            className="text-primary underline underline-offset-3 wrap-anywhere hover:text-primary-hover"
            aria-label={`Open Profile: ${name}`}
          >
            {name}
          </Link>
        </h3>
        <div className="flex flex-col gap-1.5 text-xs tabular-nums sm:max-w-127.5 sm:flex-row sm:flex-wrap sm:gap-x-4.5 sm:text-[13px] lg:max-w-none xl:gap-x-5.5">
          {(
            [
              ['Date of birth', dateOfBirthWithAge(patient)],
              ['NHS number', patient.nhsNumber],
              ['Phone', patient.phoneNumber],
              ['Registered', formatDate(patient.registeredDate)],
            ] as const
          ).map(([label, value]) => (
            <span key={label} className="lg:whitespace-nowrap">
              <span className="mr-1 text-muted-foreground">{label}</span> {value}
            </span>
          ))}
        </div>
        <p className="mt-2.25 text-xs leading-[1.7] text-muted-foreground sm:text-[13px]">{patientAddress(patient)}</p>
      </div>
      <div className="flex items-stretch gap-2 border-t border-border pt-3.5 sm:col-start-2 sm:items-center sm:border-0 sm:pt-0 lg:col-start-auto">
        <button
          type="button"
          className={buttonClass('primary', 'sm', 'max-sm:min-h-11 max-sm:min-w-0 max-sm:flex-1 max-sm:whitespace-normal')}
          aria-label={`Record Visit: ${name}`}
          aria-haspopup="dialog"
          onClick={() => onRecordVisit(patient)}
        >
          <Icon name="calendar" />
          Record Visit
        </button>
        <details className="patient-menu group absolute top-4.5 right-4.5 shrink-0 open:z-20 sm:relative sm:top-auto sm:right-auto" ref={menuRef}>
          <summary
            className="flex size-10 list-none items-center justify-center rounded-md border border-input bg-card text-primary group-open:border-border-hover group-open:bg-primary-soft hover:border-border-hover hover:bg-primary-soft [&::-webkit-details-marker]:hidden"
            aria-label={`More actions: ${name}`}
          >
            <Icon name="more-horizontal" />
          </summary>
          <div className="absolute top-[calc(100%+8px)] right-0 w-45 rounded-lg border border-border bg-card p-1.5 shadow-menu sm:w-47.5">
            <button
              type="button"
              className={MENU_ITEM_CLASS}
              aria-label={`Add Prescription: ${name}`}
              aria-haspopup="dialog"
              onClick={fromMenu(onAddPrescription)}
            >
              <Icon name="file-plus" className="size-4.25" />
              Add Prescription
            </button>
            <button
              type="button"
              className={MENU_ITEM_CLASS}
              aria-label={`Edit Patient: ${name}`}
              aria-haspopup="dialog"
              onClick={fromMenu(onEditPatient)}
            >
              <Icon name="edit-2" className="size-4.25" />
              Edit Patient
            </button>
          </div>
        </details>
      </div>
    </article>
  );
};
