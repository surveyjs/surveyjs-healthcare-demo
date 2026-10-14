import React from 'react';
import { FEATHER_ICONS, FeatherIconName } from './featherIcons';

const ICON_CLASS = 'shrink-0';

/** Markup for non-React hosts (the demo dock and SurveyJS icon registry). */
export function iconMarkup(name: FeatherIconName, className = 'size-5'): string {
  return `<svg class="${ICON_CLASS} ${className}" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${FEATHER_ICONS[name]}</svg>`;
}

/** Feather icon; `className` replaces the default 20px size. */
export const Icon: React.FC<{ name: FeatherIconName; className?: string }> = ({ name, className = 'size-5' }) => (
  <svg
    className={`${ICON_CLASS} ${className}`}
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    focusable="false"
    dangerouslySetInnerHTML={{ __html: FEATHER_ICONS[name] }}
  />
);
