import { useState } from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated';
import {
  Accordion, Avatar, Button, Header, IconButton, List, ListRow, ListSection, PageDots, SwipeableRow, TabBar, Tabs, Text,
  useCollapsingHeader, useSlate, type TabBarItem,
} from '@ajinkyabhagwat/slateos-native';
import type { DemoPage } from './types';

function SettingsDemo() {
  const t = useSlate();
  const [wifi, setWifi] = useState(true);
  const [notify, setNotify] = useState(false);
  return (
    <List>
      <ListSection header="Connectivity">
        <ListRow icon="wifi" iconTint={t.c.infoSolid} title="Wi-Fi" detail="Home" onPress={() => {}} />
        <ListRow icon="bolt-off" iconTint={t.c.warningSolid} title="Low Power Mode" accessory="switch" checked={wifi} onCheckedChange={setWifi} />
      </ListSection>
      <ListSection header="General" footer="Daily summaries arrive at 8:00 AM.">
        <ListRow icon="bell" iconTint={t.c.dangerSolid} title="Notifications" accessory="switch" checked={notify} onCheckedChange={setNotify} />
        <ListRow icon="globe" title="Language" detail="English" onPress={() => {}} />
        <ListRow icon="lock" iconTint={t.c.successSolid} title="Privacy" onPress={() => {}} />
      </ListSection>
    </List>
  );
}

function ChoicesDemo() {
  const [plan, setPlan] = useState('monthly');
  const plans = [
    { value: 'monthly', title: 'Monthly', subtitle: '$8 per month' },
    { value: 'yearly', title: 'Yearly', subtitle: '$72 per year, save 25%' },
    { value: 'family', title: 'Family', subtitle: 'Up to 6 people, $120 per year' },
  ];
  return (
    <ListSection header="Plan">
      {plans.map((p) => (
        <ListRow key={p.value} title={p.title} subtitle={p.subtitle} accessory="check" checked={plan === p.value} onCheckedChange={() => setPlan(p.value)} />
      ))}
    </ListSection>
  );
}

const inbox = [
  { id: '1', from: 'Maya Patel', subject: 'Photos from Lisbon', time: '9:41' },
  { id: '2', from: 'Northwind Bank', subject: 'Your statement is ready', time: '8:12' },
  { id: '3', from: 'Leo Martin', subject: 'Lunch on Thursday?', time: 'Yesterday' },
  { id: '4', from: 'Ada Okafor', subject: 'Design review notes', time: 'Monday' },
];

function SwipeDemo({ fullSwipe = true }: { fullSwipe?: boolean }) {
  const t = useSlate();
  const [rows, setRows] = useState(inbox);
  const [read, setRead] = useState<string[]>([]);
  const remove = (id: string) => setRows((r) => r.filter((x) => x.id !== id));
  return (
    <View style={{ gap: t.space[3] }}>
      <View style={{ borderRadius: t.component.listRadius, borderWidth: 1, borderColor: t.c.border, overflow: 'hidden' }}>
        {rows.map((m, i) => (
          <SwipeableRow
            key={m.id}
            fullSwipe={fullSwipe}
            leftActions={[{ label: read.includes(m.id) ? 'Unread' : 'Read', icon: 'mail', tone: 'info', onPress: () => setRead((r) => (r.includes(m.id) ? r.filter((x) => x !== m.id) : [...r, m.id])) }]}
            rightActions={[
              { label: 'Delete', icon: 'trash', tone: 'danger', onPress: () => remove(m.id) },
              { label: 'Archive', icon: 'archive', tone: 'neutral', onPress: () => remove(m.id) },
            ]}
          >
            <View style={{ minHeight: t.component.rowHeight, paddingHorizontal: t.space[4], paddingVertical: t.space[3], borderTopWidth: i ? 1 : 0, borderTopColor: t.c.borderSubtle }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text weight={read.includes(m.id) ? '400' : '600'}>{m.from}</Text>
                <Text variant="footnote" tone="subtle">{m.time}</Text>
              </View>
              <Text variant="callout" tone="muted">{m.subject}</Text>
            </View>
          </SwipeableRow>
        ))}
      </View>
      {rows.length < inbox.length && <Button size="sm" variant="outline" onPress={() => setRows(inbox)}>Restore</Button>}
    </View>
  );
}

function TabsDemo({ variant }: { variant: 'underline' | 'pill' }) {
  const [tab, setTab] = useState('overview');
  return (
    <Tabs
      variant={variant}
      value={tab}
      onValueChange={setTab}
      items={[{ value: 'overview', label: 'Overview' }, { value: 'activity', label: 'Activity', badge: 4 }, { value: 'settings', label: 'Settings' }]}
    />
  );
}

const topics = ['For you', 'Following', 'Design', 'Engineering', 'Product', 'Research', 'Writing', 'Careers'];

function ScrollableTabs() {
  const [tab, setTab] = useState('For you');
  return <Tabs value={tab} onValueChange={setTab} items={topics.map((x) => ({ value: x, label: x }))} />;
}

function PagerTabs() {
  const t = useSlate();
  const [tab, setTab] = useState('upcoming');
  const Panel = ({ title, body }: { title: string; body: string }) => (
    <View style={{ paddingVertical: t.space[4], gap: t.space[1] }}>
      <Text variant="headline">{title}</Text>
      <Text variant="callout" tone="muted">{body}</Text>
    </View>
  );
  return (
    <Tabs
      value={tab}
      onValueChange={setTab}
      items={[{ value: 'upcoming', label: 'Upcoming' }, { value: 'past', label: 'Past' }, { value: 'drafts', label: 'Drafts' }]}
    >
      <Tabs.Content value="upcoming"><Panel title="2 trips" body="Lisbon in May, Kyoto in October." /></Tabs.Content>
      <Tabs.Content value="past"><Panel title="14 trips" body="Your last trip was Oslo, in February." /></Tabs.Content>
      <Tabs.Content value="drafts"><Panel title="1 draft" body="Weekend in Porto, not booked yet." /></Tabs.Content>
    </Tabs>
  );
}

const barItems: TabBarItem[] = [
  { value: 'home', label: 'Home', icon: 'home' },
  { value: 'search', label: 'Search', icon: 'search' },
  { value: 'inbox', label: 'Inbox', icon: 'inbox', badge: 3 },
  { value: 'profile', label: 'Profile', icon: 'user', badge: true },
];

function TabBarDemo({ items }: { items: TabBarItem[] }) {
  const t = useSlate();
  const [tab, setTab] = useState('home');
  return (
    <View style={{ borderRadius: t.component.cardRadius, borderWidth: 1, borderColor: t.c.border, overflow: 'hidden' }}>
      <View style={{ height: t.size.widthXs / 2, alignItems: 'center', justifyContent: 'center', backgroundColor: t.c.bg }}>
        <Text tone="subtle">{items.find((i) => i.value === tab)?.label}</Text>
      </View>
      <TabBar items={items} value={tab} onValueChange={setTab} safeArea={false} />
    </View>
  );
}

function AccordionDemo({ multiple }: { multiple?: boolean }) {
  return (
    <Accordion type={multiple ? 'multiple' : 'single'} defaultValue={multiple ? ['shipping', 'returns'] : ['shipping']}>
      <Accordion.Item value="shipping" title="How long does shipping take?">
        Most orders arrive in 2 to 4 business days. You will get a tracking link by email.
      </Accordion.Item>
      <Accordion.Item value="returns" title="Can I return an item?">
        Yes, within 30 days, unworn and with tags. Returns are free for members.
      </Accordion.Item>
      <Accordion.Item value="payment" title="Which payment methods do you accept?">
        Visa, Mastercard, American Express, Apple Pay and PayPal.
      </Accordion.Item>
    </Accordion>
  );
}

const slides = [
  { title: 'Plan together', body: 'Share a trip and everyone sees changes live.' },
  { title: 'Book in one place', body: 'Flights, stays and tables, all in your itinerary.' },
  { title: 'Travel offline', body: 'Tickets and maps are saved to your phone.' },
  { title: 'Split costs', body: 'Track who paid and settle up in a tap.' },
];

function CarouselDemo() {
  const t = useSlate();
  const [w, setW] = useState(0);
  const [index, setIndex] = useState(0);
  const progress = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((e) => {
    if (w) progress.value = e.contentOffset.x / w;
  });
  return (
    <View style={{ gap: t.space[4] }} onLayout={(e) => setW(e.nativeEvent.layout.width)}>
      <Animated.ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        onMomentumScrollEnd={(e) => setIndex(Math.round(e.nativeEvent.contentOffset.x / (w || 1)))}
      >
        {slides.map((s) => (
          <View key={s.title} style={{ width: w, paddingVertical: t.space[6], paddingHorizontal: t.space[4], gap: t.space[1], alignItems: 'center', backgroundColor: t.c.surface, borderRadius: t.component.cardRadius }}>
            <Text variant="title3">{s.title}</Text>
            <Text variant="callout" tone="muted" align="center">{s.body}</Text>
          </View>
        ))}
      </Animated.ScrollView>
      <PageDots count={slides.length} index={index} progress={progress} />
    </View>
  );
}

function StepDots() {
  const [i, setI] = useState(1);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
      <IconButton icon="chevron-left" accessibilityLabel="Previous" disabled={i === 0} onPress={() => setI(i - 1)} />
      <PageDots count={5} index={i} onIndexChange={setI} />
      <IconButton icon="chevron-right" accessibilityLabel="Next" disabled={i === 4} onPress={() => setI(i + 1)} />
    </View>
  );
}

const notes = ['Grocery list', 'Kyoto itinerary', 'Book club: chapter 7', 'Gift ideas', 'Bike service', 'Quarterly goals', 'Recipes to try', 'Garden plan', 'Podcast notes', 'Running log'];

function CollapsingDemo() {
  const t = useSlate();
  const header = useCollapsingHeader();
  return (
    <View style={{ height: 360, borderRadius: t.component.cardRadius, borderWidth: 1, borderColor: t.c.border, overflow: 'hidden', backgroundColor: t.c.bg }}>
      <Header
        title="Notes"
        collapse={header}
        safeArea={false}
        leading={<IconButton icon="chevron-left" accessibilityLabel="Back" />}
        trailing={<IconButton icon="edit" accessibilityLabel="New note" />}
      />
      <Animated.ScrollView onScroll={header.onScroll} scrollEventThrottle={16}>
        <Header.LargeTitle collapse={header}>Notes</Header.LargeTitle>
        <View style={{ paddingHorizontal: t.space[4], paddingBottom: t.space[4] }}>
          <ListSection>
            {notes.map((n) => <ListRow key={n} title={n} onPress={() => {}} />)}
          </ListSection>
        </View>
      </Animated.ScrollView>
    </View>
  );
}

function CompactHeader() {
  const t = useSlate();
  return (
    <View style={{ borderRadius: t.component.cardRadius, borderWidth: 1, borderColor: t.c.border, overflow: 'hidden' }}>
      <Header
        title="Edit profile"
        safeArea={false}
        leading={<Button variant="plain" size="sm">Cancel</Button>}
        trailing={<Button variant="plain" size="sm">Save</Button>}
      />
    </View>
  );
}

export const pages: DemoPage[] = [
  {
    slug: 'list',
    name: 'List',
    group: 'Navigation',
    description: 'Inset grouped rows like iOS Settings: icon tiles, values, chevrons, switches and checkmarks.',
    demos: [
      {
        title: 'Settings',
        render: () => <SettingsDemo />,
        code: `<List>
  <ListSection header="Connectivity">
    <ListRow icon="wifi" iconTint={t.c.infoSolid} title="Wi-Fi" detail="Home" onPress={openWifi} />
    <ListRow icon="bolt-off" iconTint={t.c.warningSolid} title="Low Power Mode" accessory="switch" checked={lowPower} onCheckedChange={setLowPower} />
  </ListSection>
  <ListSection header="General" footer="Daily summaries arrive at 8:00 AM.">
    <ListRow icon="bell" iconTint={t.c.dangerSolid} title="Notifications" accessory="switch" checked={notify} onCheckedChange={setNotify} />
    <ListRow icon="globe" title="Language" detail="English" onPress={openLanguage} />
    <ListRow icon="lock" iconTint={t.c.successSolid} title="Privacy" onPress={openPrivacy} />
  </ListSection>
</List>`,
      },
      {
        title: 'Single choice',
        render: () => <ChoicesDemo />,
        code: `<ListSection header="Plan">
  {plans.map((p) => (
    <ListRow
      key={p.value}
      title={p.title}
      subtitle={p.subtitle}
      accessory="check"
      checked={plan === p.value}
      onCheckedChange={() => setPlan(p.value)}
    />
  ))}
</ListSection>`,
      },
      {
        title: 'People and destructive',
        render: () => (
          <List>
            <ListSection header="Members">
              <ListRow leading={<Avatar name="Maya Patel" size="sm" />} title="Maya Patel" subtitle="Owner" />
              <ListRow leading={<Avatar name="Leo Martin" size="sm" />} title="Leo Martin" subtitle="Editor" onPress={() => {}} />
            </ListSection>
            <ListSection>
              <ListRow title="Leave workspace" destructive onPress={() => {}} />
            </ListSection>
          </List>
        ),
        code: `<List>
  <ListSection header="Members">
    <ListRow leading={<Avatar name="Maya Patel" size="sm" />} title="Maya Patel" subtitle="Owner" />
    <ListRow leading={<Avatar name="Leo Martin" size="sm" />} title="Leo Martin" subtitle="Editor" onPress={openMember} />
  </ListSection>
  <ListSection>
    <ListRow title="Leave workspace" destructive onPress={leave} />
  </ListSection>
</List>`,
      },
    ],
  },
  {
    slug: 'swipeable-row',
    name: 'SwipeableRow',
    group: 'Navigation',
    description: 'Swipe a row to reveal actions. A long swipe runs the first action, with a tap of haptics at the threshold.',
    demos: [
      {
        title: 'Inbox',
        render: () => <SwipeDemo />,
        code: `<SwipeableRow
  leftActions={[{ label: 'Read', icon: 'mail', tone: 'info', onPress: () => markRead(m.id) }]}
  rightActions={[
    { label: 'Delete', icon: 'trash', tone: 'danger', onPress: () => remove(m.id) },
    { label: 'Archive', icon: 'archive', onPress: () => archive(m.id) },
  ]}
>
  <MessageRow message={m} />
</SwipeableRow>`,
      },
      {
        title: 'No full swipe',
        render: () => <SwipeDemo fullSwipe={false} />,
        code: `<SwipeableRow fullSwipe={false} rightActions={actions}>
  <MessageRow message={m} />
</SwipeableRow>`,
      },
    ],
  },
  {
    slug: 'tabs',
    name: 'Tabs',
    group: 'Navigation',
    description: 'Top tabs whose indicator springs to the selected label. Add Tabs.Content to swipe between pages.',
    demos: [
      {
        title: 'Underline',
        render: () => <TabsDemo variant="underline" />,
        code: `<Tabs
  value={tab}
  onValueChange={setTab}
  items={[
    { value: 'overview', label: 'Overview' },
    { value: 'activity', label: 'Activity', badge: 4 },
    { value: 'settings', label: 'Settings' },
  ]}
/>`,
      },
      {
        title: 'Pill',
        render: () => <TabsDemo variant="pill" />,
        code: `<Tabs variant="pill" value={tab} onValueChange={setTab} items={items} />`,
      },
      {
        title: 'Scrollable',
        render: () => <ScrollableTabs />,
        code: `<Tabs value={topic} onValueChange={setTopic} items={topics.map((x) => ({ value: x, label: x }))} />`,
      },
      {
        title: 'Swipeable pages',
        render: () => <PagerTabs />,
        code: `<Tabs value={tab} onValueChange={setTab} items={items}>
  <Tabs.Content value="upcoming"><Upcoming /></Tabs.Content>
  <Tabs.Content value="past"><Past /></Tabs.Content>
  <Tabs.Content value="drafts"><Drafts /></Tabs.Content>
</Tabs>`,
      },
    ],
  },
  {
    slug: 'tab-bar',
    name: 'TabBar',
    group: 'Navigation',
    description: 'A bottom tab bar with badges that sits above the home indicator. Drops into expo-router tabs.',
    demos: [
      {
        title: 'Basic',
        render: () => <TabBarDemo items={barItems.map(({ badge, ...i }) => i)} />,
        code: `<TabBar
  value={tab}
  onValueChange={setTab}
  items={[
    { value: 'home', label: 'Home', icon: 'home' },
    { value: 'search', label: 'Search', icon: 'search' },
    { value: 'inbox', label: 'Inbox', icon: 'inbox' },
    { value: 'profile', label: 'Profile', icon: 'user' },
  ]}
/>`,
      },
      {
        title: 'Badges',
        render: () => <TabBarDemo items={barItems} />,
        code: `{ value: 'inbox', label: 'Inbox', icon: 'inbox', badge: 3 },
{ value: 'profile', label: 'Profile', icon: 'user', badge: true },`,
      },
      {
        title: 'With expo-router',
        render: () => <TabBarDemo items={barItems.slice(0, 3)} />,
        code: `// app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';
import { TabBar, type IconName } from '@ajinkyabhagwat/slateos-native';

const icons: Record<string, IconName> = { index: 'home', search: 'search', inbox: 'inbox' };

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={({ state, descriptors, navigation }) => (
        <TabBar
          items={state.routes.map((r) => ({
            value: r.name,
            label: descriptors[r.key].options.title ?? r.name,
            icon: icons[r.name],
            badge: descriptors[r.key].options.tabBarBadge as number | undefined,
          }))}
          value={state.routes[state.index].name}
          onValueChange={(name) => navigation.navigate(name)}
        />
      )}
    />
  );
}`,
      },
    ],
  },
  {
    slug: 'accordion',
    name: 'Accordion',
    group: 'Navigation',
    description: 'Sections that expand in place. The chevron turns and the height springs open.',
    demos: [
      {
        title: 'Single',
        render: () => <AccordionDemo />,
        code: `<Accordion defaultValue={['shipping']}>
  <Accordion.Item value="shipping" title="How long does shipping take?">
    Most orders arrive in 2 to 4 business days. You will get a tracking link by email.
  </Accordion.Item>
  <Accordion.Item value="returns" title="Can I return an item?">
    Yes, within 30 days, unworn and with tags. Returns are free for members.
  </Accordion.Item>
  <Accordion.Item value="payment" title="Which payment methods do you accept?">
    Visa, Mastercard, American Express, Apple Pay and PayPal.
  </Accordion.Item>
</Accordion>`,
      },
      {
        title: 'Multiple',
        render: () => <AccordionDemo multiple />,
        code: `<Accordion type="multiple" defaultValue={['shipping', 'returns']}>
  …
</Accordion>`,
      },
    ],
  },
  {
    slug: 'page-dots',
    name: 'PageDots',
    group: 'Navigation',
    description: 'A carousel page indicator. The current dot stretches into a pill and follows the finger.',
    demos: [
      {
        title: 'Following a carousel',
        render: () => <CarouselDemo />,
        code: `const progress = useSharedValue(0);
const onScroll = useAnimatedScrollHandler((e) => {
  progress.value = e.contentOffset.x / pageWidth;
});

<Animated.ScrollView horizontal pagingEnabled onScroll={onScroll} scrollEventThrottle={16}>
  {slides}
</Animated.ScrollView>
<PageDots count={slides.length} index={index} progress={progress} />`,
      },
      {
        title: 'Stepped',
        render: () => <StepDots />,
        code: `<PageDots count={5} index={step} onIndexChange={setStep} />`,
      },
    ],
  },
  {
    slug: 'header',
    name: 'Header',
    group: 'Navigation',
    description: 'A screen header for apps without native headers. The large title scrolls away into a compact one.',
    demos: [
      {
        title: 'Collapsing large title',
        render: () => <CollapsingDemo />,
        code: `const header = useCollapsingHeader();

<Header
  title="Notes"
  collapse={header}
  leading={<IconButton icon="chevron-left" accessibilityLabel="Back" />}
  trailing={<IconButton icon="edit" accessibilityLabel="New note" />}
/>
<Animated.ScrollView onScroll={header.onScroll} scrollEventThrottle={16}>
  <Header.LargeTitle collapse={header}>Notes</Header.LargeTitle>
  <ListSection>{rows}</ListSection>
</Animated.ScrollView>`,
      },
      {
        title: 'Compact',
        render: () => <CompactHeader />,
        code: `<Header
  title="Edit profile"
  leading={<Button variant="plain" size="sm">Cancel</Button>}
  trailing={<Button variant="plain" size="sm">Save</Button>}
/>`,
      },
    ],
  },
];
