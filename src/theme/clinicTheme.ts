import { ITheme, Model, SvgRegistry } from 'survey-core';
import { FlatDarkPanelless, FlatLightPanelless } from 'survey-core/themes';
import type { SurveyCreator } from 'survey-creator-react';
import { FEATHER_ICONS } from '../ui/featherIcons';

// One theme shared by the actual SurveyJS models and the surrounding clinic UI.
export const CLINIC_THEME: ITheme = {
  ...FlatLightPanelless,
  cssVariables: {
    ...FlatLightPanelless.cssVariables,
    '--sjs2-color-project-brand-600': '#2d6b5e',
    '--sjs2-color-bg-brand-primary-dim': '#225448',
    '--sjs2-color-bg-brand-secondary': '#eaf4ef',
    '--sjs2-color-bg-basic-primary': '#f5f7f5',
    '--sjs2-color-bg-basic-secondary': '#ffffff',
    '--sjs2-color-fg-basic-primary': '#24332d',
    '--sjs2-color-fg-basic-secondary': '#68766d',
    '--sjs2-color-border-basic-secondary': '#d5dfd8',
    '--sjs2-color-utility-surface-survey': '#ffffff',
    '--sjs2-color-component-panel-default-bg': '#ffffff',
    '--sjs2-color-component-panel-simple-default-bg': '#ffffff',
    '--sjs2-color-component-panel-nested-default-bg': '#ffffff',
    '--sjs2-typography-font-family-text': '"Open Sans", sans-serif',
    '--sjs2-typography-font-size-default': '14px',
    '--sjs2-typography-line-height-default': '22px',
    '--sjs2-typography-font-size-component-input-content': '15px',
    '--sjs2-typography-font-size-component-question-title': '14px',
    '--sjs2-typography-font-weight-component-question-title': '600',
    '--sjs2-typography-font-size-component-survey-header-title': '18px',
    '--sjs2-typography-line-height-component-survey-header-title': '26px',
    '--sjs2-typography-font-size-component-survey-header-description': '14px',
    '--sjs2-typography-line-height-component-survey-header-description': '22px',
    '--sjs2-radius-form': '6px',
    '--sjs2-radius-component-action': '6px',
    '--sjs2-border-effect-component-formbox-default': '0 0 0 1px #d5dfd8',
    '--sjs2-border-effect-component-formbox-hovered': '0 0 0 1px #a5bdae',
    '--sjs2-border-effect-component-formbox-focused': '0 0 0 2px #2d6b5e',
    '--sjs2-layout-component-survey-box-padding-top': '24px',
    '--sjs2-layout-component-survey-box-padding-bottom': '24px',
    '--sjs2-layout-component-survey-box-gap-vertical': '24px',
    '--sjs2-layout-component-survey-header-padding-horizontal': '24px',
    '--sjs2-layout-component-survey-header-gap-vertical': '6px',
    '--sjs2-layout-component-page-content-area-padding-horizontal': '24px',
    '--sjs2-layout-component-page-content-area-gap-horizontal': '24px',
    '--sjs2-layout-component-page-content-area-gap-vertical': '24px',
    '--sjs2-layout-component-survey-footer-padding-horizontal': '24px',
    '--sjs2-layout-component-survey-footer-action-group-gap': '12px',
    '--sjs2-layout-component-question-header-padding-bottom': '0px',
    '--sjs2-layout-component-question-box-gap-vertical': '8px',
    '--sjs2-layout-component-input-medium-content-padding-vertical': '7px',
    '--sjs2-layout-component-input-medium-content-padding-horizontal': '10px',
    '--sjs2-layout-component-action-medium-box-padding-vertical': '10px',
    '--sjs2-layout-component-action-medium-box-padding-horizontal': '16px',
    '--sjs2-layout-component-action-medium-label-padding-horizontal': '0px',
    '--sjs2-layout-component-action-small-box-padding-vertical': '7px',
    '--sjs2-layout-component-action-large-box-gap': '8px',
    '--sjs2-layout-component-action-large-box-padding-vertical': '11px',
    '--sjs2-layout-component-action-large-box-padding-horizontal': '16px',
    '--sjs2-layout-component-action-large-label-padding-horizontal': '0px',
  },
};

export const CLINIC_DARK_THEME: ITheme = {
  ...FlatDarkPanelless,
  cssVariables: {
    ...FlatDarkPanelless.cssVariables,
    ...Object.fromEntries(
      Object.entries(CLINIC_THEME.cssVariables!).filter(([name]) => /--sjs2-(typography|layout|radius)-/.test(name)),
    ),
    '--sjs2-color-project-brand-600': '#83d0b3',
    '--sjs2-color-bg-brand-primary-dim': '#a1e1c8',
    '--sjs2-color-bg-brand-secondary': '#243e34',
    '--sjs2-color-fg-brand-on-primary': '#10251d',
    '--sjs2-color-bg-basic-primary': '#18251f',
    '--sjs2-color-bg-basic-secondary': '#1e2d25',
    '--sjs2-color-bg-basic-tertiary': '#15211b',
    '--sjs2-color-bg-basic-primary-dim': '#26382e',
    '--sjs2-color-bg-basic-secondary-dim': '#2a3c32',
    '--sjs2-color-bg-neutral-tertiary-dim': '#26382e',
    '--sjs2-color-fg-basic-primary': '#e5eee8',
    '--sjs2-color-fg-basic-secondary': '#a6b9ad',
    '--sjs2-color-border-basic-secondary': '#435c4d',
    '--sjs2-color-utility-body': '#131e18',
    '--sjs2-color-utility-sheet': '#1e2d25',
    '--sjs2-color-utility-surface-survey': '#1e2d25',
    '--sjs2-color-component-panel-default-bg': '#1e2d25',
    '--sjs2-color-component-panel-simple-default-bg': '#1e2d25',
    '--sjs2-color-component-panel-nested-default-bg': '#1e2d25',
    '--sjs2-border-effect-component-formbox-default': '0 0 0 1px #526e5d',
    '--sjs2-border-effect-component-formbox-hovered': '0 0 0 1px #729580',
    '--sjs2-border-effect-component-formbox-focused': '0 0 0 2px #83d0b3',
  },
};

// Feather uses strokes; bind them directly to the native action icon token.
SvgRegistry.registerIcon(
  'clinic-feather-settings',
  `<svg viewBox="0 0 24 24"><g fill="none" stroke="var(--sd-action-icon-color, currentColor)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${FEATHER_ICONS.settings}</g></svg>`,
);

// Presentation preferences are separate from patient data and form answers.
const DEMO_DISPLAY_KEY = 'healthcare-display-v1';
export const demoDisplay: { mode: 'light' | 'dark'; outlines: boolean } = { mode: 'light', outlines: true };
try {
  const saved = JSON.parse(localStorage.getItem(DEMO_DISPLAY_KEY) ?? 'null');
  if (saved) demoDisplay.mode = saved.mode === 'dark' ? 'dark' : 'light';
} catch {
  // Storage may be unavailable; keep the defaults.
}

export function saveDemoDisplay(): void {
  try {
    localStorage.setItem(DEMO_DISPLAY_KEY, JSON.stringify({ mode: demoDisplay.mode }));
  } catch {
    // Storage may be unavailable; the choice lasts for this page view.
  }
}

const getClinicTheme = () => (demoDisplay.mode === 'dark' ? CLINIC_DARK_THEME : CLINIC_THEME);

export function applyClinicDisplay(): void {
  document.documentElement.dataset.theme = demoDisplay.mode;
  document.documentElement.dataset.surveyOutlines = String(demoDisplay.outlines);
  // Clear the previous palette's overrides before installing the selected one.
  const variables = new Set([
    ...Object.keys(CLINIC_THEME.cssVariables!),
    ...Object.keys(CLINIC_DARK_THEME.cssVariables!),
  ]);
  variables.forEach((name) => document.documentElement.style.removeProperty(name));
  Object.entries(getClinicTheme().cssVariables!).forEach(([name, value]) =>
    document.documentElement.style.setProperty(name, value),
  );
}

export interface ClinicFormOptions {
  host?: string;
  dynamicPanels?: boolean;
}

// Native Form Library design tokens. Keep local component values off the
// document root so they cannot leak into Creator or unrelated form variants.
export function getClinicFormTheme({ host = '', dynamicPanels = false }: ClinicFormOptions = {}): ITheme {
  const base = getClinicTheme();
  const dark = demoDisplay.mode === 'dark';
  const compact = matchMedia('(max-width:760px)').matches;
  const inset = compact ? '20px' : '24px';
  const panelInset = matchMedia('(max-width:480px)').matches ? '16px' : '24px';
  const surface = dark ? '#1e2d25' : '#ffffff';
  const brand = dark ? '#83d0b3' : '#2d6b5e';
  const border = dark ? '#526e5d' : '#cfdcd3';
  const hover = dark ? '#2b4335' : '#f0f6f1';
  const filters = host === 'survey-search' || host === 'medication-filters';
  const vars: Record<string, string> = {
    '--clinic-form-inset': inset,
    '--sjs2-layout-component-survey-header-padding-horizontal': inset,
    '--sjs2-typography-font-weight-component-survey-header-title': '600',
    '--sjs2-typography-font-weight-component-action-large-content': '600',
    '--sjs2-layout-component-page-content-area-padding-horizontal': filters ? '0px' : inset,
    '--sjs2-layout-component-survey-footer-padding-horizontal': filters ? '0px' : inset,
    '--sjs2-layout-component-survey-footer-padding-top': '0px',
    '--sjs2-layout-component-survey-footer-padding-bottom': '0px',
    '--sjs2-layout-component-survey-box-gap-vertical': filters ? inset : '24px',
    '--sjs2-layout-component-survey-box-padding-bottom': filters ? inset : '24px',
    '--sjs2-color-bg-basic-primary': surface,
    '--sjs2-color-component-action-brand-tertiary-surface-default-bg': surface,
    '--sjs2-color-component-action-brand-tertiary-surface-hovered-bg': hover,
    '--sjs2-color-component-action-brand-tertiary-surface-default-label': brand,
    '--sjs2-color-component-action-brand-tertiary-surface-hovered-label': brand,
    '--sjs2-color-component-action-brand-tertiary-surface-default-icon': brand,
    '--sjs2-color-component-action-brand-tertiary-surface-hovered-icon': brand,
    '--sjs2-border-effect-component-action-brand-tertiary-surface-default': `0 0 0 1px ${border}`,
    '--sjs2-border-effect-component-action-brand-tertiary-surface-hovered': `0 0 0 1px ${dark ? '#729580' : '#a7c0b0'}`,
    '--sjs2-layout-component-action-large-icon-padding-vertical': '0px',
    '--sjs2-layout-component-action-large-icon-padding-horizontal': '0px',
  };
  if (dynamicPanels) {
    Object.assign(vars, {
      '--sjs2-layout-component-panel-header-padding-top': '16px',
      '--sjs2-layout-component-panel-header-padding-bottom': '16px',
      '--sjs2-layout-component-panel-header-padding-left': panelInset,
      '--sjs2-layout-component-panel-header-padding-right': panelInset,
      '--sjs2-layout-component-panel-content-area-padding-top': '8px',
      '--sjs2-layout-component-panel-content-area-padding-bottom': panelInset,
      '--sjs2-layout-component-panel-content-area-padding-horizontal': panelInset,
      '--sjs2-layout-component-panel-footer-padding-top': '0px',
      '--sjs2-layout-component-panel-footer-padding-bottom': panelInset,
      '--sjs2-layout-component-panel-footer-padding-left': panelInset,
      '--sjs2-layout-component-panel-footer-padding-right': panelInset,
    });
  }
  return { ...base, cssVariables: { ...base.cssVariables, ...vars } };
}

// Mounted form models, re-themed when the display mode or viewport changes.
const clinicModels = new Map<Model, ClinicFormOptions>();
let activeCreator: SurveyCreator | null = null;

export function applyClinicFormTheme(model: Model, options: ClinicFormOptions): void {
  model.applyTheme(getClinicFormTheme(options));
}

export function registerClinicModel(model: Model, options: ClinicFormOptions): () => void {
  clinicModels.set(model, options);
  return () => {
    clinicModels.delete(model);
  };
}

for (const query of ['(max-width:760px)', '(max-width:480px)']) {
  matchMedia(query).addEventListener('change', () =>
    clinicModels.forEach((options, model) => applyClinicFormTheme(model, options)),
  );
}

// Creator keeps its native layout and uses the clinic's semantic color tokens.
function getClinicCreatorTheme(): ITheme {
  const dark = demoDisplay.mode === 'dark';
  const palette = Object.fromEntries(
    Object.entries(getClinicTheme().cssVariables!)
      // Form models can add panelless component overrides when applying their theme.
      // Share the palette, but keep Creator's own component backgrounds.
      .filter(([name]) => name.startsWith('--sjs2-color-') && !name.startsWith('--sjs2-color-component-')),
  );
  const surface = dark ? '#1e2d25' : '#ffffff';
  const canvas = dark ? '#131e18' : '#f5f7f5';
  return {
    themeName: 'default',
    colorPalette: demoDisplay.mode,
    cssVariables: {
      ...palette,
      '--sjs2-typography-font-family-text': '"Open Sans", sans-serif',
      '--sjs2-color-bg-basic-primary': surface,
      '--sjs2-color-bg-basic-secondary': dark ? '#18251f' : '#f5f7f5',
      '--sjs2-color-bg-basic-primary-dim': dark ? '#293f32' : '#edf3ee',
      '--sjs2-color-bg-basic-secondary-dim': dark ? '#263a2e' : '#eaf1ec',
      '--sjs2-color-component-panel-default-bg': surface,
      '--sjs2-color-component-panel-simple-default-bg': surface,
      '--sjs2-color-component-panel-nested-default-bg': surface,
      '--sjs2-color-utility-body': canvas,
      '--sjs2-color-utility-sheet': surface,
      '--sjs2-color-utility-toolbox': surface,
      '--sjs2-color-utility-property-grid': surface,
      '--sjs2-color-utility-tabs': surface,
      '--sjs2-color-utility-surface-designer': canvas,
      '--sjs2-color-utility-surface-json-editor': surface,
      '--sjs2-color-utility-surface-logic': canvas,
      '--sjs2-color-utility-surface-translations': canvas,
      '--sjs2-color-utility-surface-presets-manager': canvas,
    },
  };
}

export function applyClinicCreatorTheme(editor: SurveyCreator | null): void {
  if (!editor) return;
  const preview = (editor.getPlugin('preview') as any)?.model?.survey as Model | undefined;
  const previewState = preview ? { data: structuredClone(preview.data), page: preview.currentPageNo } : null;
  editor.preferredColorPalette = demoDisplay.mode;
  editor.applyCreatorTheme(getClinicCreatorTheme() as any);
  editor.applyTheme(getClinicFormTheme({ dynamicPanels: JSON.stringify(editor.JSON).includes('paneldynamic') }));
  const updatedPreview = (editor.getPlugin('preview') as any)?.model?.survey as Model | undefined;
  if (previewState && updatedPreview) {
    updatedPreview.data = previewState.data;
    updatedPreview.currentPageNo = previewState.page;
  }
}

export function setActiveCreator(editor: SurveyCreator | null): void {
  activeCreator = editor;
}

/** Re-themes every mounted form and the open Creator after a display mode change. */
export function reapplyClinicThemes(): void {
  clinicModels.forEach((options, model) => applyClinicFormTheme(model, options));
  applyClinicCreatorTheme(activeCreator);
}

applyClinicDisplay();
