import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { Patient } from '../../types/patient';
import { Icon } from '../../ui/Icon';
import { dateOfBirthWithAge, formatDate, fullName, initials, patientAddress } from '../../ui/format';

interface PatientCardProps {
  patient: Patient;
  onRecordVisit: (patient: Patient) => void;
  onAddPrescription: (patient: Patient) => void;
  onEditPatient: (patient: Patient) => void;
}

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
    <article className="panel patient-card">
      <span className="avatar" aria-hidden="true">
        {initials(name)}
      </span>
      <div className="patient-content">
        <h3>
          <Link to={profilePath} className="patient-name" aria-label={`Open Profile: ${name}`}>
            {name}
          </Link>
        </h3>
        <div className="patient-details">
          <span>
            <span className="muted">Date of birth</span> {dateOfBirthWithAge(patient)}
          </span>
          <span>
            <span className="muted">NHS number</span> {patient.nhsNumber}
          </span>
          <span>
            <span className="muted">Phone</span> {patient.phoneNumber}
          </span>
          <span>
            <span className="muted">Registered</span> {formatDate(patient.registeredDate)}
          </span>
        </div>
        <p className="address">{patientAddress(patient)}</p>
      </div>
      <div className="patient-actions">
        <button
          type="button"
          className="button primary"
          aria-label={`Record Visit: ${name}`}
          aria-haspopup="dialog"
          onClick={() => onRecordVisit(patient)}
        >
          <Icon name="calendar" />
          Record Visit
        </button>
        <details className="patient-menu" ref={menuRef}>
          <summary className="icon-button" aria-label={`More actions: ${name}`}>
            <Icon name="more-horizontal" />
          </summary>
          <div className="patient-menu-content">
            <button
              type="button"
              className="patient-menu-item"
              aria-label={`Add Prescription: ${name}`}
              aria-haspopup="dialog"
              onClick={fromMenu(onAddPrescription)}
            >
              <Icon name="file-plus" />
              Add Prescription
            </button>
            <button
              type="button"
              className="patient-menu-item"
              aria-label={`Edit Patient: ${name}`}
              aria-haspopup="dialog"
              onClick={fromMenu(onEditPatient)}
            >
              <Icon name="edit-2" />
              Edit Patient
            </button>
          </div>
        </details>
      </div>
    </article>
  );
};
