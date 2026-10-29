import { useRef, useState } from 'react';
import { ScrollView, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  AlertDialog, Badge, Button, Checkbox, DatePicker, Header, IconButton, Input, ListRow, ListSection, Progress, Select, Text,
  Textarea, Timeline, useSlate, type TimelineItem,
} from '@ajinkyabhagwat/slateos-native';

export type Subtask = { id: string; title: string; done: boolean };

export type TaskDetail = {
  title: string;
  done: boolean;
  project: string;
  priority: 'high' | 'medium' | 'low';
  due: Date | null;
  reminder: boolean;
  notes: string;
  subtasks: Subtask[];
};

export type TaskDetailScreenProps = {
  task?: TaskDetail;
  /** Called after every edit with the whole task. */
  onChange?: (task: TaskDetail) => void;
  onBack?: () => void;
  /** Called once the delete is confirmed. */
  onDelete?: () => void;
};

const inDays = (n: number) => { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + n); return d; };

// A sample task, dated relative to today: replace with your own data.
const DEFAULT_TASK: TaskDetail = {
  title: 'Draft the onboarding email series',
  done: false,
  project: 'Work',
  priority: 'medium',
  due: inDays(4),
  reminder: true,
  notes: 'Three emails over the first week: welcome, first project, invite your team. Keep each under 120 words and end with one button.',
  subtasks: [
    { id: 's1', title: 'Outline the three emails', done: true },
    { id: 's2', title: 'Write the welcome email', done: true },
    { id: 's3', title: 'Write “Start your first project”', done: false },
    { id: 's4', title: 'Ask Kenji to review the copy', done: false },
  ],
};

const REMIND_OPTIONS = [
  { value: 'morning', label: '9:00 AM on the day' },
  { value: 'day-before', label: '6:00 PM the day before' },
  { value: 'hour', label: 'An hour before the end of the day' },
];

const PRIORITY_TONE = { high: 'danger', medium: 'warning', low: 'neutral' } as const;
const PRIORITY_LABEL = { high: 'High priority', medium: 'Medium priority', low: 'Low priority' } as const;

/** One task: an editable title, complete, subtasks, due date and reminder, notes, activity, and delete with a confirm. */
export function TaskDetailScreen({ task: initial = DEFAULT_TASK, onChange, onBack, onDelete }: TaskDetailScreenProps) {
  const t = useSlate();
  const insets = useSafeAreaInsets();
  const [task, setTask] = useState(initial);
  const [draft, setDraft] = useState('');
  const [remindAt, setRemindAt] = useState<string | null>('morning');
  const [confirm, setConfirm] = useState(false);
  const [activity, setActivity] = useState<TimelineItem[]>([
    { icon: 'check', title: 'Completed “Write the welcome email”', time: '2h ago' },
    { icon: 'calendar', title: 'Moved the due date', description: 'From Monday', time: 'Yesterday' },
    { icon: 'edit', title: 'Added notes', time: 'Oct 24' },
    { icon: 'plus', title: 'Created in Work', time: 'Oct 22' },
  ]);
  const seq = useRef(0);

  const update = (patch: Partial<TaskDetail>, log?: Omit<TimelineItem, 'time'>) => {
    const next = { ...task, ...patch };
    setTask(next);
    onChange?.(next);
    if (log) setActivity((a) => [{ ...log, time: 'Just now', status: 'current' }, ...a.map((x) => ({ ...x, status: undefined }))]);
  };

  const setSubtask = (id: string, done: boolean) => {
    const s = task.subtasks.find((x) => x.id === id);
    update(
      { subtasks: task.subtasks.map((x) => (x.id === id ? { ...x, done } : x)) },
      done && s ? { icon: 'check', title: `Completed “${s.title}”` } : undefined,
    );
  };
  const addSubtask = () => {
    const title = draft.trim();
    if (!title) return;
    seq.current += 1;
    update({ subtasks: [...task.subtasks, { id: `new-${seq.current}`, title, done: false }] }, { icon: 'plus', title: `Added “${title}”` });
    setDraft('');
  };

  const done = task.subtasks.filter((s) => s.done).length;
  const dueText = task.due?.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  const remindText = REMIND_OPTIONS.find((o) => o.value === remindAt)?.label ?? '';

  return (
    <View style={{ flex: 1, backgroundColor: t.c.bg }}>
      <Header
        title={task.project}
        leading={<IconButton icon="chevron-left" accessibilityLabel="Back" onPress={onBack} />}
        trailing={<IconButton icon="trash" accessibilityLabel="Delete task" onPress={() => setConfirm(true)} />}
      />
      <ScrollView
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        contentContainerStyle={{ paddingHorizontal: t.component.screenPadding, paddingTop: t.space[2], paddingBottom: insets.bottom + t.space[10], gap: t.space[6] }}
      >
        <View style={{ gap: t.space[3] }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginLeft: -t.space[3] }}>
            <Checkbox
              checked={task.done}
              onValueChange={(v) => update({ done: v }, v ? { icon: 'check-circle', title: 'Completed this task' } : { icon: 'undo', title: 'Reopened this task' })}
              accessibilityLabel={task.done ? 'Completed. Mark as not done' : 'Mark complete'}
            />
            {/* A borderless title you edit in place; styled from the theme's title2. */}
            <TextInput
              value={task.title}
              onChangeText={(title) => update({ title })}
              onBlur={() => { if (!task.title.trim()) update({ title: initial.title }); }}
              multiline
              submitBehavior="blurAndSubmit"
              returnKeyType="done"
              placeholder="Task title"
              placeholderTextColor={t.c.textSubtle}
              selectionColor={t.c.accent}
              cursorColor={t.c.accent}
              maxFontSizeMultiplier={2}
              accessibilityLabel="Task title"
              style={{
                flex: 1,
                paddingTop: (t.size.touch - t.type.title2.lineHeight) / 2,
                paddingBottom: 0,
                fontSize: t.type.title2.fontSize,
                lineHeight: t.type.title2.lineHeight,
                letterSpacing: t.type.title2.letterSpacing,
                fontFamily: t.type.title2.fontFamily,
                fontWeight: t.type.title2.fontWeight,
                color: task.done ? t.c.textSubtle : t.c.text,
                textDecorationLine: task.done ? 'line-through' : 'none',
              }}
            />
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: t.space[2] }}>
            {task.done && <Badge tone="success" icon="check">Completed</Badge>}
            <Badge tone="neutral" icon="hash">{task.project}</Badge>
            <Badge tone={PRIORITY_TONE[task.priority]} dot>{PRIORITY_LABEL[task.priority]}</Badge>
          </View>
        </View>

        <View style={{ gap: t.space[2] }}>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <Text variant="headline" accessibilityRole="header">Subtasks</Text>
            <Text variant="footnote" tone="muted" tabular>{done} of {task.subtasks.length}</Text>
          </View>
          <Progress value={done} max={Math.max(1, task.subtasks.length)} size="sm" tone={done === task.subtasks.length && done > 0 ? 'success' : undefined} accessibilityLabel={`${done} of ${task.subtasks.length} subtasks done`} />
          <View>
            {task.subtasks.map((s) => (
              <Checkbox key={s.id} checked={s.done} onValueChange={(v) => setSubtask(s.id, v)} label={s.title} />
            ))}
          </View>
          <Input
            icon="plus"
            placeholder="Add a subtask"
            value={draft}
            onChangeText={setDraft}
            returnKeyType="done"
            submitBehavior="submit"
            onSubmitEditing={addSubtask}
            trailing={draft.trim() ? <Button size="sm" variant="ghost" onPress={addSubtask}>Add</Button> : undefined}
          />
        </View>

        <View style={{ gap: t.space[3] }}>
          <Text variant="headline" accessibilityRole="header">Schedule</Text>
          <DatePicker label="Due" value={task.due} onValueChange={(due) => update({ due }, { icon: 'calendar', title: due ? 'Changed the due date' : 'Removed the due date' })} clearable placeholder="No due date" />
          <ListSection footer={task.reminder && task.due ? `We’ll nudge you ${remindText.charAt(0).toLowerCase()}${remindText.slice(1)} (${dueText}).` : undefined}>
            <ListRow
              icon="bell"
              iconTint={t.c.dangerSolid}
              title="Remind me"
              subtitle={task.due ? undefined : 'Set a due date first'}
              accessory="switch"
              checked={task.reminder && !!task.due}
              onCheckedChange={(reminder) => update({ reminder })}
              disabled={!task.due}
            />
          </ListSection>
          {task.reminder && task.due && <Select label="When" value={remindAt} onValueChange={setRemindAt} options={REMIND_OPTIONS} />}
        </View>

        <Textarea label="Notes" placeholder="Links, details, anything to remember" value={task.notes} onChangeText={(notes) => update({ notes })} minRows={3} />

        <View style={{ gap: t.space[3] }}>
          <Text variant="headline" accessibilityRole="header">Activity</Text>
          <Timeline items={activity} />
        </View>

        <Button variant="outline" icon="trash" block onPress={() => setConfirm(true)}>Delete task</Button>
      </ScrollView>

      <AlertDialog
        open={confirm}
        onOpenChange={setConfirm}
        title="Delete this task?"
        description={`“${task.title.trim() || 'Untitled'}”${task.subtasks.length ? ` and its ${task.subtasks.length} subtasks` : ''} will be deleted. This can’t be undone.`}
        actions={[
          { label: 'Delete', style: 'destructive', onPress: onDelete },
          { label: 'Cancel', style: 'cancel' },
        ]}
      />
    </View>
  );
}
