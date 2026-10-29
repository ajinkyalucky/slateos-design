import { useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut, LayoutAnimationConfig, LinearTransition } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Badge, Button, Checkbox, DatePicker, EmptyState, Field, Icon, Input, SegmentedControl, Select, Sheet, SwipeableRow, Tabs,
  Text, Textarea, Toaster, Touchable, toast, useSlate, type BadgeTone, type IconName,
} from '@ajinkyabhagwat/slateos-native';

export type TaskPriority = 'high' | 'medium' | 'low';

export type Task = { id: string; title: string; notes?: string; due: Date | null; priority: TaskPriority; project: string; done?: boolean };

/** What the New task sheet hands to `onCreate`. */
export type NewTask = Omit<Task, 'id' | 'done'>;

export type TasksScreenProps = {
  tasks?: Task[];
  projects?: string[];
  onCreate?: (task: NewTask) => void;
  onOpenTask?: (id: string) => void;
  onToggle?: (id: string, done: boolean) => void;
  onDelete?: (id: string) => void;
  onSnooze?: (id: string, due: Date) => void;
};

type Tab = 'today' | 'upcoming' | 'done';

const DAY = 86_400_000;
const startOfDay = (d: Date) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
const inDays = (n: number) => { const d = startOfDay(new Date()); d.setDate(d.getDate() + n); return d; };
const daysFromToday = (d: Date) => Math.round((startOfDay(d).getTime() - startOfDay(new Date()).getTime()) / DAY);

function dueLabel(d: Date) {
  const n = daysFromToday(d);
  if (n === 0) return 'Today';
  if (n === 1) return 'Tomorrow';
  if (n === -1) return 'Yesterday';
  if (n > 1 && n < 7) return d.toLocaleDateString('en-US', { weekday: 'long' });
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const DEFAULT_PROJECTS = ['Work', 'Home', 'Family', 'Errands'];

// Sample tasks, dated relative to today: replace with your own data.
const DEFAULT_TASKS: Task[] = [
  { id: '1', title: 'Send the Q4 budget to Priya', due: inDays(-1), priority: 'high', project: 'Work', notes: 'Use the version with the revised travel line.' },
  { id: '2', title: 'Review Jordan’s pricing page changes', due: inDays(0), priority: 'high', project: 'Work' },
  { id: '3', title: 'Book a dentist appointment for Leo', due: inDays(0), priority: 'medium', project: 'Family' },
  { id: '4', title: 'Pick up the dry cleaning', due: inDays(0), priority: 'low', project: 'Errands' },
  { id: '5', title: 'Renew the car registration', due: inDays(2), priority: 'medium', project: 'Errands' },
  { id: '6', title: 'Draft the onboarding email series', due: inDays(4), priority: 'medium', project: 'Work' },
  { id: '7', title: 'Plan Sam’s birthday dinner', due: inDays(9), priority: 'low', project: 'Family' },
  { id: '8', title: 'Fix the squeaky bedroom door', due: null, priority: 'low', project: 'Home' },
  { id: '9', title: 'Pay the electricity bill', due: inDays(-2), priority: 'medium', project: 'Home', done: true },
  { id: '10', title: 'Call the landlord about the heater', due: inDays(-1), priority: 'high', project: 'Home', done: true },
];

const PRIORITIES = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
] as const;

const tabOf = (task: Task): Tab => (task.done ? 'done' : task.due && daysFromToday(task.due) <= 0 ? 'today' : 'upcoming');
const byDue = (a: Task, b: Task) => (a.due?.getTime() ?? Infinity) - (b.due?.getTime() ?? Infinity);

/** A to-do home: Today, Upcoming and Done with counts, check to complete with Undo, swipe to snooze or delete, and a New task sheet. */
export function TasksScreen({
  tasks = DEFAULT_TASKS,
  projects = DEFAULT_PROJECTS,
  onCreate,
  onOpenTask,
  onToggle,
  onDelete,
  onSnooze,
}: TasksScreenProps) {
  const t = useSlate();
  const insets = useSafeAreaInsets();
  const [list, setList] = useState(tasks);
  const [tab, setTab] = useState<Tab>('today');
  // Ticked rows stay put for a beat, so the check draws before the row leaves.
  const [ticking, setTicking] = useState<string[]>([]);
  const [composing, setComposing] = useState(false);
  const seq = useRef(0);

  const patch = (id: string, p: Partial<Task>) => setList((l) => l.map((x) => (x.id === id ? { ...x, ...p } : x)));

  const toggle = (task: Task, done: boolean) => {
    onToggle?.(task.id, done);
    if (!done) { patch(task.id, { done: false }); return; }
    setTicking((s) => [...s, task.id]);
    setTimeout(() => {
      setTicking((s) => s.filter((x) => x !== task.id));
      patch(task.id, { done: true });
      toast.success('Task completed', {
        id: `task-${task.id}`,
        description: task.title,
        action: { label: 'Undo', onPress: () => { patch(task.id, { done: false }); onToggle?.(task.id, false); } },
      });
    }, t.motion.duration.slow * 1.5);
  };

  const remove = (task: Task) => {
    const at = list.findIndex((x) => x.id === task.id);
    setList((l) => l.filter((x) => x.id !== task.id));
    onDelete?.(task.id);
    toast('Task deleted', {
      id: `task-${task.id}`,
      description: task.title,
      icon: 'trash',
      action: { label: 'Undo', onPress: () => setList((l) => [...l.slice(0, at), task, ...l.slice(at)]) },
    });
  };

  const snooze = (task: Task) => {
    const before = task.due;
    const next = inDays(Math.max(1, (task.due ? daysFromToday(task.due) : 0) + 1));
    patch(task.id, { due: next });
    onSnooze?.(task.id, next);
    toast('Snoozed', {
      id: `task-${task.id}`,
      description: `${task.title} · ${dueLabel(next)}`,
      icon: 'clock',
      action: { label: 'Undo', onPress: () => patch(task.id, { due: before }) },
    });
  };

  const create = (task: NewTask) => {
    seq.current += 1;
    const made: Task = { ...task, id: `new-${seq.current}` };
    setList((l) => [made, ...l]);
    setTab(tabOf(made));
    onCreate?.(task);
    toast.success('Task added', { description: task.due ? `Due ${dueLabel(task.due).toLowerCase()}` : 'No due date' });
  };

  const counts = useMemo(() => {
    const c = { today: 0, upcoming: 0, done: 0 };
    list.forEach((x) => { c[tabOf(x)] += 1; });
    return c;
  }, [list]);

  const groups = useMemo(() => {
    const shown = list.filter((x) => tabOf(x) === tab);
    if (tab === 'done') return [{ title: 'Completed', items: shown }];
    const sorted = [...shown].sort(byDue);
    if (tab === 'today') {
      return [
        { title: 'Overdue', items: sorted.filter((x) => x.due && daysFromToday(x.due) < 0) },
        { title: 'Today', items: sorted.filter((x) => x.due && daysFromToday(x.due) === 0) },
      ].filter((g) => g.items.length > 0);
    }
    const out: { title: string; items: Task[] }[] = [];
    sorted.forEach((x) => {
      const title = x.due ? dueLabel(x.due) : 'No date';
      const g = out.find((o) => o.title === title);
      if (g) g.items.push(x);
      else out.push({ title, items: [x] });
    });
    return out;
  }, [list, tab]);

  const move = LinearTransition.springify().duration(t.spring.standard.duration).dampingRatio(t.spring.standard.dampingRatio);
  const fabSpace = t.control.lg + t.space[4];
  const empty = {
    today: { icon: 'check-circle' as IconName, title: 'All clear for today', description: 'Nothing is due. Enjoy it, or pull something forward from Upcoming.' },
    upcoming: { icon: 'calendar' as IconName, title: 'Nothing scheduled', description: 'Tasks with a future date, or none at all, wait here.' },
    done: { icon: 'check' as IconName, title: 'Nothing finished yet', description: 'Tick off a task and it lands here.' },
  }[tab];

  return (
    <View style={{ flex: 1, backgroundColor: t.c.bg, paddingTop: insets.top }}>
      <View style={{ paddingHorizontal: t.component.screenPadding, paddingTop: t.space[2], gap: t.space[3] }}>
        <View style={{ gap: t.space[1] }}>
          <Text variant="footnote" tone="muted">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</Text>
          <Text variant="title1" accessibilityRole="header">Tasks</Text>
        </View>
        <Tabs
          value={tab}
          onValueChange={setTab}
          items={[
            { value: 'today', label: 'Today', badge: counts.today || undefined },
            { value: 'upcoming', label: 'Upcoming', badge: counts.upcoming || undefined },
            { value: 'done', label: 'Done', badge: counts.done || undefined },
          ]}
        />
      </View>

      {groups.length === 0 ? (
        <EmptyState
          icon={empty.icon}
          title={empty.title}
          description={empty.description}
          actions={tab !== 'done' ? <Button variant="outline" icon="plus" onPress={() => setComposing(true)}>New task</Button> : undefined}
          style={{ flex: 1, paddingBottom: fabSpace }}
        />
      ) : (
        <ScrollView contentContainerStyle={{ paddingTop: t.space[2], paddingBottom: insets.bottom + fabSpace + t.space[6] }}>
          {/* Keyed by tab: switching tabs swaps the list without animating every row; completions and undos still animate. */}
          <LayoutAnimationConfig key={tab} skipEntering skipExiting>
            {groups.map((g) => (
              <Animated.View key={g.title} layout={move} exiting={FadeOut.duration(t.motion.duration.fast)}>
                <Text
                  variant="overline"
                  tone={g.title === 'Overdue' ? 'danger' : 'subtle'}
                  accessibilityRole="header"
                  style={{ paddingHorizontal: t.component.screenPadding, paddingTop: t.space[4], paddingBottom: t.space[1] }}
                >
                  {g.title}
                </Text>
                {g.items.map((task, i) => (
                  <Animated.View
                    key={task.id}
                    layout={move}
                    entering={FadeIn.duration(t.motion.duration.base)}
                    exiting={FadeOut.duration(t.motion.duration.base)}
                  >
                    <TaskRow
                      task={task}
                      checked={!!task.done || ticking.includes(task.id)}
                      last={i === g.items.length - 1}
                      onToggle={(done) => toggle(task, done)}
                      onOpen={() => onOpenTask?.(task.id)}
                      onSnooze={task.done ? undefined : () => snooze(task)}
                      onDelete={() => remove(task)}
                    />
                  </Animated.View>
                ))}
              </Animated.View>
            ))}
          </LayoutAnimationConfig>
        </ScrollView>
      )}

      <Button
        icon="plus"
        size="lg"
        onPress={() => setComposing(true)}
        style={{ position: 'absolute', right: t.component.screenPadding, bottom: insets.bottom + t.space[4], borderRadius: t.radius.full, boxShadow: t.c.shadowLg }}
      >
        New task
      </Button>

      <NewTaskSheet open={composing} onOpenChange={setComposing} projects={projects} defaultDue={tab === 'upcoming' ? inDays(1) : inDays(0)} onCreate={create} />
      <Toaster position="bottom" offset={fabSpace} />
    </View>
  );
}

type TaskRowProps = {
  task: Task;
  checked: boolean;
  last: boolean;
  onToggle: (done: boolean) => void;
  onOpen: () => void;
  onSnooze?: () => void;
  onDelete: () => void;
};

function TaskRow({ task, checked, last, onToggle, onOpen, onSnooze, onDelete }: TaskRowProps) {
  const t = useSlate();
  const days = task.due ? daysFromToday(task.due) : null;
  const overdue = !task.done && days !== null && days < 0;
  const dueTone: BadgeTone = overdue ? 'danger' : days === 0 && !task.done ? 'accent' : 'neutral';
  const dot = { high: t.c.dangerSolid, medium: t.c.warningSolid, low: t.c.borderStrong }[task.priority];
  const due = task.due ? (overdue ? `Overdue · ${dueLabel(task.due)}` : dueLabel(task.due)) : null;

  return (
    <SwipeableRow
      leftActions={onSnooze ? [{ label: 'Tomorrow', icon: 'clock', tone: 'warning', onPress: onSnooze }] : []}
      rightActions={[{ label: 'Delete', icon: 'trash', tone: 'danger', onPress: onDelete }]}
    >
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', backgroundColor: t.c.bg, paddingLeft: t.component.screenPadding - t.space[3] }}>
        <Checkbox checked={checked} onValueChange={onToggle} accessibilityLabel={`Complete ${task.title}`} />
        <Touchable
          onPress={onOpen}
          pressScale={1}
          pressedStyle={{ backgroundColor: t.c.surfaceHover }}
          accessibilityRole="button"
          accessibilityLabel={[task.title, due, `${task.priority} priority`, task.project].filter(Boolean).join('. ')}
          style={{ flex: 1 }}
        >
          <View style={{ flexDirection: 'row', gap: t.space[3], paddingVertical: t.space['2_5'], paddingRight: t.component.screenPadding }}>
            <View style={{ flex: 1, gap: t.space['1_5'] }}>
              <Text
                numberOfLines={2}
                tone={checked ? 'subtle' : 'default'}
                style={checked ? { textDecorationLine: 'line-through' } : undefined}
              >
                {task.title}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: t.space[2] }}>
                {due && <Badge size="sm" tone={dueTone} icon={overdue ? 'alert-circle' : 'calendar'}>{due}</Badge>}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.space[1] }}>
                  <Icon name="hash" size={16} color={t.c.textSubtle} />
                  <Text variant="footnote" tone="muted">{task.project}</Text>
                </View>
              </View>
            </View>
            <View style={{ height: t.type.body.lineHeight, justifyContent: 'center' }}>
              <View style={{ width: t.space[2], height: t.space[2], borderRadius: t.radius.full, backgroundColor: dot }} />
            </View>
          </View>
        </Touchable>
      </View>
      {!last && <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: t.c.border, marginLeft: t.component.screenPadding - t.space[3] + t.size.touch }} />}
    </SwipeableRow>
  );
}

type NewTaskSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projects: string[];
  defaultDue: Date;
  onCreate: (task: NewTask) => void;
};

function NewTaskSheet({ open, onOpenChange, projects, defaultDue, onCreate }: NewTaskSheetProps) {
  const t = useSlate();
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [due, setDue] = useState<Date | null>(defaultDue);
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [project, setProject] = useState<string | null>(projects[0] ?? null);
  const [tried, setTried] = useState(false);

  const reset = () => {
    setTitle(''); setNotes(''); setDue(defaultDue); setPriority('medium'); setProject(projects[0] ?? null); setTried(false);
  };
  const change = (next: boolean) => {
    if (next) reset();
    onOpenChange(next);
  };
  const add = () => {
    setTried(true);
    if (!title.trim()) { t.haptic('error'); return; }
    onCreate({ title: title.trim(), notes: notes.trim() || undefined, due, priority, project: project ?? projects[0] ?? 'Inbox' });
    onOpenChange(false);
  };

  return (
    <Sheet
      open={open}
      onOpenChange={change}
      title="New task"
      footer={<Button block size="lg" onPress={add}>Add task</Button>}
    >
      <View style={{ gap: t.space[4], paddingBottom: t.space[2] }}>
        <Input
          label="Title"
          placeholder="e.g. Call the plumber"
          value={title}
          onChangeText={setTitle}
          autoFocus
          returnKeyType="done"
          onSubmitEditing={add}
          error={tried && !title.trim() ? 'Give the task a title.' : undefined}
        />
        <Textarea label="Notes" optional placeholder="Links, details, anything to remember" value={notes} onChangeText={setNotes} minRows={2} maxRows={5} />
        <DatePicker label="Due" value={due} onValueChange={setDue} clearable placeholder="No due date" />
        <Field label="Priority">
          <SegmentedControl options={PRIORITIES} value={priority} onValueChange={setPriority} />
        </Field>
        <Select label="Project" value={project} onValueChange={setProject} options={projects.map((p) => ({ value: p, label: p, icon: 'hash' as IconName }))} />
      </View>
    </Sheet>
  );
}
