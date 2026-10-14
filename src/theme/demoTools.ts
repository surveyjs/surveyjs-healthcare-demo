import { iconMarkup } from '../ui/Icon';
import { applyClinicDisplay, demoDisplay, reapplyClinicThemes, saveDemoDisplay } from './clinicTheme';

// Presentation preferences are separate from patient data and form answers.
function createDemoTools() {
  const dock = document.createElement('div');
  dock.className = 'demo-dock';
  // A manual popover puts the toolbar above native modal dialogs as well as
  // SurveyJS overlays; a large z-index alone cannot cross the browser top layer.
  const topLayer = typeof dock.showPopover === 'function';
  if (topLayer) dock.setAttribute('popover', 'manual');
  dock.setAttribute('role', 'toolbar');
  dock.setAttribute('aria-label', 'Demo display options');
  dock.innerHTML =
    '<button type="button" data-demo-action="theme"></button><button type="button" data-demo-action="outlines" aria-label="Highlight SurveyJS components"></button>';
  const themeButton = dock.querySelector<HTMLButtonElement>('[data-demo-action="theme"]')!;
  const outlinesButton = dock.querySelector<HTMLButtonElement>('[data-demo-action="outlines"]')!;

  function update() {
    const dark = demoDisplay.mode === 'dark';
    themeButton.innerHTML = iconMarkup(dark ? 'moon' : 'sun') + `<span>${dark ? 'Dark' : 'Light'}</span>`;
    themeButton.setAttribute('aria-label', `Switch to ${dark ? 'light' : 'dark'} theme`);
    themeButton.title = `Switch to ${dark ? 'light' : 'dark'} theme`;
    outlinesButton.innerHTML = iconMarkup('maximize') + '<span>SurveyJS blocks</span>';
    outlinesButton.setAttribute('aria-pressed', String(demoDisplay.outlines));
    outlinesButton.title = (demoDisplay.outlines ? 'Hide' : 'Show') + ' outlines around SurveyJS components';
  }

  dock.addEventListener('click', (event) => {
    const action = (event.target as Element).closest<HTMLElement>('[data-demo-action]')?.dataset.demoAction;
    if (!action) return;
    if (action === 'theme') demoDisplay.mode = demoDisplay.mode === 'light' ? 'dark' : 'light';
    else demoDisplay.outlines = !demoDisplay.outlines;
    applyClinicDisplay();
    if (action === 'theme') reapplyClinicThemes();
    saveDemoDisplay();
    update();
  });
  dock.addEventListener('keydown', (event) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const target =
      event.key === 'Home'
        ? themeButton
        : event.key === 'End'
          ? outlinesButton
          : document.activeElement === themeButton
            ? outlinesButton
            : themeButton;
    target.focus();
  });
  update();
  document.body.append(dock);
  if (topLayer) dock.showPopover();

  return {
    /** Moves the dock into an open modal dialog so it stays above it, or back to the page. */
    attach(container: HTMLElement = document.body) {
      if (topLayer && dock.matches(':popover-open')) dock.hidePopover();
      container.append(dock);
      if (topLayer) dock.showPopover();
    },
    mark(element: HTMLElement, label = 'SurveyJS renders this') {
      const parent = element.parentElement;
      // When a card contains only a native form, place its glow on the card so
      // overflow clipping cannot hide the halo behind the SurveyJS surface.
      const frame = parent?.matches('.panel') && parent.children.length === 1 ? parent : element;
      frame.dataset.surveyComponent = label;
    },
  };
}

export const demoTools = createDemoTools();
