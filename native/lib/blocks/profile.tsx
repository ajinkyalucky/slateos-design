import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Avatar, Badge, Button, DescriptionList, Header, IconButton, Separator, Tabs, Text, Timeline, useSlate,
} from '@ajinkyabhagwat/slateos-native';

export type ProfileScreenProps = {
  user?: { name: string; handle: string; bio: string; location: string; joined: string; website: string };
  stats?: { label: string; value: string }[];
  onBack?: () => void;
  onEdit?: () => void;
  onShare?: () => void;
};

const DEFAULT_USER = {
  name: 'Maya Patel',
  handle: '@maya',
  bio: 'Product designer. Runs before sunrise, writes about quiet interfaces.',
  location: 'Brooklyn, NY',
  joined: 'March 2023',
  website: 'maya.design',
};
const DEFAULT_STATS = [
  { label: 'Posts', value: '128' },
  { label: 'Followers', value: '4.2k' },
  { label: 'Following', value: '312' },
];

/** A profile: avatar, name and bio, counts, primary actions, and tabs for activity and details. */
export function ProfileScreen({ user = DEFAULT_USER, stats = DEFAULT_STATS, onBack, onEdit, onShare }: ProfileScreenProps) {
  const t = useSlate();
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<'activity' | 'about'>('activity');

  return (
    <View style={{ flex: 1, backgroundColor: t.c.bg }}>
      <Header
        title={user.name}
        leading={onBack ? <IconButton icon="chevron-left" accessibilityLabel="Back" onPress={onBack} /> : undefined}
        trailing={<IconButton icon="share" accessibilityLabel="Share profile" onPress={onShare} />}
      />
      <ScrollView contentContainerStyle={{ padding: t.component.screenPadding, paddingBottom: insets.bottom + t.space[10], gap: t.space[5] }}>
        <View style={{ alignItems: 'center', gap: t.space[3] }}>
          <Avatar name={user.name} size="xl" status="online" />
          <View style={{ alignItems: 'center', gap: t.space[1] }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.space[2] }}>
              <Text variant="title2" accessibilityRole="header">{user.name}</Text>
              <Badge tone="accent" icon="badge-check" size="sm">Pro</Badge>
            </View>
            <Text tone="muted">{user.handle}</Text>
          </View>
          <Text tone="muted" style={{ textAlign: 'center' }}>{user.bio}</Text>
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
          {stats.map((s, i) => (
            <View key={s.label} style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              {i > 0 && <Separator orientation="vertical" style={{ height: t.space[8] }} />}
              <View style={{ flex: 1, alignItems: 'center' }} accessible accessibilityLabel={`${s.value} ${s.label}`}>
                <Text variant="title3" tabular>{s.value}</Text>
                <Text variant="footnote" tone="muted">{s.label}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={{ flexDirection: 'row', gap: t.space[3] }}>
          <Button style={{ flex: 1 }} onPress={onEdit}>Edit profile</Button>
          <Button style={{ flex: 1 }} variant="outline" icon="share" onPress={onShare}>Share</Button>
        </View>

        <Tabs
          value={tab}
          onValueChange={setTab}
          items={[
            { value: 'activity', label: 'Activity' },
            { value: 'about', label: 'About' },
          ]}
        />
        {tab === 'activity' ? (
          <Timeline
            items={[
              { icon: 'star', title: 'Finished “Quiet Interfaces”, part 3', time: '2h', status: 'current' },
              { icon: 'users', title: 'Joined Brooklyn Run Club', time: 'Yesterday' },
              { icon: 'edit', title: 'Published “Designing for one hand”', time: 'Oct 21', description: '1.2k reads · 84 saves' },
              { icon: 'badge-check', title: 'Upgraded to Pro', time: 'Oct 2' },
            ]}
          />
        ) : (
          <DescriptionList
            items={[
              { label: 'Location', value: user.location },
              { label: 'Website', value: user.website },
              { label: 'Joined', value: user.joined },
            ]}
          />
        )}
      </ScrollView>
    </View>
  );
}
