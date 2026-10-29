# Changelog

## Native CLI 0.1.0

- **`npx slateos-native`** (`native/cli`): shadcn-style CLI for SlateOS Native. `init` sets up `slateos.json`, the theme, tokens and primitives; `add` copies components with everything they need and installs native packages through `npx expo install`; `list` shows what is in the app. Asks before replacing files you changed.
- **Registry** at `/native/r/`: one JSON per component with its source, npm dependencies and the components it needs, generated from the import graph by `scripts/build-native-registry.mjs`.
- Docs lead with the CLI, and every component shows its `add` command.

## Unreleased

- **Native font vibes:** the same 15 as the web through Expo Google Fonts. `<SlateProvider font="elegant">`, or the style's or app vibe's own font (Pebble is Nunito, Flint Space Grotesk, Marble Newsreader headings). Headings (display, title1–3) use the vibe's heading face and weight. Families come from `src/font-themes.css`, so web and Native match; a face that isn't loaded falls back to Inter, then the system font. The showcase loads every face and has a font picker.
- **Ten more font vibes** (15 in all, every one SIL OFL and self-hosted): Modern (Manrope), Clean (DM Sans), Startup (Plus Jakarta Sans), Geometric (Outfit), Corporate (IBM Plex Sans), Expressive (Bricolage Grotesque), Legible (Atkinson Hyperlegible Next), Elegant (Playfair Display), Warm (Fraunces) and Terminal (JetBrains Mono throughout). The header menu groups them as Sans, Serif headings and Mono; the menu, preview cards and runtime list are generated from `tokens/fonts.json`.
- **Phones:** header controls keep a 36pt size instead of being squeezed to nothing, header menus span the screen, and a wide table no longer makes the whole page scroll sideways (its screen-reader-only header label escaped the scroll box).
- **App vibes:** one choice modelled on how a well-known app feels: Coral (Airbnb-like), Cinema (Netflix), Pinboard (Pinterest), Groove (Spotify), Streak (Duolingo), Nightshift (Linear), Paper (Notion) and Ride (Uber). Each sets a style, the app's brand colour, its scheme and dials. Buttons keep the app's exact colour wherever it reaches 4.5:1 with its text, and the build checks every pair. Web: `slate.setVibe()` and an App vibe group in the Style menu. Native: `<SlateProvider vibe>` and a picker in the showcase. Defined in `tokens/vibes.json`.

- **Styles:** six named looks, set with one attribute (`data-style`) or one prop (`<SlateProvider style>`): Slate (default), Quartz (compact, crisp), Pebble (soft, pill controls), Flint (square, no shadows), Mica (layered, soft shadows) and Marble (editorial serif). Defined once in `tokens/styles.json` for web and Native.
- Font, density and corners now override a style, and `slate.setStyle()` resets them. `data-corners="soft"`, `data-density="default"` and `data-font="neutral"` are now explicit values instead of "remove the attribute".
- Cards read new component tokens: `--slate-card-bg`, `--slate-card-border-color` and `--slate-card-shadow`. Native adds `t.style`, `t.component.badgeRadius`, and Card's default variant follows the style.
- Docs: a Style menu in the header, and live previews of every style under Foundations. The Native showcase has a style picker.
- **Native blocks:** 11 whole screens you add with one command (`npx slateos-native add sign-in`): sign in, sign up, verify code, forgot password, onboarding, dashboard, sidebar app shell, inbox, settings, profile and paywall. `add` copies the screen into `blocks/` with every component it uses. Sources in `native/lib/blocks/`, registry items built by `scripts/build-native-blocks.mjs`, previews in the showcase and on the docs page.
- **Native showcase:** a floating theme button on every screen and inside every block (drag it to either edge). Its sheet holds App vibes (same-size sample screens in a snapping carousel), the styles as described rows, appearance and brand, with corners and density tucked under "Fine-tune".

## Native 0.1.0

- **SlateOS Native** (`native/`): `@ajinkyabhagwat/slateos-native` for React Native and Expo. 53 touch-first components on the same tokens, built with Reanimated 4, Gesture Handler 3 and haptics: sheets with detents, swipe rows, scrubbable charts, toasts, menus, pickers and more.
- Tokens, brand presets, corner sets and icons are generated from the web sources (`scripts/build-native.mjs`), plus a mobile layer in `tokens/mobile.json`.
- Docs at `/native/` list every component with its full source to copy (`scripts/build-native-docs.mjs`). The Expo showcase app lives in `native/example`.

## 0.3.0

- **Motion:** 19 groups of loaders, progress, status marks, entrances (up, down, left, right, zoom, blur, flip), overlays, attention loops, hover and press effects, text effects, scroll reveal and count-up. Respects reduced motion.
- **Blocks:** 35 ready-made sections: marketing (header, features, testimonials, pricing, comparison, team, blog, changelog, contact), account (sign up, reset, verify code, setup wizard, profile, security), app (file upload, kanban, search results), plus error and empty pages and checkout.
- **Starter templates:** marketing site, sign-in, app dashboard, billing, team with invite dialog, and a working task app (`/templates/`).
- **Themes:** `dist/themes.css` adds five brand colours and sharp or round corners. All meet WCAG AA.
- **Figma:** colour (Light and Dark), spacing and radius variables published as the SlateOS Kit file.
- 181 components in total.

## 0.2.0

- 127 components, 119 icons, three-layer tokens, light and dark themes.
