import { iconMarkup } from '../ui/Icon';
import { applyClinicDisplay, demoDisplay, reapplyClinicThemes, saveDemoDisplay } from './clinicTheme';

// Presentation preferences are separate from patient data and form answers.
// `demo-dock` is a hook: modal dialogs shorten themselves while the dock is inside them.
const DOCK_CLASS =
  'demo-dock fixed inset-auto right-[calc(16px+env(safe-area-inset-right,0px))] bottom-[calc(16px+env(safe-area-inset-bottom,0px))] z-10000 m-0 flex w-max max-w-[calc(100vw-24px)] items-center gap-1 overflow-visible rounded-full border border-border bg-card/92 px-2 py-1.5 text-foreground shadow-dock backdrop-blur-[14px] backdrop:pointer-events-none backdrop:bg-transparent';
const DOCK_BUTTON_CLASS =
  'inline-flex min-h-11 items-center justify-center gap-1.5 rounded-full px-2.5 py-2 text-[11px] leading-5 font-semibold whitespace-nowrap text-foreground hover:bg-card-subtle focus-visible:outline-2 focus-visible:outline-offset-1 aria-pressed:bg-primary-soft aria-pressed:text-primary sm:gap-2 sm:px-3.5 sm:text-xs';

function createDemoTools() {
  const dock = document.createElement('div');
  dock.className = DOCK_CLASS;
  // A manual popover puts the toolbar above native modal dialogs as well as
  // SurveyJS overlays; a large z-index alone cannot cross the browser top layer.
  const topLayer = typeof dock.showPopover === 'function';
  if (topLayer) dock.setAttribute('popover', 'manual');
  dock.setAttribute('role', 'toolbar');
  dock.setAttribute('aria-label', 'Demo display options');
  dock.innerHTML =
    `<button type="button" class="${DOCK_BUTTON_CLASS}" data-demo-action="theme"></button>` +
    `<button type="button" class="${DOCK_BUTTON_CLASS}" data-demo-action="outlines" aria-label="Highlight SurveyJS components"></button>`;
  const themeButton = dock.querySelector<HTMLButtonElement>('[data-demo-action="theme"]')!;
  const outlinesButton = dock.querySelector<HTMLButtonElement>('[data-demo-action="outlines"]')!;

  function update() {
    const dark = demoDisplay.mode === 'dark';
    themeButton.innerHTML = iconMarkup(dark ? 'moon' : 'sun', 'size-4.5') + `<span>${dark ? 'Dark' : 'Light'}</span>`;
    themeButton.setAttribute('aria-label', `Switch to ${dark ? 'light' : 'dark'} theme`);
    themeButton.title = `Switch to ${dark ? 'light' : 'dark'} theme`;
    outlinesButton.innerHTML = iconMarkup('maximize', 'size-4.5') + '<span>SurveyJS blocks</span>';
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
