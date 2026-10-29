import { useState, type ReactNode } from 'react';
import { View } from 'react-native';
import {
  Checkbox, ChipInput, Field, Input, OTPInput, Radio, RadioGroup, SearchField, SegmentedControl, Slider, Stepper, Switch,
  Text, Textarea, ToggleGroup,
} from '@ajinkyabhagwat/slateos-native';
import type { DemoPage } from './types';

const Stack = ({ children, gap = 16 }: { children: ReactNode; gap?: number }) => <View style={{ gap }}>{children}</View>;

// Field

function FieldHint() {
  const [speed, setSpeed] = useState('Standard');
  return (
    <Field label="Delivery" hint="Express arrives tomorrow if you order before 2 pm.">
      <SegmentedControl options={['Standard', 'Express']} value={speed} onValueChange={setSpeed} />
    </Field>
  );
}

function FieldStates() {
  const [guests, setGuests] = useState(10);
  const [budget, setBudget] = useState(40);
  return (
    <Stack gap={24}>
      <Field label="Party size" required error={guests > 8 ? 'Tables seat up to 8. Call us for larger groups.' : undefined}>
        <Stepper value={guests} onValueChange={setGuests} min={1} max={12} accessibilityLabel="Party size" />
      </Field>
      <Field label="Budget per person" optional hint="Helps us suggest a menu.">
        <Slider value={budget} onValueChange={setBudget} min={20} max={120} step={10} showValue formatValue={(v) => `$${v}`} accessibilityLabel="Budget per person" />
      </Field>
    </Stack>
  );
}

// Input

function InputIcons() {
  const [query, setQuery] = useState('Lisbon');
  const [amount, setAmount] = useState('');
  return (
    <Stack>
      <Input icon="map-pin" placeholder="City or airport" value={query} onChangeText={setQuery} clearable />
      <Input
        label="Amount"
        icon="dollar"
        placeholder="0.00"
        keyboardType="decimal-pad"
        value={amount}
        onChangeText={setAmount}
        trailing={<Text tone="subtle">USD</Text>}
      />
    </Stack>
  );
}

function InputSecure() {
  const [password, setPassword] = useState('');
  const short = password.length > 0 && password.length < 8;
  return (
    <Input
      label="Password"
      secure
      placeholder="At least 8 characters"
      textContentType="newPassword"
      value={password}
      onChangeText={setPassword}
      hint="Use 8 or more characters."
      error={short ? 'Too short. Add a few more characters.' : undefined}
    />
  );
}

// Textarea

function TextareaCount() {
  const [bio, setBio] = useState('');
  return (
    <Textarea
      label="Bio"
      placeholder="A line or two about you"
      value={bio}
      onChangeText={setBio}
      maxLength={160}
      minRows={2}
      maxRows={6}
      hint="Shown on your public profile."
    />
  );
}

function TextareaStates() {
  const [note, setNote] = useState('');
  return (
    <Stack>
      <Textarea label="Delivery note" optional placeholder="Gate code, where to leave it…" value={note} onChangeText={setNote} />
      <Textarea label="Reason for return" error="Tell us what went wrong so we can fix it." minRows={2} />
    </Stack>
  );
}

// SearchField

const people = ['Ana Costa', 'Ben Okafor', 'Chloé Martin', 'Dev Patel', 'Emma Lindqvist', 'Hiro Tanaka'];

function SearchPeople() {
  const [query, setQuery] = useState('');
  const results = people.filter((p) => p.toLowerCase().includes(query.trim().toLowerCase()));
  return (
    <Stack gap={12}>
      <SearchField placeholder="Search people" value={query} onChangeText={setQuery} />
      <View style={{ gap: 6 }}>
        {results.length ? results.map((p) => <Text key={p}>{p}</Text>) : <Text tone="subtle">No one matches “{query}”.</Text>}
      </View>
    </Stack>
  );
}

function SearchPlain() {
  const [query, setQuery] = useState('');
  return <SearchField placeholder="Search settings" showCancel={false} value={query} onChangeText={setQuery} size="sm" />;
}

// Checkbox

function CheckboxBasic() {
  const [terms, setTerms] = useState(false);
  const [news, setNews] = useState(true);
  return (
    <View>
      <Checkbox checked={terms} onValueChange={setTerms} label="I agree to the terms of service" />
      <Checkbox checked={news} onValueChange={setNews} label="Product updates" description="One email a month. Unsubscribe any time." />
    </View>
  );
}

const toppings = ['Mushrooms', 'Peppers', 'Olives'];

function CheckboxAll() {
  const [picked, setPicked] = useState<string[]>(['Peppers']);
  const all = picked.length === toppings.length ? true : picked.length ? 'indeterminate' : false;
  return (
    <View>
      <Checkbox checked={all} onValueChange={(on) => setPicked(on ? toppings : [])} label="All toppings" />
      <View style={{ paddingLeft: 34 }}>
        {toppings.map((name) => (
          <Checkbox
            key={name}
            label={name}
            checked={picked.includes(name)}
            onValueChange={(on) => setPicked(on ? [...picked, name] : picked.filter((p) => p !== name))}
          />
        ))}
      </View>
    </View>
  );
}

function CheckboxStates() {
  const [a, setA] = useState(true);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <Checkbox checked={a} onValueChange={setA} accessibilityLabel="Select row" />
      <Checkbox checked={false} error accessibilityLabel="Required" />
      <Checkbox checked disabled accessibilityLabel="Locked" />
      <Checkbox checked="indeterminate" disabled accessibilityLabel="Partly selected" />
    </View>
  );
}

// RadioGroup

function RadioRows() {
  const [plan, setPlan] = useState('monthly');
  return (
    <RadioGroup value={plan} onValueChange={setPlan} accessibilityLabel="Billing">
      <Radio value="monthly" label="Monthly" description="$12 a month, cancel any time." />
      <Radio value="yearly" label="Yearly" description="$120 a year, two months free." />
      <Radio value="team" label="Team" description="Talk to sales." disabled />
    </RadioGroup>
  );
}

function RadioCards() {
  const [speed, setSpeed] = useState('standard');
  return (
    <RadioGroup variant="card" value={speed} onValueChange={setSpeed} accessibilityLabel="Shipping">
      <Radio value="standard" label="Standard" description="3–5 business days" aside={<Text tone="muted">Free</Text>} />
      <Radio value="express" label="Express" description="Next business day" aside={<Text tone="muted">$9</Text>} />
      <Radio value="pickup" label="Pick up in store" description="Ready in 2 hours" aside={<Text tone="muted">Free</Text>} />
    </RadioGroup>
  );
}

// Switch

function SwitchRows() {
  const [push, setPush] = useState(true);
  const [sounds, setSounds] = useState(false);
  return (
    <View>
      <Switch value={push} onValueChange={setPush} label="Push notifications" description="New messages and mentions." />
      <Switch value={sounds} onValueChange={setSounds} label="Sounds" />
    </View>
  );
}

function SwitchBare() {
  const [on, setOn] = useState(true);
  return (
    <View style={{ flexDirection: 'row', gap: 16 }}>
      <Switch value={on} onValueChange={setOn} accessibilityLabel="Wi-Fi" />
      <Switch value={false} disabled accessibilityLabel="Airplane mode" />
      <Switch value disabled accessibilityLabel="Location" />
    </View>
  );
}

// Slider

function SliderVolume() {
  const [volume, setVolume] = useState(60);
  return <Slider label="Volume" showValue value={volume} onValueChange={setVolume} formatValue={(v) => `${Math.round(v)}%`} />;
}

function SliderSteps() {
  const [tip, setTip] = useState(15);
  return (
    <Slider label="Tip" showValue value={tip} onValueChange={setTip} min={0} max={30} step={5} formatValue={(v) => `${v}%`} />
  );
}

// Stepper

function StepperGuests() {
  const [guests, setGuests] = useState(2);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
      <Text>Guests</Text>
      <Stepper value={guests} onValueChange={setGuests} min={1} max={12} accessibilityLabel="Guests" />
    </View>
  );
}

function StepperDecimal() {
  const [hours, setHours] = useState(1.5);
  const [qty, setQty] = useState(0);
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
      <Stepper value={hours} onValueChange={setHours} min={0.5} max={8} step={0.5} formatValue={(v) => `${v} h`} accessibilityLabel="Hours" />
      <Stepper size="sm" value={qty} onValueChange={setQty} min={0} max={99} accessibilityLabel="Quantity" />
    </View>
  );
}

// SegmentedControl

function SegmentText() {
  const [range, setRange] = useState('Week');
  return <SegmentedControl options={['Day', 'Week', 'Month', 'Year']} value={range} onValueChange={setRange} />;
}

function SegmentIcons() {
  const [view, setView] = useState('list');
  const [sort, setSort] = useState('new');
  return (
    <Stack>
      <SegmentedControl
        style={{ alignSelf: 'flex-start', width: 120 }}
        value={view}
        onValueChange={setView}
        options={[
          { value: 'list', icon: 'list', accessibilityLabel: 'List' },
          { value: 'grid', icon: 'grid', accessibilityLabel: 'Grid' },
        ]}
      />
      <SegmentedControl
        size="sm"
        value={sort}
        onValueChange={setSort}
        options={[
          { value: 'new', label: 'Newest' },
          { value: 'top', label: 'Top rated' },
          { value: 'price', label: 'Price' },
        ]}
      />
    </Stack>
  );
}

// ToggleGroup

function ToggleFormat() {
  const [styles, setStyles] = useState<string[]>(['bold']);
  return (
    <ToggleGroup
      type="multiple"
      value={styles}
      onValueChange={setStyles}
      accessibilityLabel="Text style"
      items={[
        { value: 'bold', icon: 'bold', accessibilityLabel: 'Bold' },
        { value: 'italic', icon: 'italic', accessibilityLabel: 'Italic' },
        { value: 'code', icon: 'code', accessibilityLabel: 'Code' },
        { value: 'link', icon: 'link', accessibilityLabel: 'Link' },
      ]}
    />
  );
}

function ToggleFilters() {
  const [status, setStatus] = useState<string[]>(['open', 'review']);
  return (
    <ToggleGroup
      type="multiple"
      variant="pill"
      size="sm"
      value={status}
      onValueChange={setStatus}
      accessibilityLabel="Status"
      items={[
        { value: 'open', label: 'Open' },
        { value: 'review', label: 'In review' },
        { value: 'merged', label: 'Merged' },
        { value: 'closed', label: 'Closed' },
      ]}
    />
  );
}

function ToggleSize() {
  const [size, setSize] = useState<string | null>('M');
  return (
    <ToggleGroup
      variant="pill"
      value={size}
      onValueChange={setSize}
      accessibilityLabel="Size"
      items={['XS', 'S', 'M', 'L', 'XL'].map((s) => ({ value: s, label: s }))}
    />
  );
}

// OTPInput

function OTPVerify() {
  const [code, setCode] = useState('');
  const [status, setStatus] = useState<'idle' | 'ok' | 'wrong'>('idle');
  return (
    <OTPInput
      label="Verification code"
      value={code}
      onChangeText={(c) => {
        setCode(c);
        setStatus('idle');
      }}
      onComplete={(c) => setStatus(c === '123456' ? 'ok' : 'wrong')}
      hint={status === 'ok' ? 'Verified. You are signed in.' : 'We sent it to •••• 0142. Try 123456.'}
      error={status === 'wrong' ? 'That code didn’t match. Check the message and try again.' : undefined}
    />
  );
}

function OTPShort() {
  const [pin, setPin] = useState('');
  return <OTPInput length={4} label="Gift card PIN" type="alphanumeric" value={pin} onChangeText={setPin} style={{ maxWidth: 240 }} />;
}

// ChipInput

function ChipTags() {
  const [tags, setTags] = useState(['design', 'ios']);
  return <ChipInput label="Tags" placeholder="Add a tag" value={tags} onValueChange={setTags} hint="Press return or type a comma to add." />;
}

function ChipEmails() {
  const [emails, setEmails] = useState<string[]>([]);
  return (
    <ChipInput
      label="Invite"
      placeholder="name@company.com"
      keyboardType="email-address"
      textContentType="emailAddress"
      max={5}
      value={emails}
      onValueChange={setEmails}
      hint={`${5 - emails.length} invites left`}
    />
  );
}

export const pages: DemoPage[] = [
  {
    slug: 'field',
    name: 'Field',
    group: 'Forms',
    description: 'Label, hint and error around any control. Errors replace the hint and are announced to screen readers.',
    demos: [
      {
        title: 'Label and hint',
        render: () => <FieldHint />,
        code: `<Field label="Delivery" hint="Express arrives tomorrow if you order before 2 pm.">
  <SegmentedControl options={['Standard', 'Express']} value={speed} onValueChange={setSpeed} />
</Field>`,
      },
      {
        title: 'Required, optional and error',
        render: () => <FieldStates />,
        code: `<Field label="Party size" required error={guests > 8 ? 'Tables seat up to 8. Call us for larger groups.' : undefined}>
  <Stepper value={guests} onValueChange={setGuests} min={1} max={12} accessibilityLabel="Party size" />
</Field>
<Field label="Budget per person" optional hint="Helps us suggest a menu.">
  <Slider value={budget} onValueChange={setBudget} min={20} max={120} step={10} showValue formatValue={(v) => \`$\${v}\`} accessibilityLabel="Budget per person" />
</Field>`,
      },
    ],
  },
  {
    slug: 'input',
    name: 'Input',
    group: 'Forms',
    description: 'A single-line text field with label, hint and error, icons, and clear and reveal buttons. 44pt by default.',
    demos: [
      {
        title: 'Label and hint',
        render: () => <Input label="Email" placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" textContentType="emailAddress" hint="We’ll send the receipt here." />,
        code: `<Input
  label="Email"
  placeholder="you@example.com"
  keyboardType="email-address"
  autoCapitalize="none"
  textContentType="emailAddress"
  hint="We’ll send the receipt here."
/>`,
      },
      {
        title: 'Icons, clear button and trailing text',
        render: () => <InputIcons />,
        code: `<Input icon="map-pin" placeholder="City or airport" value={query} onChangeText={setQuery} clearable />
<Input
  label="Amount"
  icon="dollar"
  placeholder="0.00"
  keyboardType="decimal-pad"
  value={amount}
  onChangeText={setAmount}
  trailing={<Text tone="subtle">USD</Text>}
/>`,
      },
      {
        title: 'Password',
        render: () => <InputSecure />,
        code: `<Input
  label="Password"
  secure
  placeholder="At least 8 characters"
  textContentType="newPassword"
  value={password}
  onChangeText={setPassword}
  hint="Use 8 or more characters."
  error={short ? 'Too short. Add a few more characters.' : undefined}
/>`,
      },
      {
        title: 'Sizes and states',
        render: () => (
          <Stack gap={12}>
            <Input size="sm" placeholder="Small" />
            <Input placeholder="Medium (default)" />
            <Input size="lg" placeholder="Large" />
            <Input variant="filled" placeholder="Filled" />
            <Input defaultValue="hello@" error="Enter a full email address." />
            <Input defaultValue="Read only" disabled />
          </Stack>
        ),
        code: `<Input size="sm" placeholder="Small" />
<Input placeholder="Medium (default)" />
<Input size="lg" placeholder="Large" />
<Input variant="filled" placeholder="Filled" />
<Input defaultValue="hello@" error="Enter a full email address." />
<Input defaultValue="Read only" disabled />`,
      },
    ],
  },
  {
    slug: 'textarea',
    name: 'Textarea',
    group: 'Forms',
    description: 'Multi-line text that grows with what you type, up to a limit, with an optional character count.',
    demos: [
      {
        title: 'Grows, with a character count',
        render: () => <TextareaCount />,
        code: `<Textarea
  label="Bio"
  placeholder="A line or two about you"
  value={bio}
  onChangeText={setBio}
  maxLength={160}
  minRows={2}
  maxRows={6}
  hint="Shown on your public profile."
/>`,
      },
      {
        title: 'Optional and error',
        render: () => <TextareaStates />,
        code: `<Textarea label="Delivery note" optional placeholder="Gate code, where to leave it…" value={note} onChangeText={setNote} />
<Textarea label="Reason for return" error="Tell us what went wrong so we can fix it." minRows={2} />`,
      },
    ],
  },
  {
    slug: 'search-field',
    name: 'SearchField',
    group: 'Forms',
    description: 'A rounded search field. While it has focus, a Cancel button slides in that clears it and puts the keyboard away.',
    demos: [
      {
        title: 'Filter a list',
        render: () => <SearchPeople />,
        code: `const results = people.filter((p) => p.toLowerCase().includes(query.trim().toLowerCase()));

<SearchField placeholder="Search people" value={query} onChangeText={setQuery} />
{results.map((p) => <Text key={p}>{p}</Text>)}`,
      },
      {
        title: 'Small, without Cancel',
        render: () => <SearchPlain />,
        code: `<SearchField placeholder="Search settings" showCancel={false} value={query} onChangeText={setQuery} size="sm" />`,
      },
    ],
  },
  {
    slug: 'checkbox',
    name: 'Checkbox',
    group: 'Forms',
    description: 'On/off choices in a list or form. The check draws in, and the whole row is the touch target.',
    demos: [
      {
        title: 'With labels',
        render: () => <CheckboxBasic />,
        code: `<Checkbox checked={terms} onValueChange={setTerms} label="I agree to the terms of service" />
<Checkbox checked={news} onValueChange={setNews} label="Product updates" description="One email a month. Unsubscribe any time." />`,
      },
      {
        title: 'Select all (indeterminate)',
        render: () => <CheckboxAll />,
        code: `const all = picked.length === toppings.length ? true : picked.length ? 'indeterminate' : false;

<Checkbox checked={all} onValueChange={(on) => setPicked(on ? toppings : [])} label="All toppings" />
<View style={{ paddingLeft: 34 }}>
  {toppings.map((name) => (
    <Checkbox
      key={name}
      label={name}
      checked={picked.includes(name)}
      onValueChange={(on) => setPicked(on ? [...picked, name] : picked.filter((p) => p !== name))}
    />
  ))}
</View>`,
      },
      {
        title: 'Without a label, error and disabled',
        render: () => <CheckboxStates />,
        code: `<Checkbox checked={a} onValueChange={setA} accessibilityLabel="Select row" />
<Checkbox checked={false} error accessibilityLabel="Required" />
<Checkbox checked disabled accessibilityLabel="Locked" />
<Checkbox checked="indeterminate" disabled accessibilityLabel="Partly selected" />`,
      },
    ],
  },
  {
    slug: 'radio-group',
    name: 'RadioGroup',
    group: 'Forms',
    description: 'Pick one of a few options that all stay visible. Use cards when each option needs more room.',
    demos: [
      {
        title: 'List',
        render: () => <RadioRows />,
        code: `<RadioGroup value={plan} onValueChange={setPlan} accessibilityLabel="Billing">
  <Radio value="monthly" label="Monthly" description="$12 a month, cancel any time." />
  <Radio value="yearly" label="Yearly" description="$120 a year, two months free." />
  <Radio value="team" label="Team" description="Talk to sales." disabled />
</RadioGroup>`,
      },
      {
        title: 'Cards',
        render: () => <RadioCards />,
        code: `<RadioGroup variant="card" value={speed} onValueChange={setSpeed} accessibilityLabel="Shipping">
  <Radio value="standard" label="Standard" description="3–5 business days" aside={<Text tone="muted">Free</Text>} />
  <Radio value="express" label="Express" description="Next business day" aside={<Text tone="muted">$9</Text>} />
  <Radio value="pickup" label="Pick up in store" description="Ready in 2 hours" aside={<Text tone="muted">Free</Text>} />
</RadioGroup>`,
      },
    ],
  },
  {
    slug: 'switch',
    name: 'Switch',
    group: 'Forms',
    description: 'An on/off toggle for settings that apply at once. Tap it, or drag the thumb across.',
    demos: [
      {
        title: 'Settings rows',
        render: () => <SwitchRows />,
        code: `<Switch value={push} onValueChange={setPush} label="Push notifications" description="New messages and mentions." />
<Switch value={sounds} onValueChange={setSounds} label="Sounds" />`,
      },
      {
        title: 'On its own and disabled',
        render: () => <SwitchBare />,
        code: `<Switch value={on} onValueChange={setOn} accessibilityLabel="Wi-Fi" />
<Switch value={false} disabled accessibilityLabel="Airplane mode" />
<Switch value disabled accessibilityLabel="Location" />`,
      },
    ],
  },
  {
    slug: 'slider',
    name: 'Slider',
    group: 'Forms',
    description: 'Pick a value from a range by dragging or tapping the track. Steps snap and tick a haptic.',
    demos: [
      {
        title: 'Continuous',
        render: () => <SliderVolume />,
        code: `<Slider label="Volume" showValue value={volume} onValueChange={setVolume} formatValue={(v) => \`\${Math.round(v)}%\`} />`,
      },
      {
        title: 'Steps',
        render: () => <SliderSteps />,
        code: `<Slider label="Tip" showValue value={tip} onValueChange={setTip} min={0} max={30} step={5} formatValue={(v) => \`\${v}%\`} />`,
      },
      {
        title: 'Disabled',
        render: () => <Slider label="Brightness" value={40} disabled />,
        code: `<Slider label="Brightness" value={40} disabled />`,
      },
    ],
  },
  {
    slug: 'stepper',
    name: 'Stepper',
    group: 'Forms',
    description: 'Nudge a small number up or down. Hold a button to repeat, faster the longer you hold.',
    demos: [
      {
        title: 'In a row',
        render: () => <StepperGuests />,
        code: `<Text>Guests</Text>
<Stepper value={guests} onValueChange={setGuests} min={1} max={12} accessibilityLabel="Guests" />`,
      },
      {
        title: 'Decimal steps and small',
        render: () => <StepperDecimal />,
        code: `<Stepper value={hours} onValueChange={setHours} min={0.5} max={8} step={0.5} formatValue={(v) => \`\${v} h\`} accessibilityLabel="Hours" />
<Stepper size="sm" value={qty} onValueChange={setQty} min={0} max={99} accessibilityLabel="Quantity" />`,
      },
    ],
  },
  {
    slug: 'segmented-control',
    name: 'SegmentedControl',
    group: 'Forms',
    description: 'Switch between 2–5 views or modes of the same content. The selection slides between segments.',
    demos: [
      {
        title: 'Text',
        render: () => <SegmentText />,
        code: `<SegmentedControl options={['Day', 'Week', 'Month', 'Year']} value={range} onValueChange={setRange} />`,
      },
      {
        title: 'Icons and small',
        render: () => <SegmentIcons />,
        code: `<SegmentedControl
  style={{ alignSelf: 'flex-start', width: 120 }}
  value={view}
  onValueChange={setView}
  options={[
    { value: 'list', icon: 'list', accessibilityLabel: 'List' },
    { value: 'grid', icon: 'grid', accessibilityLabel: 'Grid' },
  ]}
/>
<SegmentedControl
  size="sm"
  value={sort}
  onValueChange={setSort}
  options={[
    { value: 'new', label: 'Newest' },
    { value: 'top', label: 'Top rated' },
    { value: 'price', label: 'Price' },
  ]}
/>`,
      },
    ],
  },
  {
    slug: 'toggle-group',
    name: 'ToggleGroup',
    group: 'Forms',
    description: 'A row of toggle buttons with single or multiple choice, for text styles, view options or filters.',
    demos: [
      {
        title: 'Toolbar (multiple)',
        render: () => <ToggleFormat />,
        code: `<ToggleGroup
  type="multiple"
  value={styles}
  onValueChange={setStyles}
  accessibilityLabel="Text style"
  items={[
    { value: 'bold', icon: 'bold', accessibilityLabel: 'Bold' },
    { value: 'italic', icon: 'italic', accessibilityLabel: 'Italic' },
    { value: 'code', icon: 'code', accessibilityLabel: 'Code' },
    { value: 'link', icon: 'link', accessibilityLabel: 'Link' },
  ]}
/>`,
      },
      {
        title: 'Filter pills',
        render: () => <ToggleFilters />,
        code: `<ToggleGroup
  type="multiple"
  variant="pill"
  size="sm"
  value={status}
  onValueChange={setStatus}
  accessibilityLabel="Status"
  items={[
    { value: 'open', label: 'Open' },
    { value: 'review', label: 'In review' },
    { value: 'merged', label: 'Merged' },
    { value: 'closed', label: 'Closed' },
  ]}
/>`,
      },
      {
        title: 'Single choice',
        render: () => <ToggleSize />,
        code: `<ToggleGroup
  variant="pill"
  value={size}
  onValueChange={setSize}
  accessibilityLabel="Size"
  items={['XS', 'S', 'M', 'L', 'XL'].map((s) => ({ value: s, label: s }))}
/>`,
      },
    ],
  },
  {
    slug: 'otp-input',
    name: 'OTPInput',
    group: 'Forms',
    description: 'One-time code entry. SMS autofill and paste fill every box; a wrong code shakes once.',
    demos: [
      {
        title: 'Verify a code',
        render: () => <OTPVerify />,
        code: `<OTPInput
  label="Verification code"
  value={code}
  onChangeText={(c) => {
    setCode(c);
    setStatus('idle');
  }}
  onComplete={(c) => setStatus(c === '123456' ? 'ok' : 'wrong')}
  hint={status === 'ok' ? 'Verified. You are signed in.' : 'We sent it to •••• 0142. Try 123456.'}
  error={status === 'wrong' ? 'That code didn’t match. Check the message and try again.' : undefined}
/>`,
      },
      {
        title: 'Four characters',
        render: () => <OTPShort />,
        code: `<OTPInput length={4} label="Gift card PIN" type="alphanumeric" value={pin} onChangeText={setPin} style={{ maxWidth: 240 }} />`,
      },
    ],
  },
  {
    slug: 'chip-input',
    name: 'ChipInput',
    group: 'Forms',
    description: 'Type and press return to turn text into chips: tags, keywords or email addresses.',
    demos: [
      {
        title: 'Tags',
        render: () => <ChipTags />,
        code: `<ChipInput label="Tags" placeholder="Add a tag" value={tags} onValueChange={setTags} hint="Press return or type a comma to add." />`,
      },
      {
        title: 'Emails, up to five',
        render: () => <ChipEmails />,
        code: `<ChipInput
  label="Invite"
  placeholder="name@company.com"
  keyboardType="email-address"
  textContentType="emailAddress"
  max={5}
  value={emails}
  onValueChange={setEmails}
  hint={\`\${5 - emails.length} invites left\`}
/>`,
      },
    ],
  },
];
