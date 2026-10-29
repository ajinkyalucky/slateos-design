import { useState } from 'react';
import { View } from 'react-native';
import {
  ActionSheet, AlertDialog, Button, Calendar, ContextMenu, DatePicker, Dialog, Icon, IconButton, Input, Menu, Popover, Select, Sheet,
  SheetScrollView, Text, Tooltip, useSlate, type DateRange, type MenuEntry,
} from '@ajinkyabhagwat/slateos-native';
import type { DemoPage } from './types';

const Row = ({ children }: { children: React.ReactNode }) => (
  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>{children}</View>
);

const today = () => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), d.getDate()); };
const inDays = (n: number) => { const d = today(); d.setDate(d.getDate() + n); return d; };

// Sheet

function OrderSheetDemo() {
  const t = useSlate();
  const [open, setOpen] = useState(false);
  const line = (label: string, value: string, strong?: boolean) => (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: t.space[2] }}>
      <Text tone={strong ? 'default' : 'muted'} weight={strong ? '600' : '400'}>{label}</Text>
      <Text tabular weight={strong ? '600' : '400'}>{value}</Text>
    </View>
  );
  return (
    <>
      <Button onPress={() => setOpen(true)}>View order</Button>
      <Sheet
        open={open}
        onOpenChange={setOpen}
        title="Order #4821"
        description="Arrives Thursday, 14 November"
        footer={<Button block onPress={() => setOpen(false)}>Track package</Button>}
      >
        {line('Linen shirt, M', '$58.00')}
        {line('Canvas tote', '$24.00')}
        {line('Shipping', 'Free')}
        <View style={{ height: 1, backgroundColor: t.c.borderSubtle, marginVertical: t.space[1] }} />
        {line('Total', '$82.00', true)}
      </Sheet>
    </>
  );
}

const activity = Array.from({ length: 30 }, (_, i) => ({
  who: ['Maya Chen', 'Leo Park', 'Sam Ortiz', 'Priya Nair', 'Jon Weber'][i % 5],
  what: ['commented on Q4 roadmap', 'moved Launch plan to Done', 'invited you to Design review', 'uploaded brand-guide.pdf', 'renamed Backlog'][i % 5],
  when: `${i + 2}m ago`,
}));

function ActivitySheetDemo() {
  const t = useSlate();
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="outline" icon="history" onPress={() => setOpen(true)}>Recent activity</Button>
      <Sheet open={open} onOpenChange={setOpen} detents={[0.5, 0.92]} title="Activity">
        <SheetScrollView>
          {activity.map((a, i) => (
            <View key={i} style={{ paddingVertical: t.space[3], borderBottomWidth: 1, borderBottomColor: t.c.borderSubtle }}>
              <Text><Text weight="600">{a.who}</Text> {a.what}</Text>
              <Text variant="footnote" tone="subtle">{a.when}</Text>
            </View>
          ))}
        </SheetScrollView>
      </Sheet>
    </>
  );
}

function RenameSheetDemo() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('Spring campaign');
  return (
    <>
      <Button variant="secondary" icon="edit" onPress={() => setOpen(true)}>Rename project</Button>
      <Sheet
        open={open}
        onOpenChange={setOpen}
        title="Rename project"
        description="Everyone on the project sees the new name."
        footer={<Button block disabled={!name.trim()} onPress={() => setOpen(false)}>Save</Button>}
      >
        <Input label="Project name" value={name} onChangeText={setName} autoFocus clearable returnKeyType="done" />
      </Sheet>
    </>
  );
}

// Action sheet

function PhotoActionsDemo() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="outline" icon="image" onPress={() => setOpen(true)}>Photo options</Button>
      <ActionSheet
        open={open}
        onOpenChange={setOpen}
        actions={[
          { label: 'Share', icon: 'share' },
          { label: 'Copy link', icon: 'link' },
          { label: 'Add to album', icon: 'folder' },
          { label: 'Delete photo', icon: 'trash', destructive: true },
        ]}
      />
    </>
  );
}

function LeaveGroupDemo() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="secondary" onPress={() => setOpen(true)}>Group settings</Button>
      <ActionSheet
        open={open}
        onOpenChange={setOpen}
        title="Weekend hikers"
        message="12 members. Notifications are on."
        actions={[
          { label: 'Mute for 8 hours', icon: 'bolt-off' },
          { label: 'Pin to top', icon: 'pin' },
          { label: 'Leave group', icon: 'log-out', destructive: true },
        ]}
      />
    </>
  );
}

// Dialog

function EditProfileDialogDemo() {
  const t = useSlate();
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onPress={() => setOpen(true)}>Edit profile</Button>
      <Dialog
        open={open}
        onOpenChange={setOpen}
        title="Edit profile"
        description="This is how others see you."
        footer={
          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: t.space[2] }}>
            <Button variant="ghost" onPress={() => setOpen(false)}>Cancel</Button>
            <Button onPress={() => setOpen(false)}>Save</Button>
          </View>
        }
      >
        <View style={{ gap: t.space[3] }}>
          <Input label="Name" defaultValue="Maya Chen" />
          <Input label="Username" defaultValue="mayachen" autoCapitalize="none" icon="at-sign" />
        </View>
      </Dialog>
    </>
  );
}

function InfoDialogDemo() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="outline" icon="info" onPress={() => setOpen(true)}>What's new</Button>
      <Dialog
        open={open}
        onOpenChange={setOpen}
        title="Shared folders are here"
        description="Invite people to a folder and everything inside stays in sync for them. You can change access any time."
        footer={<Button block onPress={() => setOpen(false)}>Got it</Button>}
      />
    </>
  );
}

// Alert dialog

function DiscardAlertDemo() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="outline" onPress={() => setOpen(true)}>Close draft</Button>
      <AlertDialog
        open={open}
        onOpenChange={setOpen}
        title="Discard this draft?"
        description="Your changes to this message will be lost."
        actions={[{ label: 'Keep editing', style: 'cancel' }, { label: 'Discard', style: 'destructive' }]}
      />
    </>
  );
}

function DeleteAccountAlertDemo() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="destructive" onPress={() => setOpen(true)}>Delete account</Button>
      <AlertDialog
        open={open}
        onOpenChange={setOpen}
        title="Delete your account?"
        description="Your projects, files and billing history are removed for good. This can't be undone."
        actions={[
          { label: 'Delete account and data', style: 'destructive' },
          { label: 'Cancel', style: 'cancel' },
        ]}
      />
    </>
  );
}

function UnsavedAlertDemo() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="secondary" onPress={() => setOpen(true)}>Leave editor</Button>
      <AlertDialog
        open={open}
        onOpenChange={setOpen}
        title="Save changes to Invoice 112?"
        actions={[
          { label: 'Save', style: 'default' },
          { label: "Don't save", style: 'destructive' },
          { label: 'Cancel', style: 'cancel' },
        ]}
      />
    </>
  );
}

// Menu

const fileActions: MenuEntry[] = [
  { label: 'Edit', icon: 'edit', shortcut: '⌘E' },
  { label: 'Duplicate', icon: 'copy', shortcut: '⌘D' },
  { label: 'Share', icon: 'share' },
  { type: 'separator' },
  { label: 'Delete', icon: 'trash', destructive: true },
];

function ActionsMenuDemo() {
  const [open, setOpen] = useState(false);
  return (
    <Row>
      <Text style={{ flex: 1 }}>brand-guide.pdf</Text>
      <Menu open={open} onOpenChange={setOpen} items={fileActions} align="end">
        <IconButton icon="more-horizontal" accessibilityLabel="More actions" onPress={() => setOpen(true)} />
      </Menu>
    </Row>
  );
}

function SortMenuDemo() {
  const [open, setOpen] = useState(false);
  const [sort, setSort] = useState('Date modified');
  const [folders, setFolders] = useState(true);
  const items: MenuEntry[] = [
    { type: 'label', label: 'Sort by' },
    ...['Name', 'Date modified', 'Size'].map((s) => ({ label: s, checked: sort === s, onSelect: () => setSort(s) })),
    { type: 'separator' },
    { label: 'Folders first', checked: folders, onSelect: () => setFolders((v) => !v) },
  ];
  return (
    <Menu open={open} onOpenChange={setOpen} items={items}>
      <Button variant="outline" icon="sort-asc" onPress={() => setOpen(true)}>{sort}</Button>
    </Menu>
  );
}

function DisabledMenuDemo() {
  const [open, setOpen] = useState(false);
  return (
    <Menu
      open={open}
      onOpenChange={setOpen}
      items={[
        { label: 'Undo', icon: 'undo', shortcut: '⌘Z' },
        { label: 'Redo', icon: 'redo', shortcut: '⇧⌘Z', disabled: true },
        { type: 'separator' },
        { label: 'Paste', icon: 'copy', disabled: true },
      ]}
    >
      <Button variant="secondary" iconRight="chevron-down" onPress={() => setOpen(true)}>Edit</Button>
    </Menu>
  );
}

// Context menu

function MessageContextDemo() {
  const t = useSlate();
  return (
    <ContextMenu
      items={[
        { label: 'Reply', icon: 'message-square' },
        { label: 'Copy text', icon: 'copy' },
        { label: 'Pin', icon: 'pin' },
        { type: 'separator' },
        { label: 'Delete', icon: 'trash', destructive: true },
      ]}
    >
      <View style={{ padding: t.space[3], borderRadius: t.component.cardRadius, backgroundColor: t.c.surface, gap: t.space[1] }}>
        <Text weight="600">Priya Nair</Text>
        <Text tone="muted">Venue is confirmed for Friday. I'll send the floor plan tonight.</Text>
      </View>
    </ContextMenu>
  );
}

function FileTileContextDemo() {
  const t = useSlate();
  const tile = (name: string, icon: 'file-text' | 'image' | 'folder') => (
    <ContextMenu
      key={name}
      items={[
        { label: 'Open', icon: 'external' },
        { label: 'Rename', icon: 'edit' },
        { label: 'Move to…', icon: 'folder' },
        { type: 'separator' },
        { label: 'Delete', icon: 'trash', destructive: true },
      ]}
    >
      <View style={{ width: 96, padding: t.space[3], gap: t.space[2], alignItems: 'center', borderRadius: t.component.cardRadius, backgroundColor: t.c.surface }}>
        <Icon name={icon} size={24} color={t.c.textMuted} />
        <Text variant="footnote" numberOfLines={1}>{name}</Text>
      </View>
    </ContextMenu>
  );
  return <Row>{tile('Brief.pdf', 'file-text')}{tile('Cover.png', 'image')}{tile('Archive', 'folder')}</Row>;
}

// Tooltip

function IconTooltipsDemo() {
  return (
    <Row>
      <Tooltip content="Bold"><IconButton icon="bold" variant="outline" accessibilityLabel="Bold" /></Tooltip>
      <Tooltip content="Italic"><IconButton icon="italic" variant="outline" accessibilityLabel="Italic" /></Tooltip>
      <Tooltip content="Insert link"><IconButton icon="link" variant="outline" accessibilityLabel="Insert link" /></Tooltip>
      <Tooltip content="Attach a file up to 25 MB" side="bottom"><IconButton icon="paperclip" variant="outline" accessibilityLabel="Attach" /></Tooltip>
    </Row>
  );
}

function ControlledTooltipDemo() {
  const [open, setOpen] = useState(false);
  return (
    <Row>
      <Tooltip content="New: export to PDF" open={open} onOpenChange={setOpen} duration={0}>
        <IconButton icon="download" variant="soft" accessibilityLabel="Export" />
      </Tooltip>
      <Button variant="ghost" onPress={() => setOpen((v) => !v)}>{open ? 'Hide hint' : 'Show hint'}</Button>
    </Row>
  );
}

// Popover

function DeliveryPopoverDemo() {
  const t = useSlate();
  const [open, setOpen] = useState(false);
  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
      content={
        <>
          <Text weight="600">Standard delivery</Text>
          <Text variant="footnote" tone="muted">Ships from Rotterdam in 1–2 days. Tracking arrives by email once it leaves the warehouse.</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.space[2], marginTop: t.space[1] }}>
            <Icon name="truck" size={16} color={t.c.textSubtle} />
            <Text variant="footnote" tone="subtle">Free over $50</Text>
          </View>
        </>
      }
    >
      <Button variant="link" onPress={() => setOpen(true)}>Delivery details</Button>
    </Popover>
  );
}

function ShareLinkPopoverDemo() {
  const [open, setOpen] = useState(false);
  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
      align="end"
      width={288}
      content={
        <>
          <Text weight="600">Share link</Text>
          <Text variant="footnote" tone="muted">Anyone with the link can view.</Text>
          <Input value="slate.app/s/7Hq2" readOnly trailing={<IconButton icon="copy" size="sm" accessibilityLabel="Copy link" />} />
        </>
      }
    >
      <Button variant="outline" icon="share" onPress={() => setOpen(true)}>Share</Button>
    </Popover>
  );
}

// Select

function SingleSelectDemo() {
  const [plan, setPlan] = useState<string | null>(null);
  return (
    <Select
      label="Plan"
      placeholder="Choose a plan"
      value={plan}
      onValueChange={setPlan}
      options={[
        { value: 'free', label: 'Free', description: '1 project, 2 collaborators' },
        { value: 'pro', label: 'Pro', description: 'Unlimited projects, $12 per month' },
        { value: 'team', label: 'Team', description: 'Shared workspace, $24 per seat' },
      ]}
    />
  );
}

const zones = [
  'Honolulu', 'Anchorage', 'Los Angeles', 'Denver', 'Chicago', 'New York', 'Halifax', 'São Paulo', 'Reykjavík', 'London', 'Lisbon', 'Paris',
  'Berlin', 'Cairo', 'Istanbul', 'Moscow', 'Dubai', 'Karachi', 'Mumbai', 'Dhaka', 'Bangkok', 'Singapore', 'Tokyo', 'Sydney', 'Auckland',
].map((c) => ({ value: c, label: c }));

function SearchSelectDemo() {
  const [zone, setZone] = useState<string | null>('Lisbon');
  return <Select label="Time zone" value={zone} onValueChange={setZone} options={zones} />;
}

function MultiSelectDemo() {
  const [tags, setTags] = useState<string[]>(['design']);
  return (
    <Select
      multiple
      label="Teams"
      placeholder="Add teams"
      value={tags}
      onValueChange={setTags}
      options={[
        { value: 'design', label: 'Design', icon: 'palette' },
        { value: 'engineering', label: 'Engineering', icon: 'code' },
        { value: 'marketing', label: 'Marketing', icon: 'trending-up' },
        { value: 'support', label: 'Support', icon: 'help-circle' },
        { value: 'finance', label: 'Finance', icon: 'wallet', disabled: true },
      ]}
    />
  );
}

// Calendar

function SingleCalendarDemo() {
  const [date, setDate] = useState<Date | null>(today());
  return <Calendar value={date} onValueChange={setDate} />;
}

function RangeCalendarDemo() {
  const [range, setRange] = useState<DateRange>({ start: inDays(2), end: inDays(6) });
  return <Calendar mode="range" value={range} onValueChange={setRange} />;
}

function BookingCalendarDemo() {
  const [date, setDate] = useState<Date | null>(null);
  return <Calendar value={date} onValueChange={setDate} min={today()} max={inDays(60)} />;
}

// Date picker

function DueDateDemo() {
  const [due, setDue] = useState<Date | null>(null);
  return <DatePicker label="Due date" value={due} onValueChange={setDue} />;
}

function LimitedDateDemo() {
  const [day, setDay] = useState<Date | null>(inDays(3));
  return (
    <DatePicker label="Delivery day" value={day} onValueChange={setDay} min={inDays(1)} max={inDays(30)} clearable format={{ weekday: 'long', month: 'short', day: 'numeric' }} />
  );
}

export const pages: DemoPage[] = [
  {
    slug: 'sheet',
    name: 'Sheet',
    group: 'Overlays',
    description: 'A bottom sheet with detents. Drag it, fling it closed or tap outside; it rides up with the keyboard.',
    demos: [
      {
        title: 'Content height',
        render: () => <OrderSheetDemo />,
        code: `<Sheet
  open={open}
  onOpenChange={setOpen}
  title="Order #4821"
  description="Arrives Thursday, 14 November"
  footer={<Button block onPress={() => setOpen(false)}>Track package</Button>}
>
  {/* line items */}
</Sheet>`,
      },
      {
        title: 'Detents and a scrolling list',
        render: () => <ActivitySheetDemo />,
        code: `<Sheet open={open} onOpenChange={setOpen} detents={[0.5, 0.92]} title="Activity">
  <SheetScrollView>
    {activity.map((a) => <ActivityRow key={a.id} {...a} />)}
  </SheetScrollView>
</Sheet>`,
      },
      {
        title: 'Form with the keyboard',
        render: () => <RenameSheetDemo />,
        code: `<Sheet
  open={open}
  onOpenChange={setOpen}
  title="Rename project"
  description="Everyone on the project sees the new name."
  footer={<Button block disabled={!name.trim()} onPress={() => setOpen(false)}>Save</Button>}
>
  <Input label="Project name" value={name} onChangeText={setName} autoFocus clearable />
</Sheet>`,
      },
    ],
  },
  {
    slug: 'action-sheet',
    name: 'Action Sheet',
    group: 'Overlays',
    description: 'A short list of actions about one thing, with a separate Cancel.',
    demos: [
      {
        title: 'Actions with icons',
        render: () => <PhotoActionsDemo />,
        code: `<ActionSheet
  open={open}
  onOpenChange={setOpen}
  actions={[
    { label: 'Share', icon: 'share' },
    { label: 'Copy link', icon: 'link' },
    { label: 'Add to album', icon: 'folder' },
    { label: 'Delete photo', icon: 'trash', destructive: true },
  ]}
/>`,
      },
      {
        title: 'Title and message',
        render: () => <LeaveGroupDemo />,
        code: `<ActionSheet
  open={open}
  onOpenChange={setOpen}
  title="Weekend hikers"
  message="12 members. Notifications are on."
  actions={[
    { label: 'Mute for 8 hours', icon: 'bolt-off' },
    { label: 'Pin to top', icon: 'pin' },
    { label: 'Leave group', icon: 'log-out', destructive: true },
  ]}
/>`,
      },
    ],
  },
  {
    slug: 'dialog',
    name: 'Dialog',
    group: 'Overlays',
    description: 'A centred card for a short task. It springs in from 96% and closes on a tap outside.',
    demos: [
      {
        title: 'Form',
        render: () => <EditProfileDialogDemo />,
        code: `<Dialog
  open={open}
  onOpenChange={setOpen}
  title="Edit profile"
  description="This is how others see you."
  footer={
    <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8 }}>
      <Button variant="ghost" onPress={() => setOpen(false)}>Cancel</Button>
      <Button onPress={() => setOpen(false)}>Save</Button>
    </View>
  }
>
  <Input label="Name" defaultValue="Maya Chen" />
  <Input label="Username" defaultValue="mayachen" icon="at-sign" />
</Dialog>`,
      },
      {
        title: 'Announcement',
        render: () => <InfoDialogDemo />,
        code: `<Dialog
  open={open}
  onOpenChange={setOpen}
  title="Shared folders are here"
  description="Invite people to a folder and everything inside stays in sync for them."
  footer={<Button block onPress={() => setOpen(false)}>Got it</Button>}
/>`,
      },
    ],
  },
  {
    slug: 'alert-dialog',
    name: 'Alert Dialog',
    group: 'Overlays',
    description: 'A blocking confirmation that only an action can close. Long labels stack.',
    demos: [
      {
        title: 'Confirm',
        render: () => <DiscardAlertDemo />,
        code: `<AlertDialog
  open={open}
  onOpenChange={setOpen}
  title="Discard this draft?"
  description="Your changes to this message will be lost."
  actions={[{ label: 'Keep editing', style: 'cancel' }, { label: 'Discard', style: 'destructive' }]}
/>`,
      },
      {
        title: 'Long labels stack',
        render: () => <DeleteAccountAlertDemo />,
        code: `<AlertDialog
  open={open}
  onOpenChange={setOpen}
  title="Delete your account?"
  description="Your projects, files and billing history are removed for good. This can't be undone."
  actions={[
    { label: 'Delete account and data', style: 'destructive', onPress: deleteAccount },
    { label: 'Cancel', style: 'cancel' },
  ]}
/>`,
      },
      {
        title: 'Three actions',
        render: () => <UnsavedAlertDemo />,
        code: `<AlertDialog
  open={open}
  onOpenChange={setOpen}
  title="Save changes to Invoice 112?"
  actions={[
    { label: 'Save', onPress: save },
    { label: "Don't save", style: 'destructive', onPress: discard },
    { label: 'Cancel', style: 'cancel' },
  ]}
/>`,
      },
    ],
  },
  {
    slug: 'menu',
    name: 'Menu',
    group: 'Overlays',
    description: 'A dropdown anchored to its trigger. It flips above when there is no room below.',
    demos: [
      {
        title: 'Actions',
        render: () => <ActionsMenuDemo />,
        code: `<Menu
  open={open}
  onOpenChange={setOpen}
  align="end"
  items={[
    { label: 'Edit', icon: 'edit', shortcut: '⌘E' },
    { label: 'Duplicate', icon: 'copy', shortcut: '⌘D' },
    { label: 'Share', icon: 'share' },
    { type: 'separator' },
    { label: 'Delete', icon: 'trash', destructive: true },
  ]}
>
  <IconButton icon="more-horizontal" accessibilityLabel="More actions" onPress={() => setOpen(true)} />
</Menu>`,
      },
      {
        title: 'Checks and a group label',
        render: () => <SortMenuDemo />,
        code: `<Menu
  open={open}
  onOpenChange={setOpen}
  items={[
    { type: 'label', label: 'Sort by' },
    { label: 'Name', checked: sort === 'Name', onSelect: () => setSort('Name') },
    { label: 'Date modified', checked: sort === 'Date modified', onSelect: () => setSort('Date modified') },
    { label: 'Size', checked: sort === 'Size', onSelect: () => setSort('Size') },
    { type: 'separator' },
    { label: 'Folders first', checked: folders, onSelect: () => setFolders((v) => !v) },
  ]}
>
  <Button variant="outline" icon="sort-asc" onPress={() => setOpen(true)}>{sort}</Button>
</Menu>`,
      },
      {
        title: 'Disabled items',
        render: () => <DisabledMenuDemo />,
        code: `<Menu
  open={open}
  onOpenChange={setOpen}
  items={[
    { label: 'Undo', icon: 'undo', shortcut: '⌘Z' },
    { label: 'Redo', icon: 'redo', shortcut: '⇧⌘Z', disabled: true },
    { type: 'separator' },
    { label: 'Paste', icon: 'copy', disabled: true },
  ]}
>
  <Button variant="secondary" iconRight="chevron-down" onPress={() => setOpen(true)}>Edit</Button>
</Menu>`,
      },
    ],
  },
  {
    slug: 'context-menu',
    name: 'Context Menu',
    group: 'Overlays',
    description: 'Long-press to lift an item, dim the screen and show its actions alongside.',
    demos: [
      {
        title: 'Long-press a message',
        render: () => <MessageContextDemo />,
        code: `<ContextMenu
  items={[
    { label: 'Reply', icon: 'message-square', onSelect: reply },
    { label: 'Copy text', icon: 'copy', onSelect: copy },
    { label: 'Pin', icon: 'pin', onSelect: pin },
    { type: 'separator' },
    { label: 'Delete', icon: 'trash', destructive: true, onSelect: remove },
  ]}
>
  <MessageBubble author="Priya Nair" text="Venue is confirmed for Friday." />
</ContextMenu>`,
      },
      {
        title: 'Tiles in a grid',
        render: () => <FileTileContextDemo />,
        code: `<ContextMenu
  items={[
    { label: 'Open', icon: 'external' },
    { label: 'Rename', icon: 'edit' },
    { label: 'Move to…', icon: 'folder' },
    { type: 'separator' },
    { label: 'Delete', icon: 'trash', destructive: true },
  ]}
>
  <FileTile name="Brief.pdf" icon="file-text" />
</ContextMenu>`,
      },
    ],
  },
  {
    slug: 'tooltip',
    name: 'Tooltip',
    group: 'Overlays',
    description: 'A small label for icon-only controls. Long-press to show it; it hides itself.',
    demos: [
      {
        title: 'Long-press the icons',
        render: () => <IconTooltipsDemo />,
        code: `<Tooltip content="Bold">
  <IconButton icon="bold" variant="outline" accessibilityLabel="Bold" />
</Tooltip>
<Tooltip content="Attach a file up to 25 MB" side="bottom">
  <IconButton icon="paperclip" variant="outline" accessibilityLabel="Attach" />
</Tooltip>`,
      },
      {
        title: 'Controlled',
        render: () => <ControlledTooltipDemo />,
        code: `<Tooltip content="New: export to PDF" open={open} onOpenChange={setOpen} duration={0}>
  <IconButton icon="download" variant="soft" accessibilityLabel="Export" />
</Tooltip>`,
      },
    ],
  },
  {
    slug: 'popover',
    name: 'Popover',
    group: 'Overlays',
    description: 'A small card anchored to its trigger, for detail or a quick edit in place.',
    demos: [
      {
        title: 'Details',
        render: () => <DeliveryPopoverDemo />,
        code: `<Popover
  open={open}
  onOpenChange={setOpen}
  content={
    <>
      <Text weight="600">Standard delivery</Text>
      <Text variant="footnote" tone="muted">Ships from Rotterdam in 1–2 days.</Text>
    </>
  }
>
  <Button variant="link" onPress={() => setOpen(true)}>Delivery details</Button>
</Popover>`,
      },
      {
        title: 'Share link',
        render: () => <ShareLinkPopoverDemo />,
        code: `<Popover
  open={open}
  onOpenChange={setOpen}
  align="end"
  width={288}
  content={
    <>
      <Text weight="600">Share link</Text>
      <Text variant="footnote" tone="muted">Anyone with the link can view.</Text>
      <Input value="slate.app/s/7Hq2" readOnly trailing={<IconButton icon="copy" size="sm" accessibilityLabel="Copy link" />} />
    </>
  }
>
  <Button variant="outline" icon="share" onPress={() => setOpen(true)}>Share</Button>
</Popover>`,
      },
    ],
  },
  {
    slug: 'select',
    name: 'Select',
    group: 'Overlays',
    description: 'A field that opens a sheet of options, with search when the list is long.',
    demos: [
      {
        title: 'Single',
        render: () => <SingleSelectDemo />,
        code: `<Select
  label="Plan"
  placeholder="Choose a plan"
  value={plan}
  onValueChange={setPlan}
  options={[
    { value: 'free', label: 'Free', description: '1 project, 2 collaborators' },
    { value: 'pro', label: 'Pro', description: 'Unlimited projects, $12 per month' },
    { value: 'team', label: 'Team', description: 'Shared workspace, $24 per seat' },
  ]}
/>`,
      },
      {
        title: 'Searchable',
        render: () => <SearchSelectDemo />,
        code: `<Select label="Time zone" value={zone} onValueChange={setZone} options={zones} />`,
      },
      {
        title: 'Multiple',
        render: () => <MultiSelectDemo />,
        code: `<Select
  multiple
  label="Teams"
  placeholder="Add teams"
  value={teams}
  onValueChange={setTeams}
  options={[
    { value: 'design', label: 'Design', icon: 'palette' },
    { value: 'engineering', label: 'Engineering', icon: 'code' },
    { value: 'marketing', label: 'Marketing', icon: 'trending-up' },
    { value: 'support', label: 'Support', icon: 'help-circle' },
    { value: 'finance', label: 'Finance', icon: 'wallet', disabled: true },
  ]}
/>`,
      },
    ],
  },
  {
    slug: 'calendar',
    name: 'Calendar',
    group: 'Overlays',
    description: 'A month grid in the device locale. Swipe sideways to change month.',
    demos: [
      {
        title: 'Single date',
        render: () => <SingleCalendarDemo />,
        code: `<Calendar value={date} onValueChange={setDate} />`,
      },
      {
        title: 'Range',
        render: () => <RangeCalendarDemo />,
        code: `<Calendar mode="range" value={range} onValueChange={setRange} />`,
      },
      {
        title: 'Booking window',
        render: () => <BookingCalendarDemo />,
        code: `<Calendar value={date} onValueChange={setDate} min={today} max={inSixtyDays} />`,
      },
    ],
  },
  {
    slug: 'date-picker',
    name: 'Date Picker',
    group: 'Overlays',
    description: 'A date field that opens a calendar sheet with quick picks.',
    demos: [
      {
        title: 'Due date',
        render: () => <DueDateDemo />,
        code: `<DatePicker label="Due date" value={due} onValueChange={setDue} />`,
      },
      {
        title: 'Limits, format and clear',
        render: () => <LimitedDateDemo />,
        code: `<DatePicker
  label="Delivery day"
  value={day}
  onValueChange={setDay}
  min={tomorrow}
  max={inThirtyDays}
  clearable
  format={{ weekday: 'long', month: 'short', day: 'numeric' }}
/>`,
      },
    ],
  },
];
