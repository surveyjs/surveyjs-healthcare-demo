import React from 'react';
import { cx } from '../../ui/components';

export const Toast: React.FC<{ message: string; visible: boolean }> = ({ message, visible }) => (
  <div
    id="toast"
    className={cx(
      'fixed bottom-23 left-1/2 z-100 max-w-[calc(100vw-32px)] -translate-x-1/2 rounded-lg bg-foreground px-4.75 py-3 text-[13px] text-card transition duration-150',
      visible ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-3 opacity-0',
    )}
    role="status"
  >
    {message}
  </div>
);
