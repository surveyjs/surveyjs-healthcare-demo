import React, { useRef, useState } from 'react';
import { Model } from 'survey-core';
import { AlertCircle } from 'lucide-react';
import { SurveyRenderer } from '../survey/SurveyRenderer';
import { formRepository } from '../repositories/formRepository';
import { authRepository } from '../repositories/authRepository';
import { AuthUser } from '../types/auth';

interface LoginPageProps {
  onLogin: (user: AuthUser) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [error, setError] = useState<string | null>(null);
  // Guards against duplicate onCompleting handlers (StrictMode re-runs effects)
  const wiredModels = useRef(new WeakSet<Model>());
  const pending = useRef(false);

  const schema = formRepository.getForm('login');

  const handleModelReady = (model: Model) => {
    if (wiredModels.current.has(model)) return;
    wiredModels.current.add(model);

    model.onCompleting.add((sender, options) => {
      // Keep the form live; a successful login unmounts this page
      options.allow = false;
      if (pending.current) return;
      pending.current = true;
      setError(null);

      const { username, password, remember_me } = sender.data as Record<string, any>;
      authRepository
        .login(String(username ?? ''), String(password ?? ''))
        .then((user) => {
          authRepository.storeUser(user, !!remember_me);
          onLogin(user);
        })
        .catch(() => {
          setError('Invalid username or password. Please try again.');
        })
        .finally(() => {
          pending.current = false;
        });
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] px-4 py-10">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-[#00695c] flex items-center justify-center text-white shadow-xs">
            <svg className="w-7 h-7 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 10.5h-5.5V5c0-.55-.45-1-1-1s-1 .45-1 1v5.5H6c-.55 0-1 .45-1 1s.45 1 1 1h5.5V19c0 .55.45 1 1 1s1-.45 1-1v-5.5H19c.55 0 1-.45 1-1s-.45-1-1-1z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Clinic Portal</h1>
          <p className="text-sm text-gray-500 text-center">
            Sign in to manage patients, visits, and prescriptions.
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6 sm:p-8 shadow-xs space-y-4">
          {error && (
            <div
              role="alert"
              className="flex items-start gap-2 p-3 rounded-md bg-rose-50 border border-rose-200 text-sm text-rose-700"
            >
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <SurveyRenderer schema={schema} onModelReady={handleModelReady} />
        </div>

        <p className="text-center text-xs text-gray-400">
          Demo environment — doctor and patient accounts are pre-provisioned in the local database.
        </p>
      </div>
    </div>
  );
};
