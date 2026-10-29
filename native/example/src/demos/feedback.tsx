import { useEffect, useState, useSyncExternalStore } from 'react';
import { View } from 'react-native';
import {
  Alert, Banner, Button, EmptyState, Progress, ProgressRing, Skeleton, Spinner, Text, Toaster, toast, useSlate,
} from '@ajinkyabhagwat/slateos-native';
import type { DemoPage } from './types';

const Row = ({ children }: { children: React.ReactNode }) => (
  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>{children}</View>
);
const Stack = ({ children, gap = 12 }: { children: React.ReactNode; gap?: number }) => <View style={{ gap }}>{children}</View>;
const wait = (ms: number, fail = false) => new Promise<void>((ok, no) => setTimeout(() => (fail ? no(new Error('Network')) : ok()), ms));

// The Toast page mounts one Toaster (in its first demo); the Position demo flips where it sits.
let toasterPosition: 'top' | 'bottom' = 'top';
const positionListeners = new Set<() => void>();
const setToasterPosition = (p: 'top' | 'bottom') => { toasterPosition = p; positionListeners.forEach((l) => l()); };
const usePosition = () =>
  useSyncExternalStore((l) => { positionListeners.add(l); return () => { positionListeners.delete(l); }; }, () => toasterPosition);

function ToastBasics() {
  const position = usePosition();
  return (
    <Row>
      <Toaster position={position} />
      <Button variant="outline" onPress={() => toast('Draft saved')}>Default</Button>
      <Button variant="outline" onPress={() => toast.success('Payment sent')}>Success</Button>
      <Button variant="outline" onPress={() => toast.warning('Storage almost full')}>Warning</Button>
      <Button variant="outline" onPress={() => toast.error('Could not connect')}>Error</Button>
    </Row>
  );
}

function ToastPosition() {
  const position = usePosition();
  return (
    <Row>
      <Button variant={position === 'top' ? 'solid' : 'outline'} onPress={() => { setToasterPosition('top'); toast('Toasts now appear at the top'); }}>Top</Button>
      <Button variant={position === 'bottom' ? 'solid' : 'outline'} onPress={() => { setToasterPosition('bottom'); toast('Toasts now appear at the bottom'); }}>Bottom</Button>
    </Row>
  );
}

function ProgressDemo() {
  const [v, setV] = useState(32);
  return (
    <Stack>
      <Progress value={v} accessibilityLabel="Upload" />
      <Progress value={v} size="md" accessibilityLabel="Upload" />
      <Row>
        <Button size="sm" variant="outline" onPress={() => setV((x) => Math.max(0, x - 20))}>Less</Button>
        <Button size="sm" variant="outline" onPress={() => setV((x) => Math.min(100, x + 20))}>More</Button>
        <Text variant="footnote" tone="subtle" tabular>{v}%</Text>
      </Row>
    </Stack>
  );
}

function RingDemo() {
  const [v, setV] = useState(64);
  return (
    <Row>
      <ProgressRing value={v} size="sm" accessibilityLabel="Daily goal" />
      <ProgressRing value={v} label accessibilityLabel="Daily goal" />
      <ProgressRing value={v} size="lg" tone="success" label accessibilityLabel="Daily goal" />
      <Button size="sm" variant="outline" onPress={() => setV((x) => (x >= 100 ? 8 : Math.min(100, x + 23)))}>Step</Button>
    </Row>
  );
}

function SkeletonToggle() {
  const t = useSlate();
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    if (loaded) return;
    const id = setTimeout(() => setLoaded(true), 2400);
    return () => clearTimeout(id);
  }, [loaded]);
  return (
    <Stack gap={16}>
      {loaded ? (
        <View style={{ flexDirection: 'row', gap: t.space[3], alignItems: 'center' }}>
          <View style={{ width: t.size.avatarLg, height: t.size.avatarLg, borderRadius: t.size.avatarLg / 2, backgroundColor: t.c.accentSoft }} />
          <View style={{ flex: 1 }}>
            <Text variant="headline">Maya Patel</Text>
            <Text variant="footnote" tone="subtle">Shared 3 photos from Lisbon</Text>
          </View>
        </View>
      ) : (
        <View style={{ flexDirection: 'row', gap: t.space[3], alignItems: 'center' }}>
          <Skeleton.Circle />
          <View style={{ flex: 1, gap: t.space[2] }}>
            <Skeleton width="50%" height={t.type.headline.fontSize} />
            <Skeleton width="80%" height={t.type.footnote.fontSize} />
          </View>
        </View>
      )}
      <Button size="sm" variant="outline" onPress={() => setLoaded(false)}>Reload</Button>
    </Stack>
  );
}

function AlertDismiss() {
  const [open, setOpen] = useState(true);
  if (!open) return <Button size="sm" variant="outline" onPress={() => setOpen(true)}>Show again</Button>;
  return (
    <Alert
      tone="info"
      title="New sign-in from Safari"
      description="If this was not you, change your password."
      action={{ label: 'Review activity', onPress: () => {} }}
      onDismiss={() => setOpen(false)}
    />
  );
}

function Screen({ children }: { children: React.ReactNode }) {
  const t = useSlate();
  return (
    <View style={{ borderWidth: 1, borderColor: t.c.border, borderRadius: t.component.cardRadius, overflow: 'hidden', backgroundColor: t.c.bg }}>
      {children}
      <View style={{ padding: t.space[4], gap: t.space[2] }}>
        <Text variant="headline">Today</Text>
        <Text variant="callout" tone="muted">3 tasks due, 1 meeting at 2:30 PM.</Text>
      </View>
    </View>
  );
}

function BannerOffline() {
  const [visible, setVisible] = useState(true);
  return (
    <Stack>
      <Screen>
        <Banner tone="warning" visible={visible} onDismiss={() => setVisible(false)} action={{ label: 'Retry', onPress: () => {} }}>
          You are offline. Changes will sync later.
        </Banner>
      </Screen>
      {!visible && <Button size="sm" variant="outline" onPress={() => setVisible(true)}>Show banner</Button>}
    </Stack>
  );
}

export const pages: DemoPage[] = [
  {
    slug: 'alert',
    name: 'Alert',
    group: 'Feedback',
    description: 'An inline callout for status that belongs to the content around it. Danger and warning are announced.',
    demos: [
      {
        title: 'Tones',
        render: () => (
          <Stack>
            <Alert tone="info" title="Update available" description="Version 2.4 adds offline maps." />
            <Alert tone="success" title="Backup complete" description="All 1,204 photos are in the cloud." />
            <Alert tone="warning" title="Card expires soon" description="Your Visa ending 4242 expires in May." />
            <Alert tone="danger" title="Payment failed" description="Your bank declined the charge. Try another card." />
          </Stack>
        ),
        code: `<Alert tone="info" title="Update available" description="Version 2.4 adds offline maps." />
<Alert tone="success" title="Backup complete" description="All 1,204 photos are in the cloud." />
<Alert tone="warning" title="Card expires soon" description="Your Visa ending 4242 expires in May." />
<Alert tone="danger" title="Payment failed" description="Your bank declined the charge. Try another card." />`,
      },
      {
        title: 'Action and dismiss',
        render: () => <AlertDismiss />,
        code: `<Alert
  tone="info"
  title="New sign-in from Safari"
  description="If this was not you, change your password."
  action={{ label: 'Review activity', onPress: openActivity }}
  onDismiss={() => setOpen(false)}
/>`,
      },
      {
        title: 'Neutral, no icon',
        render: () => <Alert icon={false} description="Prices include tax. Delivery is calculated at checkout." />,
        code: `<Alert icon={false} description="Prices include tax. Delivery is calculated at checkout." />`,
      },
    ],
  },
  {
    slug: 'toast',
    name: 'Toast',
    group: 'Feedback',
    description: 'Brief, imperative messages that stack, pause while touched and swipe away. Mount one <Toaster /> at the root.',
    demos: [
      {
        title: 'Tones',
        render: () => <ToastBasics />,
        code: `// Once, near the root of the app:
<Toaster />

// Anywhere:
toast('Draft saved');
toast.success('Payment sent');
toast.warning('Storage almost full');
toast.error('Could not connect');`,
      },
      {
        title: 'Description and action',
        render: () => (
          <Row>
            <Button
              variant="outline"
              onPress={() =>
                toast('Conversation archived', {
                  description: 'You can find it in Archive.',
                  action: { label: 'Undo', onPress: () => toast.success('Restored') },
                })
              }
            >
              Archive
            </Button>
          </Row>
        ),
        code: `toast('Conversation archived', {
  description: 'You can find it in Archive.',
  action: { label: 'Undo', onPress: () => toast.success('Restored') },
});`,
      },
      {
        title: 'Promise',
        render: () => (
          <Row>
            <Button variant="outline" onPress={() => toast.promise(wait(1800), { loading: 'Uploading report…', success: 'Report uploaded', error: 'Upload failed' })}>
              Upload
            </Button>
            <Button variant="outline" onPress={() => toast.promise(wait(1800, true), { loading: 'Sending invite…', success: 'Invite sent', error: 'Could not send the invite' })}>
              Upload (fails)
            </Button>
          </Row>
        ),
        code: `toast.promise(uploadReport(), {
  loading: 'Uploading report…',
  success: 'Report uploaded',
  error: 'Upload failed',
});`,
      },
      {
        title: 'Position',
        render: () => <ToastPosition />,
        code: `<Toaster position="bottom" />`,
      },
    ],
  },
  {
    slug: 'progress',
    name: 'Progress',
    group: 'Feedback',
    description: 'Shows how far along a task is. The fill springs to each value; use indeterminate when the length is unknown.',
    demos: [
      {
        title: 'Linear',
        render: () => <ProgressDemo />,
        code: `<Progress value={progress} accessibilityLabel="Upload" />
<Progress value={progress} size="md" accessibilityLabel="Upload" />`,
      },
      {
        title: 'Tones',
        render: () => (
          <Stack>
            <Progress value={82} tone="success" accessibilityLabel="Profile complete" />
            <Progress value={91} tone="warning" accessibilityLabel="Storage used" />
            <Progress value={100} tone="danger" accessibilityLabel="Data plan used" />
          </Stack>
        ),
        code: `<Progress value={82} tone="success" accessibilityLabel="Profile complete" />
<Progress value={91} tone="warning" accessibilityLabel="Storage used" />
<Progress value={100} tone="danger" accessibilityLabel="Data plan used" />`,
      },
      {
        title: 'Indeterminate',
        render: () => <Progress indeterminate accessibilityLabel="Preparing download" />,
        code: `<Progress indeterminate accessibilityLabel="Preparing download" />`,
      },
      {
        title: 'Ring',
        render: () => <RingDemo />,
        code: `<ProgressRing value={64} size="sm" accessibilityLabel="Daily goal" />
<ProgressRing value={64} label accessibilityLabel="Daily goal" />
<ProgressRing value={64} size="lg" tone="success" label accessibilityLabel="Daily goal" />`,
      },
    ],
  },
  {
    slug: 'spinner',
    name: 'Spinner',
    group: 'Feedback',
    description: 'A crisp rotating arc for short waits. Use it instead of ActivityIndicator so loading matches the brand.',
    demos: [
      {
        title: 'Sizes',
        render: () => (
          <Row>
            <Spinner size="sm" />
            <Spinner />
            <Spinner size="lg" />
          </Row>
        ),
        code: `<Spinner size="sm" />
<Spinner />
<Spinner size="lg" />`,
      },
      {
        title: 'With a label',
        render: () => (
          <Row>
            <Spinner size="sm" accessibilityLabel="Syncing" />
            <Text variant="callout" tone="muted">Syncing 12 notes…</Text>
          </Row>
        ),
        code: `<Spinner size="sm" accessibilityLabel="Syncing" />
<Text variant="callout" tone="muted">Syncing 12 notes…</Text>`,
      },
      {
        title: 'Colour',
        render: () => <SpinnerColours />,
        code: `<Spinner color={t.c.accent} />
<Spinner color={t.c.success} />
<Spinner color={t.c.danger} />`,
      },
    ],
  },
  {
    slug: 'skeleton',
    name: 'Skeleton',
    group: 'Feedback',
    description: 'Placeholder shapes that pulse softly while content loads. Still under Reduce Motion.',
    demos: [
      {
        title: 'Loading, then loaded',
        render: () => <SkeletonToggle />,
        code: `{loading ? (
  <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
    <Skeleton.Circle />
    <View style={{ flex: 1, gap: 8 }}>
      <Skeleton width="50%" height={16} />
      <Skeleton width="80%" height={13} />
    </View>
  </View>
) : (
  <PostHeader post={post} />
)}`,
      },
      {
        title: 'Text lines',
        render: () => <Skeleton.Text lines={4} />,
        code: `<Skeleton.Text lines={4} />`,
      },
      {
        title: 'Card',
        render: () => (
          <Stack>
            <Skeleton height={140} radius={12} />
            <Skeleton.Text lines={2} variant="callout" lastLineWidth="40%" />
          </Stack>
        ),
        code: `<Skeleton height={140} radius={12} />
<Skeleton.Text lines={2} variant="callout" lastLineWidth="40%" />`,
      },
    ],
  },
  {
    slug: 'empty-state',
    name: 'EmptyState',
    group: 'Feedback',
    description: 'A centred placeholder for an empty screen or list: what is missing and what to do next.',
    demos: [
      {
        title: 'First run',
        render: () => (
          <EmptyState
            icon="inbox"
            title="No messages yet"
            description="When someone writes to you, it will show up here."
            actions={<Button icon="plus">New message</Button>}
          />
        ),
        code: `<EmptyState
  icon="inbox"
  title="No messages yet"
  description="When someone writes to you, it will show up here."
  actions={<Button icon="plus">New message</Button>}
/>`,
      },
      {
        title: 'No results',
        render: () => (
          <EmptyState
            icon="search"
            title="No results for “lisbon”"
            description="Check the spelling or try a broader search."
            actions={<Button variant="outline">Clear search</Button>}
          />
        ),
        code: `<EmptyState
  icon="search"
  title="No results for “lisbon”"
  description="Check the spelling or try a broader search."
  actions={<Button variant="outline">Clear search</Button>}
/>`,
      },
      {
        title: 'Two actions',
        render: () => (
          <EmptyState
            icon="wifi"
            title="You are offline"
            description="Connect to the internet to see your feed."
            actions={
              <>
                <Button>Try again</Button>
                <Button variant="ghost">Open downloads</Button>
              </>
            }
          />
        ),
        code: `<EmptyState
  icon="wifi"
  title="You are offline"
  description="Connect to the internet to see your feed."
  actions={
    <>
      <Button>Try again</Button>
      <Button variant="ghost">Open downloads</Button>
    </>
  }
/>`,
      },
    ],
  },
  {
    slug: 'banner',
    name: 'Banner',
    group: 'Feedback',
    description: 'A full-width strip at the top of content for app-wide status. Slides away when dismissed.',
    demos: [
      {
        title: 'Offline',
        render: () => <BannerOffline />,
        code: `<Banner
  tone="warning"
  visible={visible}
  onDismiss={() => setVisible(false)}
  action={{ label: 'Retry', onPress: retry }}
>
  You are offline. Changes will sync later.
</Banner>`,
      },
      {
        title: 'Trial ending',
        render: () => (
          <Screen>
            <Banner tone="info" title="3 days left." onDismiss={() => {}} action={{ label: 'Upgrade', onPress: () => {} }}>
              Your trial ends on Friday.
            </Banner>
          </Screen>
        ),
        code: `<Banner tone="info" title="3 days left." onDismiss={() => {}} action={{ label: 'Upgrade', onPress: upgrade }}>
  Your trial ends on Friday.
</Banner>`,
      },
      {
        title: 'Tones',
        render: () => (
          <View style={{ gap: 8 }}>
            <Banner tone="success">Your order is on its way.</Banner>
            <Banner tone="danger">We could not process your last payment.</Banner>
            <Banner tone="neutral" icon="sparkles">Dark mode now follows your system setting.</Banner>
          </View>
        ),
        code: `<Banner tone="success">Your order is on its way.</Banner>
<Banner tone="danger">We could not process your last payment.</Banner>
<Banner tone="neutral" icon="sparkles">Dark mode now follows your system setting.</Banner>`,
      },
    ],
  },
];

function SpinnerColours() {
  const t = useSlate();
  return (
    <Row>
      <Spinner color={t.c.accent} />
      <Spinner color={t.c.success} />
      <Spinner color={t.c.danger} />
    </Row>
  );
}
