import { useEffect, type ReactNode } from 'react';
import { ScrollView, View, type StyleProp, type ViewStyle } from 'react-native';
import { Icon, type IconName } from '../../primitives/Icon';
import { Portal } from '../../primitives/Portal';
import { Text } from '../../primitives/Text';
import { Touchable } from '../../primitives/Touchable';
import { useSlate, type Theme } from '../../theme';
import { AnchoredLayer, useAnchorRect, usePresence, type Align, type Side } from './shared';

export type MenuItem = {
  type?: 'item';
  key?: string;
  label: string;
  icon?: IconName;
  /** A hardware-keyboard hint such as '⌘C'. */
  shortcut?: string;
  /** Shows a check; use for options that toggle or pick one of a group. */
  checked?: boolean;
  destructive?: boolean;
  disabled?: boolean;
  onSelect?: () => void;
};
export type MenuEntry = MenuItem | { type: 'separator'; key?: string } | { type: 'label'; key?: string; label: string };

export type MenuListProps = { items: MenuEntry[]; onClose: () => void };

export function menuSurface(t: Theme): ViewStyle {
  return {
    minWidth: t.size.widthXs, maxWidth: t.size.widthSm, paddingVertical: t.space[1], overflow: 'hidden',
    borderRadius: t.component.menuRadius, borderCurve: 'continuous', borderWidth: 1, borderColor: t.c.border,
    backgroundColor: t.c.surfaceRaised, boxShadow: t.c.shadowLg,
  };
}

/** The rows of a Menu or ContextMenu: items, separators and group labels. */
export function MenuList({ items, onClose }: MenuListProps) {
  const t = useSlate();
  const anyIcon = items.some((e) => e.type !== 'separator' && e.type !== 'label' && e.icon);
  return (
    <ScrollView bounces={false} showsVerticalScrollIndicator={false} style={{ flexGrow: 0 }}>
      {items.map((e, i) => {
        const key = e.key ?? `${i}`;
        if (e.type === 'separator') return <View key={key} style={{ height: 1, backgroundColor: t.c.borderSubtle, marginVertical: t.space[1] }} />;
        if (e.type === 'label') {
          return (
            <Text key={key} variant="footnote" tone="subtle" weight="500" style={{ paddingHorizontal: t.space[3], paddingTop: t.space[2], paddingBottom: t.space[1] }}>
              {e.label}
            </Text>
          );
        }
        const fg = e.destructive ? t.c.danger : t.c.text;
        return (
          <Touchable
            key={key}
            disabled={e.disabled}
            pressScale={1}
            hitSlop={0}
            pressedStyle={{ backgroundColor: e.destructive ? t.c.dangerSoft : t.c.surfaceHover }}
            accessibilityRole="menuitem"
            accessibilityState={{ disabled: !!e.disabled, checked: e.checked }}
            accessibilityHint={e.shortcut ? `Shortcut ${e.shortcut}` : undefined}
            onPress={() => { onClose(); e.onSelect?.(); }}
            style={{ minHeight: t.control.md, flexDirection: 'row', alignItems: 'center', gap: t.space[3], paddingHorizontal: t.space[3] }}
          >
            {anyIcon && <View style={{ width: 20 }}>{e.icon && <Icon name={e.icon} size={20} color={e.destructive ? t.c.danger : t.c.textMuted} />}</View>}
            <Text numberOfLines={1} style={{ flex: 1, color: fg }}>{e.label}</Text>
            {e.shortcut && <Text variant="footnote" tone="subtle" tabular>{e.shortcut}</Text>}
            {e.checked && <Icon name="check" size={16} color={t.c.accent} strokeWidth={2} />}
          </Touchable>
        );
      })}
    </ScrollView>
  );
}

export type MenuProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: MenuEntry[];
  /** Edge of the trigger the menu lines up with. Default 'start'. */
  align?: Align;
  /** Preferred side; flips when there is no room. Default 'bottom'. */
  side?: Side;
  accessibilityLabel?: string;
  /** The trigger. Open the menu from its onPress. */
  children: ReactNode;
  /** Style of the wrapper around the trigger. */
  style?: StyleProp<ViewStyle>;
};

/** A dropdown of actions anchored to its trigger. Use it for secondary actions that don't need a screen. */
export function Menu({ open, onOpenChange, items, align = 'start', side = 'bottom', accessibilityLabel, children, style }: MenuProps) {
  const t = useSlate();
  const { mounted, onExited } = usePresence(open);
  const { ref, rect } = useAnchorRect(open);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (open) t.haptic('selection'); }, [open]);
  const close = () => onOpenChange(false);
  return (
    <>
      <View ref={ref} collapsable={false} style={[{ alignSelf: 'flex-start' }, style]}>{children}</View>
      {mounted && rect && (
        <Portal modal>
          <AnchoredLayer
            open={open} rect={rect} onClose={close} onExited={onExited} side={side} align={align}
            accessibilityRole="menu" accessibilityLabel={accessibilityLabel} dismissLabel="Close menu" surfaceStyle={menuSurface(t)}
          >
            <MenuList items={items} onClose={close} />
          </AnchoredLayer>
        </Portal>
      )}
    </>
  );
}
