import React from 'react';
import { AppointmentRequest } from '../../types/appointmentRequest';
import { Prescription, Visit } from '../../types/patient';
import { Icon } from '../../ui/Icon';
import { formatDate, toIsoDate, todayIso } from '../../ui/format';

export const DetailsList: React.FC<{ items: [string, string | undefined][] }> = ({ items }) => (
  <dl className="details-list">
    {items.map(([label, value]) => (
      <div key={label}>
        <dt>{label}</dt>
        <dd>{value || 'Not recorded'}</dd>
      </div>
    ))}
  </dl>
);

interface VisitListProps {
  visits: Visit[];
  /** Makes each card a button that opens the read-only visit details. */
  onView?: (visit: Visit) => void;
  /** Visits recorded today stay editable by doctors. */
  onEdit?: (visit: Visit) => void;
}

export const VisitList: React.FC<VisitListProps> = ({ visits, onView, onEdit }) => {
  const rows = [...visits].sort((a, b) => toIsoDate(b.visitDate).localeCompare(toIsoDate(a.visitDate)));
  const today = todayIso();
  return (
    <div className="record-list">
      {rows.length ? (
        rows.map((visit) => {
          const date = new Date(toIsoDate(visit.visitDate) + 'T12:00:00');
          const editable = !!onEdit && toIsoDate(visit.visitDate) === today;
          const interactive = !!onView && !editable;
          const content = (
            <>
              <span className="date-tile">
                <strong>{date.getDate()}</strong>
                <span>{date.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}</span>
                <small>{visit.visitTime || ''}</small>
              </span>
              <span className="visit-summary">
                <span className="visit-field">
                  <span className="muted">Visit type:</span> {visit.visitType || '—'}
                </span>
                <span className="visit-field">
                  <span className="muted">Practitioner:</span> {visit.practitioner || '—'}
                </span>
                <span className="visit-field">
                  <span className="muted">Reason:</span> {visit.reasonForVisit || '—'}
                </span>
                <span className="record-note">
                  <span className="visit-field">
                    <span className="muted">Diagnosis:</span> {visit.diagnosis || '—'}
                  </span>
                  <span className="visit-field">
                    <span className="muted">Treatment:</span> {visit.treatmentRecommendations || '—'}
                  </span>
                </span>
                {editable && (
                  <span className="medication-actions">
                    <button
                      type="button"
                      className="button secondary"
                      aria-haspopup="dialog"
                      aria-label={`Edit Visit: ${visit.visitType}, ${formatDate(visit.visitDate)}`}
                      onClick={() => onEdit!(visit)}
                    >
                      <Icon name="edit-2" />
                      Edit Visit
                    </button>
                  </span>
                )}
              </span>
            </>
          );
          if (!interactive) {
            return (
              <article key={visit.id} className="visit-record">
                {content}
              </article>
            );
          }
          const label = `View visit details: ${visit.visitType}, ${formatDate(visit.visitDate)}${
            visit.visitTime ? ' at ' + visit.visitTime : ''
          }`;
          return (
            <button
              key={visit.id}
              type="button"
              className="visit-record visit-record--interactive"
              aria-haspopup="dialog"
              aria-label={label}
              onClick={() => onView!(visit)}
            >
              {content}
              <Icon name="chevron-right" />
            </button>
          );
        })
      ) : (
        <p className="muted">No visits recorded yet.</p>
      )}
    </div>
  );
};

interface MedicationListProps {
  prescriptions: Prescription[];
  /** Staff view: active prescriptions show an Edit Prescription action. */
  onEdit?: (prescription: Prescription) => void;
  /** Patient view: each card is a button that opens the read-only record. */
  onView?: (prescription: Prescription) => void;
}

export const MedicationList: React.FC<MedicationListProps> = ({ prescriptions, onEdit, onView }) => {
  const readOnly = !!onView;
  return (
    <div className="record-list">
      {prescriptions.length ? (
        prescriptions.map((rx) => {
          const Group = readOnly ? 'span' : 'div';
          const Title = readOnly ? 'span' : 'h3';
          const Text = readOnly ? 'span' : 'p';
          const content = (
            <>
              <Group className="record-title">
                <Title className="medication-name">{rx.medication}</Title>
                <span className={`pill ${rx.status === 'Completed' ? 'neutral' : ''}`}>{rx.status}</span>
                {readOnly && <Icon name="chevron-right" />}
              </Group>
              <Group className="medication-info">
                <Text>
                  <span className="muted">Dosage:</span> {rx.dosage || '—'}
                </Text>
                <Text>
                  <span className="muted">Frequency:</span> {rx.frequency || '—'}
                </Text>
                <Text>
                  <span className="muted">Start date:</span> {formatDate(rx.startDate)}
                </Text>
                <Text>
                  <span className="muted">End date:</span> {rx.endDate ? formatDate(rx.endDate) : 'Ongoing'}
                </Text>
              </Group>
              {rx.instructions && <Text className="record-note">{rx.instructions}</Text>}
              {!readOnly && onEdit && rx.status === 'Active' && (
                <div className="medication-actions">
                  <button
                    type="button"
                    className="button secondary"
                    aria-label={`Edit Prescription: ${rx.medication}`}
                    onClick={() => onEdit(rx)}
                  >
                    <Icon name="edit-2" />
                    Edit Prescription
                  </button>
                </div>
              )}
            </>
          );
          return readOnly ? (
            <button
              key={rx.id}
              type="button"
              className="medication-record medication-record--interactive"
              aria-haspopup="dialog"
              aria-label={`View medication: ${rx.medication}`}
              onClick={() => onView!(rx)}
            >
              {content}
            </button>
          ) : (
            <article key={rx.id} className="medication-record">
              {content}
            </article>
          );
        })
      ) : (
        <p className="muted">No prescriptions recorded yet.</p>
      )}
    </div>
  );
};

export const AppointmentList: React.FC<{ requests: AppointmentRequest[] }> = ({ requests }) =>
  requests.length ? (
    <div className="appointment-list">
      {requests.map((request) => {
        const data = request.requestData as Record<string, string | undefined>;
        return (
          <article key={request.id} className="appointment-request">
            <div className="appointment-copy">
              <h3>{data.patient_name || request.patientName}</h3>
              <p>
                {formatDate(data.preferred_date)} · {data.preferred_time || 'No preference'}
              </p>
              <p>{data.reason_for_appointment}</p>
            </div>
            <span className="pill">Requested</span>
          </article>
        );
      })}
    </div>
  ) : (
    <p>No appointment requests yet.</p>
  );
