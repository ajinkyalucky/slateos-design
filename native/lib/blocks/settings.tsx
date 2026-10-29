import { useState } from 'react';
import { View } from 'react-native';
import Animated from 'react-native-reanimated';
import {
  AlertDialog, Avatar, Header, ListRow, ListSection, Text, useCollapsingHeader, useSlate,
} from '@ajinkyabhagwat/slateos-native';

export type SettingsScreenProps = {
  user?: { name: string; email: string };
  version?: string;
  /** Called with a row key: 'profile', 'appearance', 'language', 'privacy', 'help', 'feedback'. */
  onOpen?: (key: string) => void;
  onSignOut?: () => void;
};

/** A grouped settings screen: account card, toggles, detail rows, support, and sign out with a confirm. */
export function SettingsScreen({ user = { name: 'Maya Patel', email: 'maya@acme.co' }, version = '1.0.0 (42)', onOpen, onSignOut }: SettingsScreenProps) {
  const t = useSlate();
  const header = useCollapsingHeader();
  const [push, setPush] = useState(true);
  const [digest, setDigest] = useState(false);
  const [faceId, setFaceId] = useState(true);
  const [confirm, setConfirm] = useState(false);
  const open = (key: string) => () => onOpen?.(key);

  return (
    <View style={{ flex: 1, backgroundColor: t.c.bg }}>
      <Header title="Settings" collapse={header} />
      <Animated.ScrollView
        onScroll={header.onScroll}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingHorizontal: t.component.screenPadding, paddingBottom: t.space[10], gap: t.space[6] }}
      >
        <Header.LargeTitle collapse={header}>Settings</Header.LargeTitle>

        <ListSection>
          <ListRow leading={<Avatar name={user.name} size="lg" />} title={user.name} subtitle={user.email} onPress={open('profile')} />
        </ListSection>

        <ListSection header="Notifications" footer="The daily digest arrives at 8:00 AM.">
          <ListRow icon="bell" iconTint={t.c.dangerSolid} title="Push notifications" accessory="switch" checked={push} onCheckedChange={setPush} />
          <ListRow icon="mail" iconTint={t.c.infoSolid} title="Daily digest" accessory="switch" checked={digest} onCheckedChange={setDigest} />
        </ListSection>

        <ListSection header="General">
          <ListRow icon="sun" iconTint={t.c.warningSolid} title="Appearance" detail="System" onPress={open('appearance')} />
          <ListRow icon="globe" iconTint={t.c.chart5} title="Language" detail="English" onPress={open('language')} />
          <ListRow icon="lock" iconTint={t.c.successSolid} title="Unlock with Face ID" accessory="switch" checked={faceId} onCheckedChange={setFaceId} />
          <ListRow icon="shield" iconTint={t.c.textSubtle} title="Privacy" onPress={open('privacy')} />
        </ListSection>

        <ListSection header="Support">
          <ListRow icon="help-circle" iconTint={t.c.infoSolid} title="Help centre" onPress={open('help')} />
          <ListRow icon="message-square" iconTint={t.c.chart2} title="Send feedback" onPress={open('feedback')} />
        </ListSection>

        <ListSection>
          <ListRow title="Sign out" destructive onPress={() => setConfirm(true)} />
        </ListSection>

        <Text variant="footnote" tone="subtle" style={{ textAlign: 'center' }}>Version {version}</Text>
      </Animated.ScrollView>

      <AlertDialog
        open={confirm}
        onOpenChange={setConfirm}
        title="Sign out?"
        description="You’ll need your password to sign back in on this phone."
        actions={[
          { label: 'Sign out', style: 'destructive', onPress: onSignOut },
          { label: 'Cancel', style: 'cancel' },
        ]}
      />
    </View>
  );
}
