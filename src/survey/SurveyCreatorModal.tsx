import React, { useEffect, useMemo, useRef } from 'react';
import { SurveyCreator, SurveyCreatorComponent } from 'survey-creator-react';
import 'survey-creator-core/survey-creator-core.min.css';
import { Dialog } from '../components/common/Dialog';
import { FormId } from '../types/forms';
import { formRepository } from '../repositories/formRepository';
import { applyClinicCreatorTheme, setActiveCreator } from '../theme/clinicTheme';
import { demoTools } from '../theme/demoTools';
import { Icon } from '../ui/Icon';
import { Button } from '../ui/components';

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
    <Dialog label={`Form Builder: ${title}`} className="builder-dialog" onClose={onClose}>
      <div className="builder-heading">
        <div>
          <h2>Form Builder: {title}</h2>
          <p>Visual schema designer. Changes are saved to the local database.</p>
        </div>
        <div className="builder-actions">
          <Button onClick={() => (creator.JSON = structuredClone(metadata?.defaultSchema ?? {}))}>
            Reset to Default
          </Button>
          <Button variant="primary" onClick={() => void saveAndApply()}>
            Save &amp; Apply Form
          </Button>
          <button type="button" className="icon-button" aria-label="Close Form Builder" onClick={onClose}>
            <Icon name="x" />
          </button>
        </div>
      </div>
      <div id="survey-creator" ref={containerRef} className="creator-container">
        <SurveyCreatorComponent creator={creator} />
      </div>
    </Dialog>
  );
};
