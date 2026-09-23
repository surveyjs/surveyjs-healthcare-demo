import React, { useMemo, useState } from 'react';
import { SurveyCreator, SurveyCreatorComponent } from 'survey-creator-react';
import 'survey-core/survey-core.min.css';
import 'survey-creator-core/survey-creator-core.min.css';
import './tailwind-adapter.css';
import { DefaultLightPanelless } from 'survey-core/themes';
import { FormId } from '../types/forms';
import { formRepository } from '../repositories/formRepository';
import { Check, RotateCcw, X, Sparkles } from 'lucide-react';

interface SurveyCreatorModalProps {
  formId: FormId;
  isOpen: boolean;
  onClose: () => void;
  onSaved?: (formId: FormId) => void;
}

export const SurveyCreatorModal: React.FC<SurveyCreatorModalProps> = ({
  formId,
  isOpen,
  onClose,
  onSaved,
}) => {
  const [saveSuccess, setSaveSuccess] = useState(false);
  const metadata = formRepository.getMetadata(formId);

  const creator = useMemo(() => {
    const options = {
      showLogicTab: true,
      showJSONEditorTab: true,
      showTranslationTab: false,
      showEmbededSurveyTab: false,
      isAutoSave: true,
    };

    const inst = new SurveyCreator(options);
    const schema = formRepository.getForm(formId);
    inst.JSON = schema;
    inst.theme = DefaultLightPanelless;

    inst.saveSurveyFunc = (saveNo: number, callback: (no: number, isSuccess: boolean) => void) => {
      formRepository
        .saveForm(formId, inst.JSON)
        .then(() => {
          callback(saveNo, true);
          setSaveSuccess(true);
          setTimeout(() => setSaveSuccess(false), 3000);
          if (onSaved) onSaved(formId);
        })
        .catch((e) => {
          console.error('Failed to save form schema:', e);
          callback(saveNo, false);
        });
    };

    return inst;
  }, [formId, onSaved]);

  if (!isOpen) return null;

  const handleManualSave = async () => {
    try {
      await formRepository.saveForm(formId, creator.JSON);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      if (onSaved) onSaved(formId);
    } catch (e) {
      console.error('Failed to save form schema:', e);
    }
  };

  const handleReset = async () => {
    if (confirm('Are you sure you want to reset this form to its default schema? All custom changes will be discarded.')) {
      const defaultSchema = await formRepository.resetForm(formId);
      creator.JSON = defaultSchema;
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      if (onSaved) onSaved(formId);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="flex flex-col h-full w-full bg-white shadow-2xl">
        {/* Creator Header Bar */}
        <header className="flex items-center justify-between px-6 py-3 border-b border-gray-200 bg-white z-10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#00695c] flex items-center justify-center text-white font-bold shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-gray-900">
                  Form Builder: <span className="text-[#00695c]">{metadata?.title || formId}</span>
                </h2>
                <span className="text-xs px-2 py-0.5 rounded-md bg-teal-50 text-[#00695c] font-medium border border-teal-200">
                  SurveyJS Creator Active
                </span>
              </div>
              <p className="text-xs text-gray-500">
                Visual schema designer. Edit question types, validations, logic, and labels. Persisted in real-time.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {saveSuccess && (
              <span className="flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-md border border-emerald-200 font-medium">
                <Check className="w-3.5 h-3.5" /> Changes saved & active
              </span>
            )}

            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 hover:text-gray-900 transition-colors"
              title="Reset schema to original default"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Default
            </button>

            <button
              type="button"
              onClick={handleManualSave}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium text-white bg-[#00695c] rounded-md hover:bg-[#004d40] shadow-xs transition-colors"
            >
              <Check className="w-3.5 h-3.5" />
              Save & Apply Form
            </button>

            <div className="h-6 w-px bg-gray-200 mx-1" />

            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center justify-center w-8 h-8 rounded-md text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors"
              title="Close Form Builder"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Creator Component Container */}
        <div className="flex-1 overflow-hidden relative" style={{ height: 'calc(100vh - 65px)' }}>
          <SurveyCreatorComponent creator={creator} />
        </div>
      </div>
    </div>
  );
};
