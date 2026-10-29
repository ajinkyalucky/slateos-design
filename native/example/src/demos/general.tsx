import { useMemo, useState } from 'react';
import { TextInput, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import {
  Avatar, AvatarGroup, Badge, Button, Card, CardContent, CardFooter, CardHeader, CardMedia, Chip, CountBadge, Icon,
  IconButton, Separator, Text, Touchable, iconShapes, tokens, useSlate, type IconName, type TextTone, type TypeVariant,
} from '@ajinkyabhagwat/slateos-native';
import type { DemoPage } from './types';

const Row = ({ children }: { children: React.ReactNode }) => (
  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>{children}</View>
);

export const pages: DemoPage[] = [
  {
    slug: 'button',
    name: 'Button',
    group: 'General',
    description: 'The main action on a screen. 44pt tall, springs on press and taps a light haptic.',
    demos: [
      {
        title: 'Variants',
        render: () => (
          <Row>
            <Button>Continue</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="soft">Soft</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="destructive">Delete</Button>
            <Button variant="link">Learn more</Button>
            <Button variant="plain">Done</Button>
          </Row>
        ),
        code: `<Button>Continue</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="outline">Outline</Button>
<Button variant="soft">Soft</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="destructive">Delete</Button>
<Button variant="link">Learn more</Button>
<Button variant="plain">Done</Button>`,
      },
      {
        title: 'Sizes and icons',
        render: () => (
          <Row>
            <Button size="sm" icon="plus">Add</Button>
            <Button icon="download">Download</Button>
            <Button size="lg" iconRight="arrow-right">Get started</Button>
          </Row>
        ),
        code: `<Button size="sm" icon="plus">Add</Button>
<Button icon="download">Download</Button>
<Button size="lg" iconRight="arrow-right">Get started</Button>`,
      },
      {
        title: 'Full width and loading',
        render: () => (
          <View style={{ gap: 8 }}>
            <Button block>Pay $24.00</Button>
            <Button block variant="outline" loading>Saving</Button>
            <Button block disabled>Unavailable</Button>
          </View>
        ),
        code: `<Button block>Pay $24.00</Button>
<Button block variant="outline" loading>Saving</Button>
<Button block disabled>Unavailable</Button>`,
      },
      {
        title: 'Icon buttons',
        render: () => (
          <Row>
            <IconButton icon="search" accessibilityLabel="Search" />
            <IconButton icon="heart" variant="outline" accessibilityLabel="Like" />
            <IconButton icon="plus" variant="solid" round accessibilityLabel="New" />
            <IconButton icon="trash" variant="soft" size="sm" accessibilityLabel="Delete" />
          </Row>
        ),
        code: `<IconButton icon="search" accessibilityLabel="Search" />
<IconButton icon="heart" variant="outline" accessibilityLabel="Like" />
<IconButton icon="plus" variant="solid" round accessibilityLabel="New" />
<IconButton icon="trash" variant="soft" size="sm" accessibilityLabel="Delete" />`,
      },
    ],
  },
  {
    slug: 'badge',
    name: 'Badge',
    group: 'General',
    description: 'A short status or category label, plus round count badges for unread numbers.',
    demos: [
      {
        title: 'Tones',
        render: () => (
          <Row>
            <Badge>Draft</Badge>
            <Badge tone="accent">New</Badge>
            <Badge tone="success">Paid</Badge>
            <Badge tone="warning">Pending</Badge>
            <Badge tone="danger">Overdue</Badge>
            <Badge tone="info">Synced</Badge>
          </Row>
        ),
        code: `<Badge>Draft</Badge>
<Badge tone="accent">New</Badge>
<Badge tone="success">Paid</Badge>
<Badge tone="warning">Pending</Badge>
<Badge tone="danger">Overdue</Badge>
<Badge tone="info">Synced</Badge>`,
      },
      {
        title: 'Variants and sizes',
        render: () => (
          <View style={{ gap: 12 }}>
            <Row>
              <Badge tone="success" variant="solid">Active</Badge>
              <Badge tone="danger" variant="solid">Failed</Badge>
              <Badge tone="neutral" variant="solid">Archived</Badge>
            </Row>
            <Row>
              <Badge tone="info" variant="outline">Beta</Badge>
              <Badge tone="warning" variant="outline">Limited</Badge>
              <Badge variant="outline">Free plan</Badge>
            </Row>
            <Row>
              <Badge size="sm" tone="accent">sm</Badge>
              <Badge tone="accent">md</Badge>
            </Row>
          </View>
        ),
        code: `<Badge tone="success" variant="solid">Active</Badge>
<Badge tone="danger" variant="solid">Failed</Badge>
<Badge tone="neutral" variant="solid">Archived</Badge>
<Badge tone="info" variant="outline">Beta</Badge>
<Badge tone="warning" variant="outline">Limited</Badge>
<Badge variant="outline">Free plan</Badge>
<Badge size="sm" tone="accent">sm</Badge>
<Badge tone="accent">md</Badge>`,
      },
      {
        title: 'Dot and icon',
        render: () => (
          <Row>
            <Badge tone="success" dot>Online</Badge>
            <Badge dot>Offline</Badge>
            <Badge tone="accent" icon="zap">Pro</Badge>
            <Badge tone="warning" icon="clock">Trial ends in 3 days</Badge>
          </Row>
        ),
        code: `<Badge tone="success" dot>Online</Badge>
<Badge dot>Offline</Badge>
<Badge tone="accent" icon="zap">Pro</Badge>
<Badge tone="warning" icon="clock">Trial ends in 3 days</Badge>`,
      },
      {
        title: 'Counts',
        render: () => (
          <Row>
            <CountBadge count={3} />
            <CountBadge count={42} tone="accent" />
            <CountBadge count={128} />
            <View>
              <IconButton icon="bell" variant="outline" accessibilityLabel="Notifications, 8 unread" />
              <CountBadge count={8} style={{ position: 'absolute', top: -6, right: -6 }} />
            </View>
          </Row>
        ),
        code: `<CountBadge count={3} />
<CountBadge count={42} tone="accent" />
<CountBadge count={128} />  // shows 99+

<View>
  <IconButton icon="bell" variant="outline" accessibilityLabel="Notifications, 8 unread" />
  <CountBadge count={8} style={{ position: 'absolute', top: -6, right: -6 }} />
</View>`,
      },
    ],
  },
  {
    slug: 'avatar',
    name: 'Avatar',
    group: 'General',
    description: 'A person, as a photo or as initials on a tint from their name, with an optional presence dot.',
    demos: [
      {
        title: 'Sizes',
        render: () => (
          <Row>
            <Avatar size="xs" name="Maya Patel" src="https://i.pravatar.cc/160?img=47" />
            <Avatar size="sm" name="Maya Patel" src="https://i.pravatar.cc/160?img=47" />
            <Avatar size="md" name="Maya Patel" src="https://i.pravatar.cc/160?img=47" />
            <Avatar size="lg" name="Maya Patel" src="https://i.pravatar.cc/160?img=47" />
            <Avatar size="xl" name="Maya Patel" src="https://i.pravatar.cc/160?img=47" />
          </Row>
        ),
        code: `<Avatar size="xs" name="Maya Patel" src="https://…/maya.jpg" />
<Avatar size="sm" name="Maya Patel" src="https://…/maya.jpg" />
<Avatar size="md" name="Maya Patel" src="https://…/maya.jpg" />
<Avatar size="lg" name="Maya Patel" src="https://…/maya.jpg" />
<Avatar size="xl" name="Maya Patel" src="https://…/maya.jpg" />`,
      },
      {
        title: 'Initials',
        render: () => (
          <Row>
            {['Jordan Lee', 'Priya Raman', 'Sam O’Connor', 'Diego Alvarez', 'Kenji Watanabe', 'Ada'].map((n) => (
              <Avatar key={n} size="lg" name={n} />
            ))}
          </Row>
        ),
        code: `// No src (or a broken one): initials on a tint that is stable per name.
<Avatar size="lg" name="Jordan Lee" />
<Avatar size="lg" name="Priya Raman" />
<Avatar size="lg" name="Ada" />`,
      },
      {
        title: 'Status',
        render: () => (
          <Row>
            <Avatar size="lg" name="Maya Patel" src="https://i.pravatar.cc/160?img=47" status="online" />
            <Avatar size="lg" name="Jordan Lee" src="https://i.pravatar.cc/160?img=12" status="away" />
            <Avatar size="lg" name="Priya Raman" status="busy" />
            <Avatar size="xl" name="Kenji Watanabe" status="offline" />
          </Row>
        ),
        code: `<Avatar size="lg" name="Maya Patel" src="https://…/maya.jpg" status="online" />
<Avatar size="lg" name="Jordan Lee" src="https://…/jordan.jpg" status="away" />
<Avatar size="lg" name="Priya Raman" status="busy" />
<Avatar size="xl" name="Kenji Watanabe" status="offline" />`,
      },
      {
        title: 'Group',
        render: () => (
          <View style={{ gap: 12 }}>
            <AvatarGroup people={team} />
            <AvatarGroup people={team.slice(0, 3)} size="sm" />
          </View>
        ),
        code: `const team = [
  { name: 'Maya Patel', src: 'https://…/maya.jpg' },
  { name: 'Jordan Lee', src: 'https://…/jordan.jpg' },
  { name: 'Priya Raman' },
  { name: 'Diego Alvarez' },
  // …3 more
];

<AvatarGroup people={team} />            // 3 faces + "+4"
<AvatarGroup people={team.slice(0, 3)} size="sm" />`,
      },
    ],
  },
  {
    slug: 'card',
    name: 'Card',
    group: 'General',
    description: 'A raised surface that groups related content, with header, body, footer and media slots.',
    demos: [
      {
        title: 'Header, content and footer',
        render: () => (
          <Card>
            <CardHeader title="Morning run" description="Today, 6:42 AM · Riverside loop" action={<Badge tone="success">PR</Badge>} />
            <CardContent>
              <Row>
                <Text variant="title3" tabular>8.4 km</Text>
                <Text tone="muted" tabular>42:18 · 5:02 /km</Text>
              </Row>
            </CardContent>
            <CardFooter bordered>
              <Button size="sm" variant="secondary" icon="share">Share</Button>
              <Button size="sm" variant="ghost">View splits</Button>
            </CardFooter>
          </Card>
        ),
        code: `<Card>
  <CardHeader
    title="Morning run"
    description="Today, 6:42 AM · Riverside loop"
    action={<Badge tone="success">PR</Badge>}
  />
  <CardContent>
    <Text variant="title3" tabular>8.4 km</Text>
    <Text tone="muted" tabular>42:18 · 5:02 /km</Text>
  </CardContent>
  <CardFooter bordered>
    <Button size="sm" variant="secondary" icon="share">Share</Button>
    <Button size="sm" variant="ghost">View splits</Button>
  </CardFooter>
</Card>`,
      },
      {
        title: 'Variants',
        render: () => (
          <View style={{ gap: 12 }}>
            <Card variant="elevated">
              <CardHeader title="Elevated" description="A soft shadow lifts it off the page." />
            </Card>
            <Card variant="filled">
              <CardHeader title="Filled" description="A quiet grouping on a plain screen." />
            </Card>
          </View>
        ),
        code: `<Card variant="elevated">
  <CardHeader title="Elevated" description="A soft shadow lifts it off the page." />
</Card>
<Card variant="filled">
  <CardHeader title="Filled" description="A quiet grouping on a plain screen." />
</Card>`,
      },
      {
        title: 'Media, pressable',
        render: () => (
          <Card variant="elevated" onPress={() => {}} accessibilityLabel="Pilates Core, Thursday 7 AM, 4 spots left">
            <CardMedia source="https://picsum.photos/seed/pilates/800/450" />
            <CardHeader title="Pilates Core" description="Thu 7:00 AM · 45 min · Studio B" action={<Badge tone="warning">4 spots left</Badge>} />
            <CardFooter>
              <AvatarGroup size="sm" people={team.slice(0, 5)} />
              <Text variant="footnote" tone="muted">with Priya</Text>
            </CardFooter>
          </Card>
        ),
        code: `<Card variant="elevated" onPress={openClass}>
  <CardMedia source="https://…/pilates.jpg" />
  <CardHeader
    title="Pilates Core"
    description="Thu 7:00 AM · 45 min · Studio B"
    action={<Badge tone="warning">4 spots left</Badge>}
  />
  <CardFooter>
    <AvatarGroup size="sm" people={attendees} />
    <Text variant="footnote" tone="muted">with Priya</Text>
  </CardFooter>
</Card>`,
      },
      {
        title: 'Header action',
        render: () => (
          <Card>
            <CardHeader title="Monthly budget" description="$1,240 of $1,800 spent" action={<Button size="sm" variant="outline">Edit</Button>} />
            <CardContent>
              <Text variant="footnote" tone="muted">Groceries and dining are 12% under last month.</Text>
            </CardContent>
          </Card>
        ),
        code: `<Card>
  <CardHeader
    title="Monthly budget"
    description="$1,240 of $1,800 spent"
    action={<Button size="sm" variant="outline">Edit</Button>}
  />
  <CardContent>
    <Text variant="footnote" tone="muted">Groceries and dining are 12% under last month.</Text>
  </CardContent>
</Card>`,
      },
    ],
  },
  {
    slug: 'chip',
    name: 'Chip',
    group: 'General',
    description: 'A compact pill for filters, tags and people. Toggles with a check, or removes with an x.',
    demos: [
      { title: 'Filter chips', render: () => <FilterChips />, code: `const [on, setOn] = useState(['Running']);
const toggle = (k: string) => setOn((s) => (s.includes(k) ? s.filter((x) => x !== k) : [...s, k]));

{['Running', 'Cycling', 'Strength', 'Yoga', 'Swimming'].map((k) => (
  <Chip key={k} label={k} value={on.includes(k)} onValueChange={() => toggle(k)} />
))}` },
      { title: 'Removable', render: () => <RemovableChips />, code: `{tags.map((tag) => (
  <Chip key={tag} label={tag} onRemove={() => setTags((t) => t.filter((x) => x !== tag))} />
))}` },
      {
        title: 'Icons and people',
        render: () => (
          <Row>
            <Chip label="Nearby" icon="map-pin" onPress={() => {}} />
            <Chip label="This week" icon="calendar" onPress={() => {}} />
            <Chip label="Maya Patel" avatar={{ name: 'Maya Patel', src: 'https://i.pravatar.cc/160?img=47' }} onRemove={() => {}} />
            <Chip label="Jordan Lee" avatar={{ name: 'Jordan Lee' }} onRemove={() => {}} />
          </Row>
        ),
        code: `<Chip label="Nearby" icon="map-pin" onPress={showNearby} />
<Chip label="This week" icon="calendar" onPress={pickWeek} />
<Chip label="Maya Patel" avatar={{ name: 'Maya Patel', src: 'https://…/maya.jpg' }} onRemove={remove} />
<Chip label="Jordan Lee" avatar={{ name: 'Jordan Lee' }} onRemove={remove} />`,
      },
    ],
  },
  {
    slug: 'separator',
    name: 'Separator',
    group: 'General',
    description: 'A hairline between groups of content: full width, inset, vertical or with a label.',
    demos: [
      {
        title: 'Horizontal and inset',
        render: () => (
          <View style={{ gap: 12 }}>
            <Text>Account</Text>
            <Separator />
            <Text>Notifications</Text>
            <Separator inset={40} />
            <Text>Privacy</Text>
          </View>
        ),
        code: `<Text>Account</Text>
<Separator />
<Text>Notifications</Text>
<Separator inset={40} />  // lines up with text after a leading icon
<Text>Privacy</Text>`,
      },
      {
        title: 'Vertical',
        render: () => (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, height: 40 }}>
            <Text variant="footnote" tone="muted">Steps <Text variant="footnote" weight="600" tabular>9,412</Text></Text>
            <Separator orientation="vertical" />
            <Text variant="footnote" tone="muted">Floors <Text variant="footnote" weight="600" tabular>12</Text></Text>
            <Separator orientation="vertical" />
            <Text variant="footnote" tone="muted">Kcal <Text variant="footnote" weight="600" tabular>486</Text></Text>
          </View>
        ),
        code: `<View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, height: 40 }}>
  <Text>Steps 9,412</Text>
  <Separator orientation="vertical" />
  <Text>Floors 12</Text>
  <Separator orientation="vertical" />
  <Text>Kcal 486</Text>
</View>`,
      },
      {
        title: 'With a label',
        render: () => (
          <View style={{ gap: 16 }}>
            <Button block icon="mail">Continue with email</Button>
            <Separator label="or" />
            <Button block variant="outline" icon="github">Continue with GitHub</Button>
          </View>
        ),
        code: `<Button block icon="mail">Continue with email</Button>
<Separator label="or" />
<Button block variant="outline" icon="github">Continue with GitHub</Button>`,
      },
    ],
  },
  {
    slug: 'typography',
    name: 'Typography',
    group: 'General',
    description: 'The mobile type scale through <Text variant>. Every style follows Dynamic Type, capped at 2x.',
    demos: [
      { title: 'Scale', render: () => <TypeScale />, code: `<Text variant="display">Display</Text>
<Text variant="title1">Title 1</Text>
<Text variant="title2">Title 2</Text>
<Text variant="title3">Title 3</Text>
<Text variant="headline">Headline</Text>
<Text variant="body">Body</Text>
<Text variant="callout">Callout</Text>
<Text variant="label">Label</Text>
<Text variant="footnote">Footnote</Text>
<Text variant="caption">Caption</Text>
<Text variant="overline">Overline</Text>` },
      {
        title: 'Tones',
        render: () => (
          <View style={{ gap: 4 }}>
            {tones.map((tone) => (
              <Text key={tone} tone={tone}>{`${tone}: The quick brown fox`}</Text>
            ))}
            <InverseSamples />
          </View>
        ),
        code: `<Text tone="default">default: The quick brown fox</Text>
<Text tone="muted">muted: The quick brown fox</Text>
<Text tone="subtle">subtle: The quick brown fox</Text>
<Text tone="disabled">disabled: The quick brown fox</Text>
<Text tone="accent">accent: The quick brown fox</Text>
<Text tone="success">success: The quick brown fox</Text>
<Text tone="warning">warning: The quick brown fox</Text>
<Text tone="danger">danger: The quick brown fox</Text>
<Text tone="info">info: The quick brown fox</Text>
<Text tone="onAccent">On an accent fill</Text>
<Text tone="inverse">On an inverse fill</Text>`,
      },
      {
        title: 'Weights, numbers and code',
        render: () => (
          <View style={{ gap: 4 }}>
            <Text weight="400">Regular 400</Text>
            <Text weight="500">Medium 500</Text>
            <Text weight="600">Semibold 600</Text>
            <Text weight="700">Bold 700</Text>
            <Text variant="title3" tabular>$1,118.40</Text>
            <Text variant="title3" tabular>$999.99</Text>
            <Text mono variant="footnote">ORD-7F3K-2291</Text>
          </View>
        ),
        code: `<Text weight="400">Regular 400</Text>
<Text weight="500">Medium 500</Text>
<Text weight="600">Semibold 600</Text>
<Text weight="700">Bold 700</Text>
<Text variant="title3" tabular>$1,118.40</Text>  // tabular: digits line up
<Text variant="title3" tabular>$999.99</Text>
<Text mono variant="footnote">ORD-7F3K-2291</Text>`,
      },
    ],
  },
  {
    slug: 'icons',
    name: 'Icons',
    group: 'General',
    description: 'All SlateOS line icons on a 24pt grid with a 1.5 stroke. Tap one to copy its name.',
    demos: [{ title: 'Gallery', render: () => <IconGallery />, code: `<Icon name="heart" />                       // 20pt, text colour
<Icon name="bell" size={24} color={t.c.accent} />
<Icon name="check" accessibilityLabel="Done" />  // spoken only with a label` }],
  },
];

const team = [
  { name: 'Maya Patel', src: 'https://i.pravatar.cc/160?img=47' },
  { name: 'Jordan Lee', src: 'https://i.pravatar.cc/160?img=12' },
  { name: 'Priya Raman' },
  { name: 'Diego Alvarez', src: 'https://i.pravatar.cc/160?img=33' },
  { name: 'Kenji Watanabe' },
  { name: 'Ada Okafor' },
  { name: 'Lena Fischer' },
];

function FilterChips() {
  const [on, setOn] = useState(['Running']);
  const toggle = (k: string) => setOn((s) => (s.includes(k) ? s.filter((x) => x !== k) : [...s, k]));
  return (
    <Row>
      {['Running', 'Cycling', 'Strength', 'Yoga', 'Swimming'].map((k) => (
        <Chip key={k} label={k} value={on.includes(k)} onValueChange={() => toggle(k)} />
      ))}
    </Row>
  );
}

function RemovableChips() {
  const initial = ['High protein', 'Vegetarian', 'Under 30 min', 'No nuts'];
  const [tags, setTags] = useState(initial);
  return (
    <View style={{ gap: 12 }}>
      <Row>
        {tags.map((tag) => (
          <Chip key={tag} label={tag} onRemove={() => setTags((t) => t.filter((x) => x !== tag))} />
        ))}
      </Row>
      {tags.length < initial.length && <Button size="sm" variant="link" onPress={() => setTags(initial)}>Reset</Button>}
    </View>
  );
}

const tones: TextTone[] = ['default', 'muted', 'subtle', 'disabled', 'accent', 'success', 'warning', 'danger', 'info'];

function InverseSamples() {
  const t = useSlate();
  return (
    <Row>
      <View style={{ backgroundColor: t.c.accentSolid, paddingHorizontal: t.space[3], paddingVertical: t.space[1], borderRadius: t.radius.md }}>
        <Text tone="onAccent">On an accent fill</Text>
      </View>
      <View style={{ backgroundColor: t.c.inverse, paddingHorizontal: t.space[3], paddingVertical: t.space[1], borderRadius: t.radius.md }}>
        <Text tone="inverse">On an inverse fill</Text>
      </View>
    </Row>
  );
}

function TypeScale() {
  const t = useSlate();
  const names: Record<TypeVariant, string> = {
    display: 'Display', title1: 'Title 1', title2: 'Title 2', title3: 'Title 3', headline: 'Headline', body: 'Body',
    callout: 'Callout', label: 'Label', footnote: 'Footnote', caption: 'Caption', overline: 'Overline',
  };
  return (
    <View style={{ gap: t.space[3] }}>
      {(Object.keys(tokens.type) as TypeVariant[]).map((v) => {
        const s = tokens.type[v];
        return (
          <View key={v} style={{ gap: t.space['0_5'] }}>
            <Text variant={v} numberOfLines={1}>{names[v]}</Text>
            <Text variant="caption" tone="subtle" mono>{`${v} · ${s.fontSize}/${s.lineHeight} · ${s.fontWeight}`}</Text>
          </View>
        );
      })}
    </View>
  );
}

const iconNames = Object.keys(iconShapes) as IconName[];

function IconGallery() {
  const t = useSlate();
  const [q, setQ] = useState('');
  const [copied, setCopied] = useState<string | null>(null);
  const list = useMemo(() => iconNames.filter((n) => n.includes(q.trim().toLowerCase())), [q]);
  const copy = async (name: string) => {
    await Clipboard.setStringAsync(name);
    t.haptic('success');
    setCopied(name);
    setTimeout(() => setCopied((c) => (c === name ? null : c)), 1200);
  };
  return (
    <View style={{ gap: t.space[3] }}>
      <View
        style={{
          flexDirection: 'row', alignItems: 'center', gap: t.space[2], height: t.control.md, paddingHorizontal: t.space[3],
          borderRadius: t.component.inputRadius, borderWidth: 1, borderColor: t.c.border, backgroundColor: t.c.surface,
        }}
      >
        <Icon name="search" size={16} color={t.c.textSubtle} />
        <TextInput
          value={q}
          onChangeText={setQ}
          placeholder={`Search ${iconNames.length} icons`}
          placeholderTextColor={t.c.textSubtle}
          autoCapitalize="none"
          autoCorrect={false}
          clearButtonMode="while-editing"
          returnKeyType="search"
          accessibilityLabel="Search icons"
          style={[t.type.body, { flex: 1, color: t.c.text, paddingVertical: 0 }]}
        />
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -t.space[1] }}>
        {list.map((name) => (
          <Touchable
            key={name}
            onPress={() => copy(name)}
            pressScale={0.92}
            accessibilityLabel={`${name}, copy name`}
            style={{ width: '25%', alignItems: 'center', gap: t.space['1_5'], paddingVertical: t.space[3], paddingHorizontal: t.space[1] }}
          >
            <Icon name={copied === name ? 'check' : name} size={24} color={copied === name ? t.c.success : t.c.text} />
            <Text variant="caption" tone={copied === name ? 'success' : 'subtle'} numberOfLines={1}>{copied === name ? 'Copied' : name}</Text>
          </Touchable>
        ))}
      </View>
      {list.length === 0 && <Text tone="muted" align="center">No icons match “{q}”.</Text>}
    </View>
  );
}
