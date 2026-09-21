import React, { useEffect, useMemo, useRef } from 'react';
import { Model } from 'survey-core';
import { DefaultLightPanelless } from 'survey-core/themes';
import { Survey } from 'survey-react-ui';
import 'survey-core/survey-core.min.css';
import './tailwind-adapter.css';

export interface SurveyRendererProps {
  schema: object;
  initialData?: Record<string, any>;
  onComplete?: (data: Record<string, any>) => void;
  onValueChanged?: (name: string, value: any, allData: Record<string, any>) => void;
  readOnly?: boolean;
  completeText?: string;
  showNavigationButtons?: boolean | string;
  onModelReady?: (model: Model) => void;
  className?: string;
}

export const SurveyRenderer: React.FC<SurveyRendererProps> = ({
  schema,
  initialData,
  onComplete,
  onValueChanged,
  readOnly = false,
  completeText,
  showNavigationButtons,
  onModelReady,
  className = '',
}) => {
  const modelRef = useRef<Model | null>(null);

  const survey = useMemo(() => {
    // Create new SurveyJS model from provided schema
    const model = new Model(schema);

    // Panelless base; the host look comes from the Tailwind adapter (tailwind-adapter.css)
    model.applyTheme(DefaultLightPanelless);

    // Titles are rendered by the host pages/modals
    model.showTitle = false;

    if (completeText) {
      model.completeText = completeText;
    }

    if (showNavigationButtons !== undefined) {
      model.showNavigationButtons = showNavigationButtons;
    }

    if (readOnly) {
      model.mode = 'display';
    }

    if (initialData) {
      model.data = initialData;
    }

    return model;
  }, [schema, readOnly, completeText, showNavigationButtons]);

  useEffect(() => {
    modelRef.current = survey;

    if (initialData) {
      survey.data = initialData;
    }

    const completeHandler = (sender: Model) => {
      if (onComplete) {
        onComplete(sender.data);
      }
    };

    const valueChangedHandler = (sender: Model, options: any) => {
      if (onValueChanged) {
        onValueChanged(options.name, options.value, sender.data);
      }
    };

    survey.onComplete.add(completeHandler);
    survey.onValueChanged.add(valueChangedHandler);

    if (onModelReady) {
      onModelReady(survey);
    }

    return () => {
      survey.onComplete.remove(completeHandler);
      survey.onValueChanged.remove(valueChangedHandler);
    };
  }, [survey, initialData, onComplete, onValueChanged, onModelReady]);

  return (
    <div className={`survey-container survey-custom-wrapper ${className}`}>
      <Survey model={survey} />
    </div>
  );
};
