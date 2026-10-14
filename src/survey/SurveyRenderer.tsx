import React, { useEffect, useMemo, useRef } from 'react';
import { IAction, Model } from 'survey-core';
import { Survey } from 'survey-react-ui';
import 'survey-core/survey-core.min.css';
import { applyClinicFormTheme, registerClinicModel } from '../theme/clinicTheme';
import { demoTools } from '../theme/demoTools';

export type SurveyNavigationAction = Partial<IAction> & { id: string };

export interface SurveyRendererProps {
  /** Host element id; also prefixes SurveyJS element ids and selects host-specific theme tokens. */
  id: string;
  schema: object;
  /** Initial answers; applied when the model is created. */
  data?: Record<string, unknown>;
  /** Called from onCompleting after validation passes; the form stays live (no completion page). */
  onSave?: (data: Record<string, any>, model: Model) => void;
  onValueChanged?: (data: Record<string, any>, model: Model) => void;
  /** Extra footer navigation items, rendered after the Complete button. */
  actions?: SurveyNavigationAction[];
  readOnly?: boolean;
  hideTitle?: boolean;
  showNavigation?: boolean;
  /** Final model customization before the first render. */
  configure?: (model: Model) => void;
  onModelReady?: (model: Model) => void;
}

/** Renders a SurveyJS form with the shared clinic theme, matching the host's `.native-survey` mount point. */
export const SurveyRenderer: React.FC<SurveyRendererProps> = ({
  id,
  schema,
  data,
  onSave,
  onValueChanged,
  actions = [],
  readOnly = false,
  hideTitle = false,
  showNavigation = true,
  configure,
  onModelReady,
}) => {
  const hostRef = useRef<HTMLDivElement>(null);
  // Handlers are read through refs so a re-render never rebuilds the model.
  const handlers = useRef({ onSave, onValueChanged, actions });
  handlers.current = { onSave, onValueChanged, actions };
  const themeOptions = useMemo(
    () => ({ host: id, dynamicPanels: JSON.stringify(schema).includes('paneldynamic') }),
    [id, schema],
  );

  const model = useMemo(() => {
    const m = new Model({
      ...schema,
      questionErrorLocation: 'bottom',
      showQuestionNumbers: 'off',
      showCompletePage: false,
      widthMode: 'responsive',
      showTitle: !hideTitle,
      showNavigationButtons: showNavigation,
      mode: readOnly ? 'display' : 'edit',
    });
    m.elementIdPrefix = id + '-';
    applyClinicFormTheme(m, themeOptions);
    if (data) m.data = { ...m.data, ...structuredClone(data) };
    m.onCompleting.add((sender, options) => {
      options.allow = false;
      handlers.current.onSave?.(structuredClone(sender.data), sender);
    });
    m.onValueChanged.add((sender) => handlers.current.onValueChanged?.(sender.data, sender));
    actions.forEach((action, index) =>
      m.addNavigationItem({
        visibleIndex: 60 + index * 10,
        ...action,
        action: () => handlers.current.actions.find((item) => item.id === action.id)?.action?.(),
      }),
    );
    configure?.(m);
    return m;
    // The model is rebuilt only for a new schema or display mode, like the designer's render().
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, schema, readOnly, hideTitle, showNavigation, themeOptions]);

  useEffect(() => registerClinicModel(model, themeOptions), [model, themeOptions]);

  useEffect(() => {
    onModelReady?.(model);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [model]);

  useEffect(() => {
    if (hostRef.current) demoTools.mark(hostRef.current);
  }, []);

  return (
    <div id={id} ref={hostRef} className="native-survey">
      <Survey model={model} />
    </div>
  );
};
