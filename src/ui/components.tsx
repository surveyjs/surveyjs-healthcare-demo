import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { SurveyNavigationAction } from '../survey/SurveyRenderer';
import { formRepository } from '../repositories/formRepository';
import { FormId } from '../types/forms';
import { FeatherIconName } from './featherIcons';
import { Icon } from './Icon';

export const PageHeading: React.FC<{ title: string; description?: string; icon: FeatherIconName }> = ({
  title,
  description,
  icon,
}) => (
  <header className="page-heading">
    <span className="title-icon">
      <Icon name={icon} />
    </span>
    <div>
      <h1>{title}</h1>
      {description && <p>{description}</p>}
    </div>
  </header>
);

export interface Crumb {
  label: string;
  path?: string;
}

// Breadcrumbs express page hierarchy; top-level tabs do not repeat it.
export const Breadcrumbs: React.FC<{ items: Crumb[] }> = ({ items }) => (
  <nav className="breadcrumbs" aria-label="Breadcrumb">
    <ol role="list">
      {items.map((item, index) => (
        <li key={item.label}>
          {index > 0 && <Icon name="chevron-right" />}
          {item.path ? <Link to={item.path}>{item.label}</Link> : <span aria-current="page">{item.label}</span>}
        </li>
      ))}
    </ol>
  </nav>
);

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & { icon?: FeatherIconName; variant?: string };

export const Button: React.FC<ButtonProps> = ({ icon, variant = '', className, children, ...rest }) => (
  <button type="button" className={`button ${variant}${className ? ' ' + className : ''}`} {...rest}>
    {icon && <Icon name={icon} />}
    {children}
  </button>
);

/** Footer action that opens a form in the builder, aligned right of the form's own buttons. */
export function editFormAction(formId: FormId, label: string, open: () => void): SurveyNavigationAction {
  return {
    id: 'edit-form-' + formId,
    title: label,
    css: 'clinic-edit-form',
    iconName: 'clinic-feather-settings',
    iconSize: 17,
    showTitle: true,
    disableShrink: true,
    action: open,
  };
}

/** Current schema for a form, refreshed when the builder saves or resets it. */
export function useFormSchema(formId: FormId): object {
  const [schema, setSchema] = useState(() => formRepository.getForm(formId));
  useEffect(
    () =>
      formRepository.subscribe((changedId) => {
        if (changedId === formId) setSchema(formRepository.getForm(formId));
      }),
    [formId],
  );
  return schema;
}

export function useDocumentTitle(title: string): void {
  useEffect(() => {
    document.title = 'Healthcare · ' + title;
  }, [title]);
}

export const NotFound: React.FC<{ backPath: string; backLabel: string }> = ({ backPath, backLabel }) => {
  useDocumentTitle('Page not found');
  return (
    <>
      <PageHeading title="Page not found" description="This page is not available in the demo." icon="info" />
      <section className="panel empty">
        <Link to={backPath} className="button primary">
          {backLabel}
        </Link>
      </section>
    </>
  );
};
