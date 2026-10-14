import React, { useLayoutEffect, useRef, useState } from 'react';
import { demoTools } from '../../theme/demoTools';
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
    <dialog ref={ref} className={className} aria-label={label}>
      {children}
    </dialog>
  );
};

interface ModalProps {
  heading: string;
  description?: string;
  className?: string;
  footer?: React.ReactNode;
  onClose: () => void;
  children: React.ReactNode;
}

/** Dialog with the standard heading, close button, body and optional footer. */
export const Modal: React.FC<ModalProps> = ({ heading, description, className, footer, onClose, children }) => (
  <Dialog label={heading} className={className} onClose={onClose}>
    <div className="modal-head">
      <div>
        <h2>{heading}</h2>
        {description && <p>{description}</p>}
      </div>
      <button type="button" className="icon-button" aria-label="Close dialog" onClick={onClose}>
        <Icon name="x" />
      </button>
    </div>
    <div className="modal-body">{children}</div>
    {footer && <div className="modal-footer">{footer}</div>}
  </Dialog>
);
