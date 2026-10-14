import { ITheme, Model, SvgRegistry } from 'survey-core';
import { DefaultDarkPanelless, DefaultLightPanelless } from 'survey-core/themes';
import type { SurveyCreator } from 'survey-creator-react';
import { FEATHER_ICONS } from '../ui/featherIcons';

// Colors reach SurveyJS from the Tailwind tokens in styles.css through
// src/survey/tailwind-adapter.css. The JS themes below add the light or dark
// base palette for the remaining SurveyJS slots and layout that depends on the
// host or viewport.

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

export function applyClinicDisplay(): void {
  document.documentElement.dataset.theme = demoDisplay.mode;
  document.documentElement.dataset.surveyOutlines = String(demoDisplay.outlines);
}

export interface ClinicFormOptions {
  host?: string;
  dynamicPanels?: boolean;
}

// Variables that stylesheets (the Tailwind adapter and styles.css) set on the theme root.
// A base theme applies its values inline, which would override them, so those are dropped.
let stylesheetVariables: Set<string> | null = null;
function getStylesheetVariables(): Set<string> {
  if (stylesheetVariables) return stylesheetVariables;
  const names = new Set<string>();
  const visit = (rules: CSSRuleList) => {
    for (const rule of rules) {
      if (rule instanceof CSSStyleRule && rule.selectorText.includes('.sjs-theme-overrides')) {
        for (const name of rule.style) if (name.startsWith('--')) names.add(name);
      }
      if ('cssRules' in rule) visit((rule as CSSGroupingRule).cssRules);
    }
  };
  for (const sheet of document.styleSheets) {
    try {
      visit(sheet.cssRules);
    } catch {
      // Cross-origin sheets (web fonts) cannot be read and hold no theme variables.
    }
  }
  return (stylesheetVariables = names);
}

function getBaseTheme(): ITheme {
  const base = demoDisplay.mode === 'dark' ? DefaultDarkPanelless : DefaultLightPanelless;
  const owned = getStylesheetVariables();
  return {
    ...base,
    cssVariables: Object.fromEntries(Object.entries(base.cssVariables ?? {}).filter(([name]) => !owned.has(name))),
  };
}

// Tailwind's md and sm breakpoints, where the host cards tighten their padding.
const compactQuery = matchMedia('(width < 48rem)');
const narrowQuery = matchMedia('(width < 40rem)');

// Kept on each form root so the values cannot leak into Creator or unrelated forms.
export function getClinicFormTheme({ host = '', dynamicPanels = false }: ClinicFormOptions = {}): ITheme {
  const inset = compactQuery.matches ? '20px' : '24px';
  const panelInset = narrowQuery.matches ? '16px' : '24px';
  const filters = host === 'survey-search' || host === 'medication-filters';
  const vars: Record<string, string> = {
    '--clinic-form-inset': inset,
    '--sjs2-layout-component-survey-header-padding-horizontal': inset,
    '--sjs2-layout-component-page-content-area-padding-horizontal': filters ? '0px' : inset,
    '--sjs2-layout-component-survey-footer-padding-horizontal': filters ? '0px' : inset,
    '--sjs2-layout-component-survey-box-gap-vertical': filters ? inset : '24px',
    '--sjs2-layout-component-survey-box-padding-bottom': filters ? inset : '24px',
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
  const base = getBaseTheme();
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

for (const query of [compactQuery, narrowQuery]) {
  query.addEventListener('change', () => clinicModels.forEach((options, model) => applyClinicFormTheme(model, options)));
}

// Creator keeps SurveyJS's native density: the stylesheet layout and type
// overrides meant for embedded forms are reset to the base values on its root.
function getNativeLayoutVariables(): Record<string, string> {
  const probe = document.createElement('div');
  probe.className = 'sd-theme-root';
  document.body.append(probe);
  const style = getComputedStyle(probe);
  const vars = Object.fromEntries(
    [...getStylesheetVariables()]
      .filter((name) => /^--sjs2-(layout|radius|typography)-/.test(name) && !name.includes('font-family'))
      .map((name) => [name, style.getPropertyValue(name).trim()]),
  );
  probe.remove();
  return vars;
}

// Creator panes and canvases use the clinic tokens.
function getClinicCreatorTheme(): ITheme {
  return {
    themeName: 'default',
    colorPalette: demoDisplay.mode,
    cssVariables: {
      ...getNativeLayoutVariables(),
      '--sjs2-color-project-brand-600': 'var(--color-primary)',
      '--sjs2-color-bg-brand-primary-dim': 'var(--color-primary-hover)',
      '--sjs2-color-bg-brand-secondary': 'var(--color-primary-soft)',
      '--sjs2-color-fg-brand-on-primary': 'var(--color-primary-foreground)',
      '--sjs2-color-fg-basic-primary': 'var(--color-foreground)',
      '--sjs2-color-fg-basic-secondary': 'var(--color-muted-foreground)',
      '--sjs2-color-border-basic-secondary': 'var(--color-border)',
      '--sjs2-color-bg-basic-primary': 'var(--color-card)',
      '--sjs2-color-bg-basic-secondary': 'var(--color-background)',
      '--sjs2-color-bg-basic-primary-dim': 'var(--color-accent)',
      '--sjs2-color-bg-basic-secondary-dim': 'var(--color-card-subtle)',
      '--sjs2-color-component-panel-default-bg': 'var(--color-card)',
      '--sjs2-color-utility-body': 'var(--color-background)',
      '--sjs2-color-utility-sheet': 'var(--color-card)',
      '--sjs2-color-utility-toolbox': 'var(--color-card)',
      '--sjs2-color-utility-property-grid': 'var(--color-card)',
      '--sjs2-color-utility-tabs': 'var(--color-card)',
      '--sjs2-color-utility-surface-survey': 'var(--color-card)',
      '--sjs2-color-utility-surface-designer': 'var(--color-background)',
      '--sjs2-color-utility-surface-json-editor': 'var(--color-card)',
      '--sjs2-color-utility-surface-logic': 'var(--color-background)',
      '--sjs2-color-utility-surface-translations': 'var(--color-background)',
      '--sjs2-color-utility-surface-presets-manager': 'var(--color-background)',
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
