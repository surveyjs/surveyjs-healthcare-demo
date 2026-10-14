import React, { useMemo, useRef } from 'react';
import { SurveyError } from 'survey-core';
import { SurveyRenderer } from '../survey/SurveyRenderer';
import { authRepository } from '../repositories/authRepository';
import { AuthUser } from '../types/auth';
import { PageHeading, useDocumentTitle, useFormSchema } from '../ui/components';

interface LoginPageProps {
  onLogin: (user: AuthUser) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  useDocumentTitle('Sign In');
  const storedSchema = useFormSchema('login');
  const pending = useRef(false);
  // "Keep me signed in" starts unchecked rather than indeterminate.
  const schema = useMemo(() => {
    const copy = structuredClone(storedSchema) as { pages?: { elements?: Record<string, unknown>[] }[] };
    copy.pages?.forEach((page) =>
      page.elements?.forEach((element) => {
        if (element.name === 'remember_me') element.defaultValue = false;
      }),
    );
    return copy;
  }, [storedSchema]);

  return (
    <>
      <PageHeading
        title="Clinic Portal Sign In"
        description="Select a demo account to explore the local clinic portal."
        icon="log-in"
      />
      <section className="panel">
        <SurveyRenderer
          id="login-form"
          schema={schema}
          hideTitle
          onSave={(data, model) => {
            if (pending.current) return;
            pending.current = true;
            authRepository
              .login(String(data.username ?? ''), String(data.password ?? ''))
              .then((user) => {
                authRepository.storeUser(user, !!data.remember_me);
                onLogin(user);
              })
              .catch(() =>
                model
                  .getQuestionByName('password')
                  .addError(new SurveyError('Invalid username or password. Please try again.')),
              )
              .finally(() => {
                pending.current = false;
              });
          }}
        />
      </section>
    </>
  );
};
