import { demoExamples } from './demoExamples';
import { iconMarkup } from '../ui/Icon';

/** Native popover, inside the dock so links also work above a modal dialog. */
export function createDemoMenu(dock: HTMLElement, trigger: HTMLButtonElement) {
  const menu = document.createElement('div');
  menu.id = 'demo-examples';
  menu.className = 'demo-examples';
  menu.setAttribute('popover', 'auto');
  menu.setAttribute('role', 'dialog');
  menu.setAttribute('aria-label', 'More Examples');
  menu.lang = 'en';
  menu.tabIndex = -1;
  menu.innerHTML = '<div class="demo-examples-heading"><span>SurveyJS in your app</span><span class="demo-examples-badge">Full</span></div>';
  const list = document.createElement('ul');
  demoExamples.forEach((example, index) => {
    const current = example.id === 'healthcare';
    const row = document.createElement('li');
    if (index > 0 && example.group !== demoExamples[index - 1].group) row.className = 'demo-examples-group';
    const link = document.createElement('a');
    link.href = current ? '/manage' : example.href;
    if (current) link.setAttribute('aria-current', 'page');
    else {
      link.target = '_blank';
      link.rel = 'noreferrer';
    }
    const name = document.createElement('strong');
    name.textContent = example.name;
    if (!current) name.insertAdjacentHTML('beforeend', iconMarkup('external-link', 'demo-examples-external'));
    const description = document.createElement('span');
    description.textContent = example.description;
    link.append(name, description);
    row.append(link);
    list.append(row);
  });
  const more = document.createElement('li');
  more.className = 'demo-examples-group';
  more.innerHTML = `<a href="https://surveyjs.io/use-cases" target="_blank" rel="noreferrer"><strong>More Use Cases${iconMarkup('external-link', 'demo-examples-external')}</strong></a>`;
  list.append(more);
  menu.append(list);
  dock.append(menu);

  trigger.setAttribute('aria-haspopup', 'dialog');
  trigger.setAttribute('aria-controls', menu.id);
  trigger.setAttribute('aria-expanded', 'false');
  // Let the browser treat the trigger as the popover's invoker. A custom click
  // toggle would reopen it after native light-dismiss has already closed it.
  trigger.popoverTargetElement = menu;
  trigger.popoverTargetAction = 'toggle';

  function position() {
    if (!menu.matches(':popover-open')) return;
    const anchor = trigger.getBoundingClientRect();
    menu.style.maxHeight = `${Math.max(0, anchor.top - 20)}px`;
    menu.style.left = `${Math.max(12, Math.min(anchor.left, window.innerWidth - menu.offsetWidth - 12))}px`;
    menu.style.bottom = `${window.innerHeight - anchor.top + 8}px`;
  }
  function close(restoreFocus = false) {
    if (menu.matches(':popover-open')) menu.hidePopover();
    trigger.setAttribute('aria-expanded', 'false');
    dock.dataset.menuOpen = 'false';
    if (restoreFocus) trigger.focus({ preventScroll: true });
  }
  function open() {
    if (!menu.matches(':popover-open')) trigger.click();
  }
  menu.addEventListener('beforetoggle', (event: ToggleEvent) => {
    const opening = event.newState === 'open';
    trigger.setAttribute('aria-expanded', String(opening));
    dock.dataset.menuOpen = String(opening);
    if (!opening) return;
    dock.dataset.tooltipsDismissed = 'true';
    requestAnimationFrame(() => {
      if (!menu.matches(':popover-open')) return;
      position();
      menu.querySelector<HTMLElement>('[aria-current="page"]')?.focus({ preventScroll: true });
    });
  });
  trigger.addEventListener('keydown', (event) => {
    if (['ArrowDown', 'ArrowUp'].includes(event.key)) {
      event.preventDefault();
      event.stopPropagation();
      open();
    }
  });
  menu.addEventListener('toggle', () => {
    const open = menu.matches(':popover-open');
    trigger.setAttribute('aria-expanded', String(open));
    dock.dataset.menuOpen = String(open);
  });
  menu.addEventListener('click', (event) => {
    if ((event.target as Element).closest('a')) close();
  });
  menu.addEventListener('keydown', (event) => {
    event.stopPropagation();
    if (event.key === 'Escape') {
      event.preventDefault();
      close(true);
    } else if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
      event.preventDefault();
      const links = [...menu.querySelectorAll('a')];
      const index = links.indexOf(document.activeElement as HTMLAnchorElement);
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? links.length - 1
        : (index + (event.key === 'ArrowDown' ? 1 : -1) + links.length) % links.length;
      links[next].focus();
    }
  });
  window.addEventListener('resize', position);
  return { close };
}
