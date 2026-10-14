import React from 'react';
import { AppointmentRequest } from '../../types/appointmentRequest';
import { Prescription, Visit } from '../../types/patient';
import { buttonClass, cx, Pill } from '../../ui/components';
import { Icon } from '../../ui/Icon';
import { formatDate, toIsoDate, todayIso } from '../../ui/format';

const RECORD_LIST_CLASS = 'flex flex-col gap-3.5 p-5 text-[13px] md:px-6 md:pt-5 md:pb-6';
const RECORD_CLASS = 'rounded-lg border border-border p-4';
const INTERACTIVE_RECORD_CLASS = 'w-full bg-card text-left transition-colors hover:border-border-hover hover:bg-card-hover';
const VISIT_RECORD_CLASS = cx(RECORD_CLASS, 'grid gap-3.5');
const RECORD_NOTE_CLASS =
  'mt-2.5 block border-t border-border pt-2.5 text-xs leading-[1.7] text-muted-foreground wrap-anywhere';
const ACTIONS_CLASS = 'mt-4 flex justify-end gap-2';

/** Bordered row used for appointment requests and practitioners. */
export const ROW_CARD_CLASS = 'flex items-center justify-between gap-3.5 rounded-md border bg-card p-3.5 sm:p-4';
export const ROW_CARD_TITLE_CLASS = 'text-[13px] leading-normal font-semibold sm:text-sm';
export const ROW_CARD_TEXT_CLASS = 'mt-0.75 text-[11px] text-muted-foreground sm:text-xs';

const Label: React.FC<{ children: string }> = ({ children }) => <span className="text-muted-foreground">{children}</span>;

const VisitField: React.FC<{ label: string; value?: string }> = ({ label, value }) => (
  <span className="mb-1 block text-xs leading-[1.7]">
    <Label>{label}</Label> {value || '—'}
  </span>
);

export const DetailsList: React.FC<{ items: [string, string | undefined][] }> = ({ items }) => (
  <dl className="text-[13px]">
    {items.map(([label, value]) => (
      <div
        key={label}
        className="mb-3.5 grid grid-cols-[98px_minmax(0,1fr)] gap-3 leading-[1.7] last:mb-0 md:grid-cols-[104px_minmax(0,1fr)]"
      >
        <dt className="text-muted-foreground">{label}</dt>
        <dd className="wrap-anywhere">{value || 'Not recorded'}</dd>
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
    <div className={RECORD_LIST_CLASS}>
      {rows.length ? (
        rows.map((visit) => {
          const date = new Date(toIsoDate(visit.visitDate) + 'T12:00:00');
          const editable = !!onEdit && toIsoDate(visit.visitDate) === today;
          const interactive = !!onView && !editable;
          const content = (
            <>
              <span className="flex flex-col items-center self-start rounded-md border border-border bg-card-subtle px-1 py-2">
                <strong className="text-[21px] leading-[1.3]">{date.getDate()}</strong>
                <span className="text-[9px] whitespace-nowrap uppercase">
                  {date.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}
                </span>
                <small className="mt-1 text-[10px] text-muted-foreground">{visit.visitTime || ''}</small>
              </span>
              <span className="min-w-0 wrap-anywhere">
                <VisitField label="Visit type:" value={visit.visitType} />
                <VisitField label="Practitioner:" value={visit.practitioner} />
                <VisitField label="Reason:" value={visit.reasonForVisit} />
                <span className={RECORD_NOTE_CLASS}>
                  <VisitField label="Diagnosis:" value={visit.diagnosis} />
                  <VisitField label="Treatment:" value={visit.treatmentRecommendations} />
                </span>
                {editable && (
                  <span className={ACTIONS_CLASS}>
                    <button
                      type="button"
                      className={buttonClass('outline', 'sm', 'w-full')}
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
              <article key={visit.id} className={cx(VISIT_RECORD_CLASS, 'grid-cols-[60px_minmax(0,1fr)]')}>
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
              className={cx(VISIT_RECORD_CLASS, INTERACTIVE_RECORD_CLASS, 'grid-cols-[60px_minmax(0,1fr)_16px]')}
              aria-haspopup="dialog"
              aria-label={label}
              onClick={() => onView!(visit)}
            >
              {content}
              <Icon name="chevron-right" className="mt-0.5 size-4 text-primary" />
            </button>
          );
        })
      ) : (
        <p className="text-muted-foreground">No visits recorded yet.</p>
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
    <div className={RECORD_LIST_CLASS}>
      {prescriptions.length ? (
        prescriptions.map((rx) => {
          const Group = readOnly ? 'span' : 'div';
          const Title = readOnly ? 'span' : 'h3';
          const Text = readOnly ? 'span' : 'p';
          const content = (
            <>
              <Group className="flex flex-wrap items-center gap-2">
                <Title className="min-w-30 flex-1 text-[13px] leading-normal font-semibold wrap-anywhere">
                  {rx.medication}
                </Title>
                <Pill tone={rx.status === 'Completed' ? 'neutral' : 'brand'}>{rx.status}</Pill>
                {readOnly && <Icon name="chevron-right" className="size-4 text-primary" />}
              </Group>
              <Group className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs leading-[1.7]">
                <Text>
                  <Label>Dosage:</Label> {rx.dosage || '—'}
                </Text>
                <Text>
                  <Label>Frequency:</Label> {rx.frequency || '—'}
                </Text>
                <Text>
                  <Label>Start date:</Label> {formatDate(rx.startDate)}
                </Text>
                <Text>
                  <Label>End date:</Label> {rx.endDate ? formatDate(rx.endDate) : 'Ongoing'}
                </Text>
              </Group>
              {rx.instructions && <Text className={RECORD_NOTE_CLASS}>{rx.instructions}</Text>}
              {!readOnly && onEdit && rx.status === 'Active' && (
                <div className={ACTIONS_CLASS}>
                  <button
                    type="button"
                    className={buttonClass('outline', 'sm', 'w-full')}
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
              className={cx(RECORD_CLASS, INTERACTIVE_RECORD_CLASS, 'block')}
              aria-haspopup="dialog"
              aria-label={`View medication: ${rx.medication}`}
              onClick={() => onView!(rx)}
            >
              {content}
            </button>
          ) : (
            <article key={rx.id} className={RECORD_CLASS}>
              {content}
            </article>
          );
        })
      ) : (
        <p className="text-muted-foreground">No prescriptions recorded yet.</p>
      )}
    </div>
  );
};

export const AppointmentList: React.FC<{ requests: AppointmentRequest[] }> = ({ requests }) =>
  requests.length ? (
    <div className="flex flex-col gap-3">
      {requests.map((request) => {
        const data = request.requestData as Record<string, string | undefined>;
        return (
          <article key={request.id} className={cx('appointment-request', ROW_CARD_CLASS, 'border-border')}>
            <div className="min-w-0 flex-1 wrap-anywhere">
              <h3 className={ROW_CARD_TITLE_CLASS}>{data.patient_name || request.patientName}</h3>
              <p className={ROW_CARD_TEXT_CLASS}>
                {formatDate(data.preferred_date)} · {data.preferred_time || 'No preference'}
              </p>
              <p className={ROW_CARD_TEXT_CLASS}>{data.reason_for_appointment}</p>
            </div>
            <Pill>Requested</Pill>
          </article>
        );
      })}
    </div>
  ) : (
    <p>No appointment requests yet.</p>
  );
