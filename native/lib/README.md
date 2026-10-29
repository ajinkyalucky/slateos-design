# SlateOS Native

SlateOS for React Native and Expo: 53 touch-first components on the same tokens as the web.
Targets are 44pt, springs run on the UI thread, haptics are built in, and gestures come from Gesture
Handler 3. Light and dark, five brand colours or any colour you pass (tuned for AA contrast in each
scheme), three corner styles and three densities.

Docs, with every component's source to copy: https://slateos.ajinkya.design/native/

## Install

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

`SlateProvider` options: `scheme` (`system` | `light` | `dark`), `brand` (`default`, `blue`, `violet`,
`green`, `orange`, `rose`, or a hex such as `#0f9d8a`), `corners` (`sharp` | `soft` | `round`),
`density` (`compact` | `default` | `comfortable`), `font` (`inter` | `system`) and `haptics`.
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

## Own the source

Every component on the docs site can be copied into your app. Copied files import only from this
package's core (theme, tokens, Text, Icon, Touchable, Portal), so you can change anything and keep
getting token and theme updates.

## Tokens

Colours, spacing, radii, type and motion are generated from the same `tokens.json` as the web
stylesheet, plus a mobile layer (`tokens/mobile.json`) for touch sizes and the type scale.

MIT. Inter is licensed under the SIL Open Font License.
