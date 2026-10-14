import React from 'react';

export const Toast: React.FC<{ message: string; visible: boolean }> = ({ message, visible }) => (
  <div id="toast" className={`toast${visible ? ' show' : ''}`} role="status">
    {message}
  </div>
);
