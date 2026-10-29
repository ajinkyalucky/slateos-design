import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Text, Touchable, useSlate } from '@ajinkyabhagwat/slateos-native';
import type { Demo } from '../demos';

/** A live example with its copyable code underneath. */
export function DemoCard({ demo }: { demo: Demo }) {
  const t = useSlate();
  const [showCode, setShowCode] = useState(false);
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await Clipboard.setStringAsync(demo.code);
    t.haptic('success');
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };

  return (
    <View style={{ gap: t.space[2] }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text variant="label" tone="muted">{demo.title}</Text>
        <View style={{ flexDirection: 'row', gap: t.space[4] }}>
          <Touchable onPress={() => setShowCode((v) => !v)} haptic="selection" pressScale={0.94}>
            <Text variant="label" tone={showCode ? 'default' : 'subtle'}>Code</Text>
          </Touchable>
          <Touchable onPress={copy} pressScale={0.94} accessibilityLabel="Copy code">
            <Text variant="label" tone={copied ? 'success' : 'subtle'}>{copied ? 'Copied' : 'Copy'}</Text>
          </Touchable>
        </View>
      </View>
      <View
        style={{
          borderRadius: t.component.cardRadius,
          borderWidth: 1,
          borderColor: t.c.border,
          backgroundColor: t.c.surfaceRaised,
          overflow: 'hidden',
        }}
      >
        <View style={{ padding: t.space[4] }}>{demo.render()}</View>
        {showCode && (
          <ScrollView
            horizontal
            style={{ borderTopWidth: 1, borderTopColor: t.c.borderSubtle, backgroundColor: t.c.surface }}
            contentContainerStyle={{ padding: t.space[4] }}
          >
            <Text selectable mono variant="footnote" tone="muted">{demo.code}</Text>
          </ScrollView>
        )}
      </View>
    </View>
  );
}
