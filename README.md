# SlateOS

An open design system for the web: crisp, dense and accessible. 127 components, 119 icons, three-layer tokens, light and dark themes. Plain CSS, no dependencies.

Docs and demo: https://slateos.ajinkya.design

## Use it

```html
<link rel="stylesheet" href="https://slateos.ajinkya.design/dist/slateos.css">
<script src="https://slateos.ajinkya.design/dist/slateos.js" defer></script>  <!-- optional behaviour -->
<script src="https://slateos.ajinkya.design/dist/icons.js" defer></script>    <!-- optional icon sprite -->

<button class="slate-button">Save</button>
```

Or from npm:

```sh
npm install @ajinkyabhagwat/slateos
```

```js
import '@ajinkyabhagwat/slateos/dist/slateos.css'; // bundlers; also dist/slateos.min.css, dist/tokens.json, dist/icons.svg
```

Dark mode follows the system. Force a theme with `<html data-theme="dark">` or `"light"`.

## How it works

- `tokens/tokens.json` is the single source of truth, in three layers: primitive, semantic (per theme) and component.
- `npm run build` turns the tokens into CSS custom properties (`--slate-*`), bundles the base styles, components and self-hosted fonts into `dist/`, and assembles the docs site in `public/`.
- The build fails if any text/background pair drops below WCAG AA (4.5:1) in either theme.
- Styles use CSS cascade layers (`slate.tokens`, `slate.base`, `slate.components`), so your own unlayered CSS always wins.

## What's inside

General (buttons, badges, avatars, tags…) · Typography · Layout (grid, bento, app shell) · Forms (inputs, combobox, date picker, upload, OTP…) · Data display (tables, stats, charts, timeline, kanban…) · Feedback · Navigation · Overlays (dialog, drawer, sheet, command palette…) · Patterns (sign-in, pricing, settings, comments…)

Docs specimens live in `docs/*.html`. The build renders each one with a live preview and a copyable code view. Add a component by adding a `<!-- @c Name | description -->` block.

## Cohesion

- **Lint:** `npm run build` runs `scripts/lint.mjs` first. It fails on raw colours, raw radii, off-scale spacing, off-grid sizes, raw z-indexes and raw motion durations in `src/components`. Use tokens, or add `/* lint-allow */` for a genuine one-off.
- **Density:** set `data-density="compact"` or `"comfortable"` on any element (or `<html>`). Controls, rows, menus, nav items and card padding scale together. Tokens live under `density` in `tokens.json`.
- **State recipe:** disabled opacity, focus ring and focus halo come from shared tokens, so every component behaves the same.
- **Docs:** every component has a "use for / avoid for" note in `docs/usage.json`. The build fails if one is missing.

## Font vibes

Five optional font pairings, all open source (SIL OFL) and self-hosted. Load the extra stylesheet, then set one attribute:

```html
<link rel="stylesheet" href="https://slateos.ajinkya.design/dist/font-themes.css">
<html data-font="editorial">
```

`neutral` (default, Inter) · `crisp` (Geist) · `friendly` (Nunito) · `editorial` (Newsreader headlines, Inter body) · `technical` (Space Grotesk). A vibe's font files download only when it is used. Set `data-font` on any element to scope it, or call `slate.setFont('crisp')`. Headings use the `--slate-font-family-display` token, so you can also set your own.

## Develop

```sh
npm install
npm run preview   # builds, then serves http://localhost:4173
```

## License

Code: MIT. Fonts (Inter, JetBrains Mono) are licensed under the SIL Open Font License.

## Starter templates and themes

Open pages in `public/templates/` (marketing site, sign-in, app dashboard) and copy what you need. Add `dist/themes.css`, then set `data-brand="blue|violet|green|orange|rose"` and `data-corners="sharp|round"` on `<html>` to restyle everything. All brand colours meet WCAG AA.
