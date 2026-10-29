import { useState } from 'react';
import { Image, View, type ImageSourcePropType, type StyleProp, type ViewStyle } from 'react-native';
import { Text } from '../../primitives/Text';
import { useSlate, type Theme } from '../../theme';
import type { TypeVariant } from '../../tokens';
import { chartColor, readableOn } from './tone';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type AvatarStatus = 'online' | 'away' | 'busy' | 'offline';

export type AvatarProps = {
  /** Full name: used for the initials, the tint and the spoken label. */
  name: string;
  /** Image URL or require()'d source. Falls back to initials while missing or on error. */
  src?: string | ImageSourcePropType;
  size?: AvatarSize;
  status?: AvatarStatus;
  /** Colour of the ring around the status dot (and the group overlap). Default: surfaceRaised. */
  ringColor?: string;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
};

const sizeKey = { xs: 'avatarXs', sm: 'avatarSm', md: 'avatarMd', lg: 'avatarLg', xl: 'avatarXl' } as const;
const textVariant: Record<AvatarSize, TypeVariant> = { xs: 'overline', sm: 'caption', md: 'footnote', lg: 'label', xl: 'title3' };

const avatarPx = (t: Theme, size: AvatarSize) => t.size[sizeKey[size]];

function initials(name: string, max = 2) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const letters = parts.length > 1 ? [parts[0], parts[parts.length - 1]] : parts;
  return letters.map((p) => p[0]?.toUpperCase() ?? '').join('').slice(0, max);
}

/** A stable chart-colour index for a name, so the same person always gets the same tint. */
function nameTint(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) | 0;
  return Math.abs(h) % 6;
}

/** A person's photo, or their initials on a tint picked from their name. Optional presence dot. */
export function Avatar({ name, src, size = 'md', status, ringColor, accessibilityLabel, style }: AvatarProps) {
  const t = useSlate();
  const [failed, setFailed] = useState(false);
  const px = avatarPx(t, size);
  const bg = chartColor(t, nameTint(name));
  const showImage = src != null && !failed;
  const dot = { xs: t.space['1_5'], sm: t.space[2], md: t.space['2_5'], lg: t.space[3], xl: t.space[3] }[size];
  const ring = size === 'xs' || size === 'sm' ? 1 : t.space['0_5'];
  const statusColor = status && { online: t.c.successSolid, away: t.c.warningSolid, busy: t.c.dangerSolid, offline: t.c.textDisabled }[status];
  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel ?? (status ? `${name}, ${status}` : name)}
      style={[{ width: px, height: px }, style]}
    >
      <View style={{ width: px, height: px, borderRadius: px / 2, overflow: 'hidden', backgroundColor: showImage ? t.c.surfaceHover : bg, alignItems: 'center', justifyContent: 'center' }}>
        {showImage ? (
          <Image
            source={typeof src === 'string' ? { uri: src } : src}
            onError={() => setFailed(true)}
            style={{ width: px, height: px }}
          />
        ) : (
          <Text variant={textVariant[size]} weight="600" allowFontScaling={false} style={{ color: readableOn(bg), letterSpacing: 0 }}>
            {initials(name, size === 'xs' ? 1 : 2)}
          </Text>
        )}
      </View>
      {statusColor && (
        <View
          style={{
            position: 'absolute',
            right: -ring,
            bottom: -ring,
            width: dot + ring * 2,
            height: dot + ring * 2,
            borderRadius: t.radius.full,
            borderWidth: ring,
            borderColor: ringColor ?? t.c.surfaceRaised,
            backgroundColor: statusColor,
          }}
        />
      )}
    </View>
  );
}

export type AvatarGroupProps = {
  people: { name: string; src?: AvatarProps['src'] }[];
  /** How many avatars to show before "+N". Default 4. */
  max?: number;
  size?: AvatarSize;
  ringColor?: string;
  style?: StyleProp<ViewStyle>;
};

/** Overlapping avatars for a team, attendees or collaborators, with a "+N" for the rest. */
export function AvatarGroup({ people, max = 4, size = 'md', ringColor, style }: AvatarGroupProps) {
  const t = useSlate();
  const px = avatarPx(t, size);
  const ring = size === 'xs' || size === 'sm' ? 1 : t.space['0_5'];
  const shown = people.slice(0, people.length > max ? max - 1 : max);
  const rest = people.length - shown.length;
  const overlap = -Math.round(px * 0.28);
  const ringStyle = { borderWidth: ring, borderColor: ringColor ?? t.c.surfaceRaised, borderRadius: t.radius.full };
  const names = shown.map((p) => p.name.split(' ')[0]);
  const label = rest > 0 ? `${names.join(', ')} and ${rest} more` : names.length > 1 ? `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}` : names[0];
  return (
    <View accessible accessibilityRole="image" accessibilityLabel={label} style={[{ flexDirection: 'row', alignSelf: 'flex-start' }, style]}>
      {shown.map((p, i) => (
        <View key={`${p.name}-${i}`} style={[ringStyle, { marginLeft: i ? overlap : 0, zIndex: shown.length - i }]}>
          <Avatar name={p.name} src={p.src} size={size} />
        </View>
      ))}
      {rest > 0 && (
        <View style={[ringStyle, { marginLeft: overlap }]}>
          <View style={{ width: px, height: px, borderRadius: px / 2, backgroundColor: t.c.surfaceHover, alignItems: 'center', justifyContent: 'center' }}>
            <Text variant={textVariant[size]} weight="600" tone="muted" tabular allowFontScaling={false} style={{ letterSpacing: 0 }}>
              +{rest}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}
