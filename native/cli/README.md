# slateos-native

Add [SlateOS Native](https://slateos.ajinkya.design/native/) components to a React Native or Expo app.
Like shadcn/ui, the code is copied into your project and is yours to change; there is no runtime package.

```sh
npx slateos-native init                    # slateos.json, theme, tokens and primitives, native packages
npx slateos-native add button sheet toast  # components plus everything they need
npx slateos-native list                    # all 53 components; ● marks the ones in this app
```

- **Dependencies resolve themselves.** `add date-picker` also brings Sheet, Calendar and Button, and
  installs Reanimated, Gesture Handler and the rest with `npx expo install`, so the versions match your SDK.
- **Your edits are safe.** If a file differs from the registry, `add` asks before replacing it
  (`--overwrite` replaces, `-y` keeps yours).
- **One import.** The folder's `index.ts` re-exports the core and every component you added:
  `import { Button, Sheet } from '@/components/slate'`.
- **Names you'd guess work.** `add alert-dialog` gives you Dialog, `add tooltip` gives you Popover.

Files keep the kit's layout (`theme.tsx`, `primitives/`, `components/<group>/`), so updates are a plain diff.

## Options

| Flag | |
|---|---|
| `--dir <path>` | Where components go (`init`). Default `components/slate`, or `src/components/slate` when there is a `src/`. |
| `--registry <url or folder>` | Another registry. Default `https://slateos.ajinkya.design/native/r`. |
| `-o, --overwrite` | Replace files you changed. |
| `-y, --yes` | No questions. |
| `--no-install` | Copy files only. |
| `--cwd <path>` | Run in another folder. |

## Registry

Each component is a JSON file at `https://slateos.ajinkya.design/native/r/<name>.json` with its source
files, npm `dependencies` and `registryDependencies` (other items it needs). `registry.json` lists them all.
Other tools can read the same files.

MIT.
