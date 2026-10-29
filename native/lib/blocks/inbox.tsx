import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Avatar, Button, EmptyState, IconButton, SearchField, SwipeableRow, Tabs, Text, Touchable, useSlate,
} from '@ajinkyabhagwat/slateos-native';

export type InboxMessage = { id: string; from: string; subject: string; preview: string; time: string; unread?: boolean; flagged?: boolean };

export type InboxScreenProps = {
  messages?: InboxMessage[];
  onOpenMessage?: (id: string) => void;
  onCompose?: () => void;
};

type Filter = 'all' | 'unread' | 'flagged';

const DEFAULT_MESSAGES: InboxMessage[] = [
  { id: '1', from: 'Priya Raman', subject: 'Venue confirmed for Friday', preview: 'Great news: the loft is ours from 6 pm. I’ve attached the floor plan so we can sort the seating.', time: '9:41', unread: true },
  { id: '2', from: 'Jordan Lee', subject: 'Re: Pricing page', preview: 'I tried the annual toggle on my phone and the savings badge wraps onto two lines. Screenshot below.', time: '8:12', unread: true, flagged: true },
  { id: '3', from: 'Stripe', subject: 'Your payout is on its way', preview: '$4,200.00 will arrive in your Chase account ending 42 by Thursday.', time: 'Yesterday' },
  { id: '4', from: 'Diego Alvarez', subject: 'Photos from the shoot', preview: 'Picked my favourite 20. Let me know which ones you want retouched before Monday.', time: 'Mon', flagged: true },
  { id: '5', from: 'Kenji Watanabe', subject: 'Quick question', preview: 'Do you have ten minutes tomorrow to look at the onboarding copy together?', time: 'Sun' },
];

/** A mail-style inbox: search, filters with counts, swipe to archive or mark read, and an empty state. */
export function InboxScreen({ messages = DEFAULT_MESSAGES, onOpenMessage, onCompose }: InboxScreenProps) {
  const t = useSlate();
  const insets = useSafeAreaInsets();
  const [list, setList] = useState(messages);
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');

  const update = (id: string, patch: Partial<InboxMessage>) => setList((l) => l.map((m) => (m.id === id ? { ...m, ...patch } : m)));
  const remove = (id: string) => setList((l) => l.filter((m) => m.id !== id));

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return list.filter((m) =>
      (filter === 'all' || (filter === 'unread' ? m.unread : m.flagged)) &&
      (!q || `${m.from} ${m.subject} ${m.preview}`.toLowerCase().includes(q)),
    );
  }, [list, filter, query]);

  return (
    <View style={{ flex: 1, backgroundColor: t.c.bg, paddingTop: insets.top }}>
      <View style={{ paddingHorizontal: t.component.screenPadding, paddingTop: t.space[2], gap: t.space[3] }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text variant="title1" accessibilityRole="header">Inbox</Text>
          <IconButton icon="edit" variant="soft" round accessibilityLabel="New message" onPress={onCompose} />
        </View>
        <SearchField placeholder="Search mail" value={query} onChangeText={setQuery} />
        <Tabs
          value={filter}
          onValueChange={setFilter}
          items={[
            { value: 'all', label: 'All' },
            { value: 'unread', label: 'Unread', badge: list.filter((m) => m.unread).length || undefined },
            { value: 'flagged', label: 'Flagged' },
          ]}
        />
      </View>

      {shown.length === 0 ? (
        <EmptyState
          icon={query ? 'search' : 'inbox'}
          title={query ? `No results for “${query.trim()}”` : filter === 'all' ? 'Inbox zero' : `Nothing ${filter}`}
          description={query ? 'Check the spelling or search for a name.' : 'New messages will show up here.'}
          actions={query ? <Button variant="outline" onPress={() => setQuery('')}>Clear search</Button> : undefined}
          style={{ flex: 1 }}
        />
      ) : (
        <ScrollView keyboardDismissMode="on-drag" contentContainerStyle={{ paddingBottom: insets.bottom + t.space[6] }}>
          {shown.map((m, i) => (
            <SwipeableRow
              key={m.id}
              leftActions={[{ label: m.unread ? 'Read' : 'Unread', icon: 'mail', tone: 'info', onPress: () => update(m.id, { unread: !m.unread }) }]}
              rightActions={[
                { label: 'Archive', icon: 'archive', tone: 'accent', onPress: () => remove(m.id) },
                { label: m.flagged ? 'Unflag' : 'Flag', icon: 'flag', tone: 'warning', onPress: () => update(m.id, { flagged: !m.flagged }) },
              ]}
            >
              <Touchable
                onPress={() => { update(m.id, { unread: false }); onOpenMessage?.(m.id); }}
                pressScale={1}
                pressedStyle={{ backgroundColor: t.c.surfaceHover }}
                accessibilityRole="button"
                accessibilityLabel={`${m.unread ? 'Unread. ' : ''}${m.from}. ${m.subject}. ${m.time}`}
                style={{ backgroundColor: t.c.bg }}
              >
                <View style={{ flexDirection: 'row', gap: t.space[3], paddingHorizontal: t.component.screenPadding, paddingVertical: t.space[3] }}>
                  <View style={{ width: t.space[2], paddingTop: t.space[4] }}>
                    {m.unread && <View style={{ width: t.space[2], height: t.space[2], borderRadius: t.radius.full, backgroundColor: t.c.accentSolid }} />}
                  </View>
                  <Avatar name={m.from} size="md" />
                  <View style={{ flex: 1, gap: t.space['0_5'] }}>
                    <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: t.space[2] }}>
                      <Text weight={m.unread ? '600' : '400'} numberOfLines={1} style={{ flex: 1 }}>{m.from}</Text>
                      {m.flagged && <Text variant="caption" tone="warning">Flagged</Text>}
                      <Text variant="footnote" tone="subtle" tabular>{m.time}</Text>
                    </View>
                    <Text variant="callout" weight={m.unread ? '500' : '400'} numberOfLines={1}>{m.subject}</Text>
                    <Text variant="footnote" tone="muted" numberOfLines={2}>{m.preview}</Text>
                  </View>
                </View>
              </Touchable>
              {i < shown.length - 1 && <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: t.c.border, marginLeft: t.component.screenPadding + t.space[5] + t.size.avatarMd }} />}
            </SwipeableRow>
          ))}
        </ScrollView>
      )}
    </View>
  );
}
