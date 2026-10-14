import React from 'react';
import { FEATHER_ICONS, FeatherIconName } from './featherIcons';

/** Markup for non-React hosts (the demo dock and SurveyJS icon registry). */
export function iconMarkup(name: FeatherIconName): string {
  return `<svg class="clinic-icon feather feather-${name}" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${FEATHER_ICONS[name]}</svg>`;
}

export const Icon: React.FC<{ name: FeatherIconName }> = ({ name }) => (
  <svg
    className={`clinic-icon feather feather-${name}`}
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
