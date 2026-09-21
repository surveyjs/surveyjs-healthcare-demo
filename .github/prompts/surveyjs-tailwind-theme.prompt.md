---
description: 'Restyle SurveyJS forms (and Creator) to match a Tailwind host app using only CSS design-token overrides'
---

# Match SurveyJS to the Tailwind host application

Make all SurveyJS forms — and the Survey Creator preview, if present — look native to this
Tailwind application using **one small CSS file of `--sjs2-*` design-token overrides**.
Delete/avoid: `.sd-*` / `.sv_*` class overrides, `!important`, `:root` token blocks,
hand-built theme objects with dozens of pinned values, and per-component copies of the same hex.

If the `surveyjs-brand-styling` skill is installed in this workspace, read it first
(Case 4 — custom CSS via token overrides) and treat this prompt as the Tailwind-specific recipe.

## Inputs — auto-detect first, ask only what stays ambiguous

- **Brand color(s)**: ${input:brandColor:auto-detect — most-used accent in button/link classes (incl. arbitrary values like bg-[#00695c]) and its hover shade}
- **Control height**: ${input:controlHeight:auto-detect from host inputs/buttons, e.g. text-sm + py-2 → 36px}
- **Corner radius**: ${input:radius:auto-detect — the rounded-* used on host inputs/buttons (e.g. rounded-md)}
- **Embedding**: ${input:embedding:are surveys rendered inside host cards/modals (→ panelless base theme, transparent survey surface, hidden survey title)?}
- **Dark mode**: ${input:darkMode:no | class-based .dark | media query}

Detection sources: the Tailwind entry CSS (`@theme` blocks, `body` styles), then grep components for
`text-(xs|sm|base|lg)`, `rounded-*`, `gray-*/slate-*/zinc-*`, brand hexes, `px-*/py-*` on inputs/buttons,
`shadow-*`, and focus-ring classes.

## Procedure

1. **Inventory the host design language** (colors, type scale, radii, control heights, vertical rhythm,
   card chrome). Record which values are Tailwind theme variables and which are hardcoded constants.

2. **Promote hardcoded brand constants to Tailwind theme variables** in the Tailwind entry CSS:

   ```css
   @theme static {          /* static → variables are emitted even if no utility uses them */
     --font-sans: <host font stack>;
     --color-brand: <brand hex>;
     --color-brand-dark: <hover hex>;
   }
   ```

3. **Base theme in code, look in CSS.** Apply a built-in theme that matches the embedding
   (usually `DefaultLightPanelless` for surveys inside host cards/modals) via `model.applyTheme(...)`
   and `creator.theme = ...`. If the host renders its own headings, set `model.showTitle = false`.

4. **Write one `survey-theme.css`**, imported after `survey-core(.min).css`. Single block scoped to
   `.sjs-theme-overrides` (NEVER `:root` — runtime-injected theme tokens sit on the same element and win
   over inherited values). Every value references a Tailwind variable **with a hex fallback**, because
   Tailwind v4 tree-shakes unused default theme variables:

   ```css
   .sjs-theme-overrides {
     /* brand — one source token, the ramp auto-derives */
     --sjs2-color-project-brand-600: var(--color-brand, #...);
     --sjs2-color-project-brand-700: var(--color-brand-dark, #...);   /* pin hover only if host has an exact one */
     /* typography */
     --sjs2-typography-font-family-text: var(--font-sans, ...);
     --sjs2-typography-font-size-default: var(--text-sm, 0.875rem);
     --sjs2-typography-line-height-default: 1.25rem;                  /* length, not Tailwind's unitless ratio */
     /* surfaces (embedded) */
     --sjs2-color-utility-surface-survey: transparent;
     --sjs2-color-bg-basic-secondary: var(--color-white, #fff);       /* input fill */
     /* text, borders, focus */
     --sjs2-color-fg-basic-primary: var(--color-gray-900, #111827);
     --sjs2-color-fg-basic-secondary: var(--color-gray-500, #6b7280);
     --sjs2-color-component-formbox-default-border: var(--color-gray-300, #d1d5db);
     --sjs2-color-border-brand-primary: var(--color-brand, #...);
     --sjs2-color-utility-a11y: color-mix(in srgb, var(--color-brand, #...) 25%, transparent);
     /* radii */
     --sjs2-radius-form: var(--radius-md, 0.375rem);
     --sjs2-radius-component-drop: var(--radius-md, 0.375rem);
     /* control height: 1lh + 2×input-padding-v + 2×formbox-padding-v */
     --sjs2-layout-component-formbox-medium-padding-vertical: 0px;
     --sjs2-layout-component-input-medium-content-padding-vertical: 8px;   /* 20 + 16 = 36px */
     --sjs2-layout-component-input-medium-content-padding-horizontal: 12px;
     /* spacing, panels, buttons, errors — see gotchas below */
     --sjs2-color-utility-shadow-trigger-default: transparent;             /* flat host buttons */
     --sjs2-palette-red-600: var(--color-red-600, #dc2626);
   }
   ```

5. **Verify at runtime, not by assumption.** Token names and consumers drift between survey-core
   versions. Start the dev server, open the app with browser tooling, and:
   - confirm `.sjs-theme-overrides` is on the survey root and an override actually resolves
     (`getComputedStyle(root).getPropertyValue('--sjs2-...')`);
   - when a spacing/size doesn't respond, find the CSS rule that consumes it: walk
     `document.styleSheets` for the selector (`.sd-body`, `.sd-page`, `.sd-panel`, `.sd-row--multiple`)
     and read which `var(--sjs2-...)` it uses — then override *that* token;
   - screenshot every distinct context: standalone page form, panels, modal form, dropdown popup
     (open it), paneldynamic add/remove, error state, and the Creator if used.

## Verified gotchas (survey-core 3.1.x)

- Row→row spacing on a page is `--sjs2-layout-component-page-box-gap-vertical`
  (NOT `page-content-area-gap-vertical`, which drives multi-column row gaps).
- Outer survey padding is `--sjs2-layout-component-survey-box-padding-top/-bottom`; zero them when embedded.
- `.sd-panel` cards consume the `panel-*` layout family (`panel-header-padding-*`,
  `panel-content-area-padding-*`); `panel-simple-*` styles framed standalone questions instead.
  If panels stay framed, give them host-card padding (~16px) and `--sjs2-radius-component-panel`.
- Panel header divider: `--sjs2-color-component-panel-default-separator`.
- Token *definitions* are runtime-injected `<style>` elements — grepping the shipped
  `survey-core.css` for `--sjs2-...:` finds nothing; inspect in the browser.
- Line-height tokens want lengths; Tailwind's `--text-sm--line-height` is a unitless ratio — don't map it.

## Acceptance

- [ ] One CSS file, token overrides only, scoped to `.sjs-theme-overrides`, loaded after the base CSS
- [ ] Every override references a Tailwind variable (`var(--color-*, fallback)`) where one exists
- [ ] Type scale, control heights, radii, focus ring, vertical rhythm, and panel chrome match the host —
      confirmed by side-by-side screenshots, including hover/focus/error and popups
- [ ] Host theme changes (e.g. editing `@theme`) re-skin the survey with no survey-side edits
