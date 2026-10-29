# SlateOS

An open design system for the web: crisp, dense and accessible. 127 components, 119 icons, three-layer tokens, light and dark themes. Plain CSS, no dependencies.

Docs and demo: https://slateos.ajinkya.design

## Native

SlateOS also ships for React Native and Expo: 53 touch-first components on the same tokens, in [`native/`](native/lib/README.md). Docs and copyable source: https://slateos.ajinkya.design/native/

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

## Styles

Six named styles, each a complete look: corners, sizing, card surfaces, shadows and type. Load the theme files, then set one attribute:

```html
<link rel="stylesheet" href="https://slateos.ajinkya.design/dist/font-themes.css">
<link rel="stylesheet" href="https://slateos.ajinkya.design/dist/themes.css">
<html data-style="pebble">
```

| Style | Look |
|---|---|
| `slate` | Balanced and quiet. The default. |
| `quartz` | Compact and crisp (Geist), flat cards. For dashboards and tools. |
| `pebble` | Soft and round (Nunito): pill buttons, filled cards, roomy. |
| `flint` | Square and engineered (Space Grotesk): hard edges, no shadows. |
| `mica` | Layered: cards lift on soft shadows. |
| `marble` | Editorial (Newsreader headings): hairlines and generous space. |

Font, density, corners and brand still work on top: `<html data-style="pebble" data-font="neutral">`. Set `data-style` on any element to scope it, or call `slate.setStyle('flint')`, which also clears the other dials so the style shows as designed. Styles are defined once in `tokens/styles.json`; SlateOS Native reads the same file (`<SlateProvider style="pebble">`).

## App vibes

People describe the app they want by naming one ("make it feel like Airbnb"). An app vibe is that, in one choice: a style plus the app's signature colour, scheme and dials, defined once in `tokens/vibes.json` for web and Native. Buttons use the app's own colour wherever it keeps 4.5:1 with its text; links and text use a tuned version. The build fails if any pair drops below AA.

```js
slate.setVibe('coral');   // needs dist/themes.css; slate.setVibe(null) goes back to the defaults
```

| Vibe | Feels like | |
|---|---|---|
| `coral` | Airbnb | Warm coral, photo-first cards on soft shadows, roomy. |
| `cinema` | Netflix | Dark and dramatic: one bold red, flat surfaces, dense rows. |
| `pinboard` | Pinterest | Round everything: pill buttons, soft filled cards, a bright red. |
| `groove` | Spotify | Near-black with a vivid green, pill buttons and bold type. |
| `streak` | Duolingo | Playful and chunky: bright green, round shapes, friendly type. |
| `nightshift` | Linear | A calm dark tool: indigo accent, compact and crisp. |
| `paper` | Notion | A quiet document: lots of white, hairlines, a serif voice. |
| `ride` | Uber | Black and white, square and direct. Nothing extra. |

Picking a brand colour afterwards replaces the vibe's colours; the style, density, corner and font dials still override it. The names are our own; the apps are referenced only to describe the feel.

## Font vibes

Five optional font pairings, all open source (SIL OFL) and self-hosted. Load the extra stylesheet, then set one attribute:

```html
<link rel="stylesheet" href="https://slateos.ajinkya.design/dist/font-themes.css">
<html data-font="editorial">
```

`neutral` (default, Inter) · `crisp` (Geist) · `friendly` (Nunito) · `editorial` (Newsreader headlines, Inter body) · `technical` (Space Grotesk). A vibe's font files download only when it is used. Set `data-font` on any element to scope it, or call `slate.setFont('crisp')`. Headings use the `--slate-font-family-display` token, so you can also set your own.

## Brand color

The default accent is black (white in dark mode). Load the optional stylesheet to switch to one of five well-loved presets, or to any color of your own:

```html
<link rel="stylesheet" href="https://slateos.ajinkya.design/dist/themes.css">
<html data-brand="violet">   <!-- blue | violet | green | orange | rose -->
```

```js
slate.setBrandColor('#6366f1');   // any hex color
```

A custom color is tuned for each theme (darker on light, lighter on dark) so button text and links keep WCAG AA contrast (4.5:1), whatever you pick. The choice is saved per visitor. `slate.setBrand('default')` goes back to the default, and `data-corners="sharp | soft | round"` overrides the style's corner radius.

## Develop

```sh
npm install
npm run preview   # builds, then serves http://localhost:4173
```

## License

Code: MIT. Fonts (Inter, JetBrains Mono) are licensed under the SIL Open Font License.

## Starter templates and themes

Open pages in `public/templates/` (marketing site, sign-in, app dashboard) and copy what you need. Add `dist/themes.css`, then set `data-style="slate|quartz|pebble|flint|mica|marble"`, `data-brand="blue|violet|green|orange|rose"` and `data-corners="sharp|soft|round"` on `<html>` to restyle everything. All brand colours meet WCAG AA.
