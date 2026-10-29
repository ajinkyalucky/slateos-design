import { useEffect, useState, type ReactNode } from 'react';
import { ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { GestureDetector, usePanGesture } from 'react-native-gesture-handler';
import Animated, { interpolate, useAnimatedStyle, useDerivedValue, useSharedValue, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';
import {
  Avatar, Backdrop, CountBadge, Header, Icon, IconButton, ListRow, ListSection, Text, Touchable, useBackHandler, useSlate,
  type IconName,
} from '@ajinkyabhagwat/slateos-native';

export type SidebarItem = { value: string; label: string; icon: IconName; count?: number };
export type SidebarProject = { value: string; label: string };

export type SidebarScreenProps = {
  workspace?: string;
  user?: { name: string; email: string };
  items?: SidebarItem[];
  projects?: SidebarProject[];
  /** The selected item or project. */
  value?: string;
  onValueChange?: (value: string) => void;
  onOpenSettings?: () => void;
  onSwitchWorkspace?: () => void;
  /** Start with the sidebar open. */
  defaultOpen?: boolean;
};

const DEFAULT_ITEMS: SidebarItem[] = [
  { value: 'inbox', label: 'Inbox', icon: 'inbox', count: 4 },
  { value: 'today', label: 'Today', icon: 'calendar' },
  { value: 'upcoming', label: 'Upcoming', icon: 'clock' },
  { value: 'starred', label: 'Starred', icon: 'star' },
  { value: 'archive', label: 'Archive', icon: 'archive' },
];
const DEFAULT_PROJECTS: SidebarProject[] = [
  { value: 'launch', label: 'Website launch' },
  { value: 'mobile', label: 'Mobile app' },
  { value: 'brand', label: 'Brand refresh' },
];

/**
 * An app shell with a slide-over sidebar: tap the menu button or swipe from the left edge to open it,
 * swipe it back or tap outside to close. The sidebar holds a workspace switcher, navigation, projects and the account.
 */
export function SidebarScreen({
  workspace = 'Acme Inc',
  user = { name: 'Maya Patel', email: 'maya@acme.co' },
  items = DEFAULT_ITEMS,
  projects = DEFAULT_PROJECTS,
  value: controlled,
  onValueChange,
  onOpenSettings,
  onSwitchWorkspace,
  defaultOpen = false,
}: SidebarScreenProps) {
  const t = useSlate();
  const insets = useSafeAreaInsets();
  const { width: screenW } = useWindowDimensions();
  const width = Math.min(t.size.width2xs * 2, screenW * 0.84);
  const [own, setOwn] = useState(items[0]?.value ?? '');
  const value = controlled ?? own;
  const [open, setOpen] = useState(defaultOpen);

  // x runs from -width (closed) to 0 (open).
  const x = useSharedValue(defaultOpen ? 0 : -width);
  const start = useSharedValue(0);
  const shown = useDerivedValue(() => interpolate(x.value, [-width, 0], [0, 1]));
  const spring = t.spring.standard;

  useEffect(() => {
    x.value = withSpring(open ? 0 : -width, spring);
  }, [open, width, x, spring]);
  useBackHandler(open, () => setOpen(false));

  const settle = (velocity: number, from: number, w: number) => {
    'worklet';
    const willOpen = velocity > 500 || (velocity > -500 && from > -w / 2);
    x.value = withSpring(willOpen ? 0 : -w, { ...spring, velocity });
    scheduleOnRN(setOpen, willOpen);
  };

  const closePan = usePanGesture({
    activeOffsetX: [-8, 8],
    failOffsetY: [-12, 12],
    onActivate: () => { start.value = x.value; },
    onUpdate: (e) => { x.value = Math.min(0, Math.max(-width, start.value + e.translationX)); },
    onDeactivate: (e) => settle(e.velocityX, x.value, width),
  });
  const edgePan = usePanGesture({
    activeOffsetX: 8,
    failOffsetY: [-12, 12],
    onActivate: () => { start.value = -width; },
    onUpdate: (e) => { x.value = Math.min(0, -width + Math.max(0, e.translationX)); },
    onDeactivate: (e) => settle(e.velocityX, x.value, width),
  });

  const panel = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));

  const select = (v: string) => {
    t.haptic('selection');
    setOwn(v);
    onValueChange?.(v);
    setOpen(false);
  };
  const current = items.find((i) => i.value === value) ?? projects.find((p) => p.value === value);
  const dot = [t.c.chart1, t.c.chart2, t.c.chart3, t.c.chart4, t.c.chart5, t.c.chart6];

  const row = (v: string, label: string, leading: ReactNode, count?: number) => {
    const on = v === value;
    return (
      <Touchable
        key={v}
        onPress={() => select(v)}
        pressScale={0.98}
        accessibilityRole="button"
        accessibilityState={{ selected: on }}
        style={{
          minHeight: t.control.md, flexDirection: 'row', alignItems: 'center', gap: t.space[3], paddingHorizontal: t.space[3],
          borderRadius: t.component.buttonRadius, backgroundColor: on ? t.c.accentSoft : 'transparent',
        }}
      >
        {leading}
        <Text weight={on ? '600' : '400'} tone={on ? 'accent' : 'default'} style={{ flex: 1 }} numberOfLines={1}>{label}</Text>
        {count ? <CountBadge count={count} tone={on ? 'accent' : 'neutral'} /> : null}
      </Touchable>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: t.c.bg }}>
      <Header
        title={current?.label ?? ''}
        leading={<IconButton icon="menu" accessibilityLabel="Open menu" accessibilityState={{ expanded: open }} onPress={() => setOpen(true)} />}
        trailing={<IconButton icon="plus" accessibilityLabel="New item" />}
      />
      <ScrollView contentContainerStyle={{ padding: t.component.screenPadding, gap: t.space[4] }}>
        <Text variant="title1" accessibilityRole="header">{current?.label}</Text>
        <ListSection>
          {['Review launch checklist', 'Reply to Jordan about pricing', 'Book the studio for Friday'].map((title, i) => (
            <ListRow key={title} icon="check-circle" iconTint={dot[i]} title={title} subtitle={i === 0 ? 'Due today' : 'This week'} onPress={() => {}} />
          ))}
        </ListSection>
        <Text variant="footnote" tone="subtle">Swipe from the left edge to open the sidebar.</Text>
      </ScrollView>

      {/* Edge strip that catches the open swipe; it sits under the overlay, so it never blocks an open sidebar. */}
      <GestureDetector gesture={edgePan}>
        <View style={{ position: 'absolute', left: 0, top: insets.top + t.component.headerHeight, bottom: 0, width: t.space[5] }} />
      </GestureDetector>

      <View style={StyleSheet.absoluteFill} pointerEvents={open ? 'auto' : 'box-none'}>
        <View style={StyleSheet.absoluteFill} pointerEvents={open ? 'auto' : 'none'}>
          <Backdrop progress={shown} onPress={() => setOpen(false)} label="Close menu" />
        </View>
        <GestureDetector gesture={closePan}>
          <Animated.View
            accessibilityViewIsModal={open}
            importantForAccessibility={open ? 'yes' : 'no-hide-descendants'}
            style={[
              {
                position: 'absolute', left: 0, top: 0, bottom: 0, width,
                backgroundColor: t.c.surfaceRaised, borderRightWidth: StyleSheet.hairlineWidth, borderColor: t.c.border,
                paddingTop: insets.top + t.space[2], paddingBottom: insets.bottom + t.space[2], boxShadow: t.c.shadowXl,
              },
              panel,
            ]}
          >
            <Touchable
              onPress={onSwitchWorkspace}
              pressScale={0.98}
              accessibilityRole="button"
              accessibilityLabel={`Workspace ${workspace}. Switch workspace`}
              style={{ flexDirection: 'row', alignItems: 'center', gap: t.space[3], minHeight: t.control.lg, marginHorizontal: t.space[3], paddingHorizontal: t.space[2] }}
            >
              <View style={{ width: t.size.avatarSm, height: t.size.avatarSm, borderRadius: t.radius.md, backgroundColor: t.c.accentSolid, alignItems: 'center', justifyContent: 'center' }}>
                <Text variant="label" style={{ color: t.c.onAccent }}>{workspace[0]}</Text>
              </View>
              <Text variant="headline" style={{ flex: 1 }} numberOfLines={1}>{workspace}</Text>
              <Icon name="chevrons-up-down" size={16} color={t.c.textSubtle} />
            </Touchable>

            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: t.space[3], gap: t.space['0_5'] }}>
              {items.map((i) => row(i.value, i.label, <Icon name={i.icon} size={20} color={i.value === value ? t.c.accent : t.c.textMuted} />, i.count))}
              <Text variant="overline" tone="subtle" style={{ paddingHorizontal: t.space[3], paddingTop: t.space[5], paddingBottom: t.space[2] }}>Projects</Text>
              {projects.map((p, n) =>
                row(p.value, p.label, <View style={{ width: 20, alignItems: 'center' }}><View style={{ width: t.space[2], height: t.space[2], borderRadius: t.radius.full, backgroundColor: dot[n % dot.length] }} /></View>),
              )}
            </ScrollView>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.space[3], marginHorizontal: t.space[3], paddingHorizontal: t.space[2], paddingTop: t.space[3], borderTopWidth: StyleSheet.hairlineWidth, borderColor: t.c.border }}>
              <Avatar size="sm" name={user.name} />
              <View style={{ flex: 1 }}>
                <Text variant="label" numberOfLines={1}>{user.name}</Text>
                <Text variant="caption" tone="muted" numberOfLines={1}>{user.email}</Text>
              </View>
              <IconButton icon="settings" accessibilityLabel="Settings" onPress={onOpenSettings} />
            </View>
          </Animated.View>
        </GestureDetector>
      </View>
    </View>
  );
}
