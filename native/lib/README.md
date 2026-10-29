# SlateOS Native

SlateOS for React Native and Expo: 53 touch-first components on the same tokens as the web.
Targets are 44pt, springs run on the UI thread, haptics are built in, and gestures come from Gesture
Handler 3. Light and dark, five brand colours or any colour you pass (tuned for AA contrast in each
scheme), three corner styles and three densities.

Docs, with every component's source to copy: https://slateos.ajinkya.design/native/

## Add components with the CLI (recommended)

Like shadcn/ui: the code is copied into your app and is yours to change.

```sh
npx slateos-native init
npx slateos-native add button sheet toast
```

`init` copies the theme, tokens and primitives into `components/slate/` and installs the native packages;
`add` copies components plus whatever they need. Import them from the folder: `import { Button } from '@/components/slate'`.
See [the CLI](../cli/README.md).

## Or install the package

```sh
npx expo install @ajinkyabhagwat/slateos-native react-native-reanimated react-native-worklets \
  react-native-gesture-handler react-native-safe-area-context react-native-svg expo-haptics @expo-google-fonts/inter
```

`expo-haptics` is optional: without it, components stay silent. The package ships TypeScript source; Metro compiles it.

## Set up

```tsx
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { SlateProvider, Toaster } from '@ajinkyabhagwat/slateos-native';

export default function Root() {
  const [loaded] = useFonts({ Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold });
  if (!loaded) return null;
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <SlateProvider>
          <Stack />
          <Toaster />
        </SlateProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
```

`SlateProvider` options: `style` (`slate` | `quartz` | `pebble` | `flint` | `mica` | `marble`, the same named
looks as the web), `scheme` (`system` | `light` | `dark`), `brand` (`default`, `blue`, `violet`,
`green`, `orange`, `rose`, or a hex such as `#0f9d8a`), `corners` (`sharp` | `soft` | `round`),
`density` (`compact` | `default` | `comfortable`), `font` (`inter` | `system`) and `haptics`.
A style sets corners, density, the default card surface and shadows; `corners` and `density` override it.
Nest a provider to show one part of a screen in another style.

`vibe` is one choice modelled on a well-known app's feel: `coral` (Airbnb-like), `cinema` (Netflix), `pinboard`
(Pinterest), `groove` (Spotify), `streak` (Duolingo), `nightshift` (Linear), `paper` (Notion) and `ride` (Uber).
It sets the style, brand colour, scheme, corners and density; anything you set explicitly still wins.

```tsx
<SlateProvider vibe="cinema">…</SlateProvider>
```
Overlays (sheets, dialogs, menus, toasts) render through the provider, so no `Modal` is needed.

## Use

```tsx
import { Button, Sheet, ListSection, ListRow, toast, useSlate } from '@ajinkyabhagwat/slateos-native';

<Button icon="plus" onPress={() => setOpen(true)}>New invoice</Button>
<Sheet open={open} onOpenChange={setOpen} detents={['auto']} title="New invoice">…</Sheet>
toast.success('Invoice sent');

const t = useSlate(); // t.c.accent, t.space[4], t.radius.lg, t.control.md, t.type.body, t.spring.standard
```

## Components

- **General**: Button, IconButton, Badge, CountBadge, Avatar, AvatarGroup, Card, Chip, Separator, Text, Icon (119 icons)
- **Forms**: Field, Input, Textarea, SearchField, Checkbox, RadioGroup, Switch, Slider, Stepper, SegmentedControl, ToggleGroup, OTPInput, ChipInput
- **Feedback**: Alert, Banner, toast + Toaster, Progress, ProgressRing, Spinner, Skeleton, EmptyState
- **Navigation**: List, ListSection, ListRow, SwipeableRow, Tabs, TabBar, Accordion, PageDots, Header
- **Overlays**: Sheet, ActionSheet, Dialog, AlertDialog, Menu, ContextMenu, Popover, Tooltip, Select, Calendar, DatePicker
- **Data**: Stat, Sparkline, BarChart, LineChart, DonutChart, Carousel, Timeline, DescriptionList, Table

## Blocks

Whole screens built from the components: `sign-in`, `sign-up`, `verify-code`, `forgot-password`,
`onboarding`, `dashboard`, `sidebar` (an app shell with a slide-over sidebar), `inbox`, `settings`,
`profile` and `paywall`. One command copies a screen and everything it uses:

```sh
npx slateos-native add sign-in dashboard
```

```tsx
import { SignInScreen } from '@/components/slate/blocks/sign-in';

<SignInScreen onSubmit={signIn} onSignUp={() => router.push('/sign-up')} />
```

Each screen takes callbacks for its actions and sample data you replace. The sources live in `blocks/`.

## Own the source

Every component on the docs site can be copied into your app. Copied files import only from this
package's core (theme, tokens, Text, Icon, Touchable, Portal), so you can change anything and keep
getting token and theme updates.

## Tokens

Colours, spacing, radii, type and motion are generated from the same `tokens.json` as the web
stylesheet, plus a mobile layer (`tokens/mobile.json`) for touch sizes and the type scale.

MIT. Inter is licensed under the SIL Open Font License.
