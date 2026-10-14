import React, { useEffect, useMemo, useRef } from 'react';
import { SurveyCreator, SurveyCreatorComponent } from 'survey-creator-react';
import 'survey-creator-core/survey-creator-core.min.css';
import { Dialog } from '../components/common/Dialog';
import { FormId } from '../types/forms';
import { formRepository } from '../repositories/formRepository';
import { applyClinicCreatorTheme, setActiveCreator } from '../theme/clinicTheme';
import { demoTools } from '../theme/demoTools';
import { Icon } from '../ui/Icon';
import { Button, iconButtonClass } from '../ui/components';

interface SurveyCreatorModalProps {
  formId: FormId;
  onClose: () => void;
  /** Called after "Save & Apply Form" persists the schema; the parent closes the builder and restores the originating view. */
  onApplied: (formId: FormId) => void;
}

export const SurveyCreatorModal: React.FC<SurveyCreatorModalProps> = ({ formId, onClose, onApplied }) => {
  const metadata = formRepository.getMetadata(formId);
  const title = metadata?.title || formId;
  const containerRef = useRef<HTMLDivElement>(null);

  const creator = useMemo(() => {
    const instance = new SurveyCreator({ showLogicTab: true, showJSONEditorTab: true, autoSaveEnabled: false });
    instance.JSON = formRepository.getForm(formId);
    applyClinicCreatorTheme(instance);
    return instance;
  }, [formId]);

  useEffect(() => {
    setActiveCreator(creator);
    if (containerRef.current) demoTools.mark(containerRef.current, 'SurveyJS Creator');
    return () => setActiveCreator(null);
  }, [creator]);

  const saveAndApply = async () => {
    try {
      await formRepository.saveForm(formId, creator.JSON);
      onApplied(formId);
    } catch (e) {
      console.error('Failed to save form schema:', e);
    }
  };

  return (
    <Dialog
      label={`Form Builder: ${title}`}
      className="inset-0 m-0 h-dvh max-h-none w-screen max-w-none flex-col overflow-hidden open:flex"
      onClose={onClose}
    >
      <div className="flex shrink-0 flex-col gap-3 border-b border-border p-3.5 md:flex-row md:items-start md:justify-between md:gap-5 md:px-6 md:py-4.5 lg:items-center">
        <div>
          <h2 className="text-sm leading-normal font-semibold lg:text-[17px]">Form Builder: {title}</h2>
          <p className="mt-1 text-xs text-muted-foreground md:max-lg:max-w-90">
            Visual schema designer. Changes are saved to the local database.
          </p>
        </div>
        <div className="flex w-full shrink-0 items-center gap-2.5 md:w-auto">
          <Button onClick={() => (creator.JSON = structuredClone(metadata?.defaultSchema ?? {}))}>
            Reset to Default
          </Button>
          <Button variant="primary" onClick={() => void saveAndApply()}>
            Save &amp; Apply Form
          </Button>
          <button type="button" className={`${iconButtonClass} max-md:ml-auto`} aria-label="Close Form Builder" onClick={onClose}>
            <Icon name="x" />
          </button>
        </div>
      </div>
      <div id="survey-creator" ref={containerRef} className="min-h-0 flex-1">
        <SurveyCreatorComponent creator={creator} />
      </div>
    </Dialog>
  );
};
