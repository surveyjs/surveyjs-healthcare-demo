import { iconMarkup } from '../ui/Icon';
import { applyClinicDisplay, demoDisplay, reapplyClinicThemes, saveDemoDisplay } from './clinicTheme';

// Presentation preferences are separate from patient data and form answers.
// `demo-dock` is a hook: modal dialogs shorten themselves while the dock is inside them.
const DOCK_CLASS =
  'demo-dock fixed inset-auto bottom-[calc(16px+env(safe-area-inset-bottom,0px))] left-1/2 z-10000 m-0 w-max max-w-[calc(100vw-24px)] -translate-x-1/2 overflow-visible rounded-full border-0 bg-transparent p-0 text-foreground backdrop:pointer-events-none backdrop:bg-transparent';
const DOCK_BUTTON_CLASS =
  'inline-flex size-11 cursor-default items-center justify-center rounded-full text-foreground hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-1 aria-pressed:bg-muted';

function createDemoTools() {
  const dock = document.createElement('div');
  dock.className = DOCK_CLASS;
  // A manual popover puts the toolbar above native modal dialogs as well as
  // SurveyJS overlays; a large z-index alone cannot cross the browser top layer.
  const topLayer = typeof dock.showPopover === 'function';
  if (topLayer) dock.setAttribute('popover', 'manual');
  dock.setAttribute('role', 'toolbar');
  dock.setAttribute('aria-label', 'Demo Tools');
  dock.innerHTML =
    '<div class="demo-dock-panel relative flex items-center gap-1 rounded-full border border-border bg-card px-2 py-1.5 shadow-dock">' +
    `<span class="demo-dock-control"><button type="button" class="${DOCK_BUTTON_CLASS}" data-demo-action="outlines" aria-label="Highlight SurveyJS" aria-describedby="demo-outlines-tooltip"></button><span role="tooltip" id="demo-outlines-tooltip" class="demo-dock-tooltip"></span></span>` +
    `<span class="demo-dock-control"><button type="button" class="${DOCK_BUTTON_CLASS}" data-demo-action="theme" aria-label="Switch Theme" aria-describedby="demo-theme-tooltip"></button><span role="tooltip" id="demo-theme-tooltip" class="demo-dock-tooltip">Switch Theme</span></span></div>`;
  const themeButton = dock.querySelector<HTMLButtonElement>('[data-demo-action="theme"]')!;
  const outlinesButton = dock.querySelector<HTMLButtonElement>('[data-demo-action="outlines"]')!;
  const outlinesTooltip = dock.querySelector<HTMLElement>('#demo-outlines-tooltip')!;

  function update() {
    const dark = demoDisplay.mode === 'dark';
    themeButton.innerHTML = iconMarkup(dark ? 'moon' : 'sun', 'size-4.5');
    outlinesButton.innerHTML = iconMarkup('maximize', 'size-4.5');
    outlinesButton.setAttribute('aria-pressed', String(demoDisplay.outlines));
    outlinesTooltip.textContent = (demoDisplay.outlines ? 'Hide' : 'Show') + ' SurveyJS Outlines';
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
  for (const control of dock.querySelectorAll<HTMLElement>('.demo-dock-control')) {
    control.addEventListener('pointerenter', () => delete dock.dataset.tooltipsDismissed);
  }
  dock.addEventListener('focusin', () => delete dock.dataset.tooltipsDismissed);
  dock.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !dock.dataset.tooltipsDismissed) {
      dock.dataset.tooltipsDismissed = 'true';
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const target =
      event.key === 'Home'
        ? outlinesButton
        : event.key === 'End'
          ? themeButton
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
