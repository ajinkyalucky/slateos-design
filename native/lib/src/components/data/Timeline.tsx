import type { ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { Icon, type IconName } from '../../primitives/Icon';
import { Text } from '../../primitives/Text';
import { useSlate } from '../../theme';

export type TimelineStatus = 'done' | 'current' | 'upcoming';

export type TimelineItem = {
  title: string;
  description?: string;
  time?: string;
  /** An icon marker instead of a dot. */
  icon?: IconName;
  /** Default: done. */
  status?: TimelineStatus;
  /** Anything extra under the description: a badge, buttons, an image. */
  children?: ReactNode;
};

export type TimelineProps = {
  items: TimelineItem[];
  style?: StyleProp<ViewStyle>;
};

/** A vertical list of events joined by a line, for order tracking, activity and history. */
export function Timeline({ items, style }: TimelineProps) {
  const t = useSlate();
  const markerW = t.size.avatarSm;
  return (
    <View style={style}>
      {items.map((item, i) => {
        const status = item.status ?? 'done';
        const last = i === items.length - 1;
        const current = status === 'current';
        const upcoming = status === 'upcoming';
        const nextUpcoming = (items[i + 1]?.status ?? 'done') === 'upcoming';
        const dot = t.space['2_5'];
        return (
          <View
            key={`${item.title}-${i}`}
            accessible
            accessibilityLabel={[item.title, item.time, item.description, current ? 'current step' : upcoming ? 'upcoming' : 'done'].filter(Boolean).join(', ')}
            style={{ flexDirection: 'row', gap: t.space[3] }}
          >
            <View style={{ width: markerW, alignItems: 'center' }}>
              <View style={{ height: t.type.callout.lineHeight, justifyContent: 'center', alignItems: 'center' }}>
                {item.icon ? (
                  <View
                    style={{
                      width: markerW,
                      height: markerW,
                      borderRadius: t.radius.full,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: current ? t.c.accentSolid : upcoming ? t.c.surfaceRaised : t.c.surfaceHover,
                      borderWidth: upcoming ? 1 : 0,
                      borderColor: t.c.border,
                      boxShadow: current ? `0 0 0 ${t.space[1]}px ${t.c.accentSoft}` : undefined,
                    }}
                  >
                    <Icon name={item.icon} size={t.size.iconSm} color={current ? t.c.onAccent : upcoming ? t.c.textSubtle : t.c.textMuted} strokeWidth={1.75} />
                  </View>
                ) : (
                  <View
                    style={{
                      width: dot,
                      height: dot,
                      borderRadius: t.radius.full,
                      backgroundColor: current ? t.c.accentSolid : upcoming ? t.c.surfaceRaised : t.c.textSubtle,
                      borderWidth: upcoming ? 1.5 : 0,
                      borderColor: t.c.borderStrong,
                      boxShadow: current ? `0 0 0 ${t.space[1]}px ${t.c.accentSoft}` : undefined,
                    }}
                  />
                )}
              </View>
              {!last && (
                <View
                  style={{
                    flex: 1,
                    width: t.space['0_5'],
                    borderRadius: t.radius.full,
                    marginVertical: t.space[item.icon ? 2 : 1],
                    backgroundColor: nextUpcoming || upcoming ? t.c.borderSubtle : t.c.border,
                  }}
                />
              )}
            </View>
            <View style={{ flex: 1, paddingBottom: last ? 0 : t.space[5], gap: t.space['0_5'] }}>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: t.space[2] }}>
                <Text variant="callout" weight={current ? '600' : '500'} tone={upcoming ? 'subtle' : 'default'} style={{ flex: 1 }}>
                  {item.title}
                </Text>
                {item.time && <Text variant="caption" tone="subtle" tabular>{item.time}</Text>}
              </View>
              {item.description && <Text variant="footnote" tone={upcoming ? 'subtle' : 'muted'}>{item.description}</Text>}
              {item.children && <View style={{ marginTop: t.space[2] }}>{item.children}</View>}
            </View>
          </View>
        );
      })}
    </View>
  );
}
