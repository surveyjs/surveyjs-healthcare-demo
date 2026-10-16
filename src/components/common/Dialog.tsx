import React, { useLayoutEffect, useRef, useState } from 'react';
import { demoTools } from '../../theme/demoTools';
import { cx, iconButtonClass } from '../../ui/components';
import { Icon } from '../../ui/Icon';

interface DialogProps {
  label: string;
  className?: string;
  onClose: () => void;
  children: React.ReactNode;
}

/** Native modal <dialog>: opens on mount, closes on unmount, and returns focus to its trigger. */
export const Dialog: React.FC<DialogProps> = ({ label, className = '', onClose, children }) => {
  const ref = useRef<HTMLDialogElement>(null);
  const [lastFocus] = useState(() => document.activeElement as HTMLElement | null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useLayoutEffect(() => {
    const dialog = ref.current!;
    if (!dialog.open) dialog.showModal();
    demoTools.attach(dialog);
    const handleCancel = (event: Event) => {
      event.preventDefault();
      onCloseRef.current();
    };
    dialog.addEventListener('cancel', handleCancel);
    return () => {
      dialog.removeEventListener('cancel', handleCancel);
      // Return the dock to the page before React removes the dialog.
      demoTools.attach();
      dialog.close();
      if (lastFocus?.isConnected) lastFocus.focus({ preventScroll: true });
    };
  }, [lastFocus]);

  return (
    <dialog
      ref={ref}
      className={cx('overscroll-contain bg-card text-foreground backdrop:bg-[#20362c55] backdrop:backdrop-blur-[2px]', className)}
      aria-label={label}
    >
      {children}
    </dialog>
  );
};

interface ModalProps {
  heading: string;
  description?: string;
  /** A wide dialog whose body is a SurveyJS form with its own padding. */
  form?: boolean;
  footer?: React.ReactNode;
  onClose: () => void;
  children: React.ReactNode;
}

/**
 * Dialog with the standard heading, close button, body and optional footer.
 * The header and footer stay pinned; only the body scrolls. A form body is a
 * bounded flex host, so the SurveyJS form fits it (`fitToContainer`) and
 * scrolls with its own scroller instead of the dialog's native one.
 */
export const Modal: React.FC<ModalProps> = ({ heading, description, form = false, footer, onClose, children }) => (
  <Dialog
    label={heading}
    className={cx(
      'm-auto max-h-[calc(100dvh-40px)] overflow-hidden rounded-xl border border-border shadow-dialog open:flex open:flex-col has-[>.demo-dock]:max-h-[calc(100dvh-168px)]',
      form ? 'w-190 max-w-[calc(100vw-24px)] md:max-w-[calc(100vw-32px)]' : 'w-130 max-w-[calc(100vw-32px)]',
    )}
    onClose={onClose}
  >
    <div
      className={cx('flex shrink-0 justify-between gap-4 border-b border-border p-5 sm:px-6 sm:py-5.5', form && 'items-center')}
    >
      <div className="min-w-0">
        <h2 className={cx('leading-normal font-semibold tracking-tight wrap-anywhere', form ? 'text-lg md:text-xl' : 'text-lg')}>
          {heading}
        </h2>
        {description && <p className="mt-1.25 text-[13px] text-muted-foreground">{description}</p>}
      </div>
      <button type="button" className={iconButtonClass} aria-label="Close dialog" onClick={onClose}>
        <Icon name="x" />
      </button>
    </div>
    <div
      className={cx(
        'min-h-0 flex-1',
        form ? 'modal-form-body flex flex-col' : 'overflow-y-auto p-5 text-sm leading-[1.8] text-muted-foreground sm:p-6',
      )}
    >
      {children}
    </div>
    {footer && <div className="flex shrink-0 justify-end gap-2.5 border-t border-border px-5 py-4 sm:px-6">{footer}</div>}
  </Dialog>
);
