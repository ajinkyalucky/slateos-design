# SlateOS

An open, neutral, minimal design system for the web. Design tokens, plain-CSS components, light and dark themes.

Docs and demo: https://slateos.ajinkya.design

## Use it

```html
<link rel="stylesheet" href="https://slateos.ajinkya.design/dist/slateos.css">
<button class="slate-button">Save</button>
```

Dark mode follows the system. Force a theme with `<html data-theme="dark">` or `"light"`.

## How it works

- `tokens/tokens.json` is the single source of truth, in three layers: primitive, semantic (per theme) and component.
- `npm run build` turns the tokens into CSS custom properties (`--slate-*`), bundles the base styles, components and self-hosted fonts into `dist/`, and assembles the docs site in `public/`.
- The build fails if any text/background pair drops below WCAG AA (4.5:1) in either theme.
- Styles use CSS cascade layers (`slate.tokens`, `slate.base`, `slate.components`), so your own unlayered CSS always wins.

## Develop

```sh
npm install
npm run preview   # builds, then serves http://localhost:4173
```

## License

Code: MIT. Fonts (Inter, JetBrains Mono) are licensed under the SIL Open Font License.
