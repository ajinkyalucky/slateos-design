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
npm install slateos
```

```js
import 'slateos/dist/slateos.css'; // bundlers; also dist/slateos.min.css, dist/tokens.json, dist/icons.svg
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

## Develop

```sh
npm install
npm run preview   # builds, then serves http://localhost:4173
```

## License

Code: MIT. Fonts (Inter, JetBrains Mono) are licensed under the SIL Open Font License.
