import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import * as Clipboard from 'expo-clipboard';
import { Crossfade, Text, Touchable, useSlate, useToggleProgress } from '@ajinkyabhagwat/slateos-native';
import type { Demo } from '../demos';

/** A live example with its copyable code underneath. */
export function DemoCard({ demo }: { demo: Demo }) {
  const t = useSlate();
  const [showCode, setShowCode] = useState(false);
  const [copied, setCopied] = useState(false);
  // The code mounts on first open, then stays so it can fold away as smoothly as it opened.
  const [codeMounted, setCodeMounted] = useState(false);
  const [codeH, setCodeH] = useState(0);
  const open = useToggleProgress(showCode);
  const done = useToggleProgress(copied, t.spring.press);
  const fold = useAnimatedStyle(() => ({ height: codeH * open.value, opacity: open.value }));

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
          <Touchable
            onPress={() => { setCodeMounted(true); setShowCode((v) => !v); }}
            haptic="selection"
            pressScale={0.94}
            accessibilityState={{ expanded: showCode }}
            accessibilityLabel="Code"
          >
            <Crossfade progress={open} on={<Text variant="label">Code</Text>} off={<Text variant="label" tone="subtle">Code</Text>} />
          </Touchable>
          <Touchable onPress={copy} pressScale={0.94} accessibilityLabel={copied ? 'Copied' : 'Copy code'}>
            <Crossfade progress={done} on={<Text variant="label" tone="success">Copied</Text>} off={<Text variant="label" tone="subtle">Copy</Text>} />
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
        {codeMounted && (
          <Animated.View
            style={[{ overflow: 'hidden' }, fold]}
            accessibilityElementsHidden={!showCode}
            importantForAccessibility={showCode ? 'auto' : 'no-hide-descendants'}
          >
            {/* Measured out of flow, so its height never depends on the folding container. */}
            <View onLayout={(e) => setCodeH(e.nativeEvent.layout.height)} style={{ position: 'absolute', top: 0, left: 0, right: 0 }}>
              <ScrollView
                horizontal
                style={{ borderTopWidth: 1, borderTopColor: t.c.borderSubtle, backgroundColor: t.c.surface }}
                contentContainerStyle={{ padding: t.space[4] }}
              >
                <Text selectable mono variant="footnote" tone="muted">{demo.code}</Text>
              </ScrollView>
            </View>
          </Animated.View>
        )}
      </View>
    </View>
  );
}
