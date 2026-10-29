import { View } from 'react-native';
import { Icon, type IconName } from '../../primitives/Icon';
import { Text } from '../../primitives/Text';
import { Touchable } from '../../primitives/Touchable';
import { useSlate } from '../../theme';
import { Button } from '../general/Button';
import { Sheet } from './Sheet';

export type ActionSheetAction = {
  label: string;
  icon?: IconName;
  destructive?: boolean;
  disabled?: boolean;
  onPress?: () => void;
};

export type ActionSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  message?: string;
  actions: ActionSheetAction[];
  /** Label of the separate cancel button. Default 'Cancel'. */
  cancelLabel?: string;
};

/** A short list of actions about one thing, with a separate Cancel. Use it for 'what do you want to do with this?'. */
export function ActionSheet({ open, onOpenChange, title, message, actions, cancelLabel = 'Cancel' }: ActionSheetProps) {
  const t = useSlate();
  const close = () => onOpenChange(false);
  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={message}
      padded={false}
      footer={<Button variant="secondary" block onPress={close}>{cancelLabel}</Button>}
    >
      <View style={{ paddingHorizontal: t.space[2] }} accessibilityRole="menu">
        {actions.map((a) => {
          const fg = a.destructive ? t.c.danger : t.c.text;
          return (
            <Touchable
              key={a.label}
              disabled={a.disabled}
              pressScale={0.98}
              haptic={a.destructive ? 'medium' : 'selection'}
              pressedStyle={{ backgroundColor: a.destructive ? t.c.dangerSoft : t.c.surfaceHover }}
              accessibilityRole="menuitem"
              onPress={() => { close(); a.onPress?.(); }}
              style={{
                minHeight: t.component.rowHeight, flexDirection: 'row', alignItems: 'center', gap: t.space[3],
                paddingHorizontal: t.space[3], borderRadius: t.radius.lg, borderCurve: 'continuous',
              }}
            >
              {a.icon && <Icon name={a.icon} size={20} color={a.destructive ? t.c.danger : t.c.textMuted} />}
              <Text variant="body" weight="500" style={{ color: fg, flex: 1 }}>{a.label}</Text>
            </Touchable>
          );
        })}
      </View>
    </Sheet>
  );
}
