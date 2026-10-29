import { useRef, useState } from 'react';
import { useWindowDimensions, View } from 'react-native';
import Animated, { useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Icon, PageDots, Text, useSlate, type IconName } from '@ajinkyabhagwat/slateos-native';

export type OnboardingSlide = { icon: IconName; title: string; body: string };

export type OnboardingScreenProps = {
  slides?: OnboardingSlide[];
  /** Called from the last slide's button and from Skip. */
  onDone?: () => void;
  doneLabel?: string;
};

const DEFAULT_SLIDES: OnboardingSlide[] = [
  { icon: 'calendar', title: 'Plan the week in minutes', body: 'Drop sessions onto your calendar and we’ll find the gaps that work.' },
  { icon: 'activity', title: 'See progress, not noise', body: 'One clear number per goal, with the trend that matters beside it.' },
  { icon: 'users', title: 'Bring your people', body: 'Share plans with a coach or friends. Everyone stays in sync.' },
];

/** A swipeable welcome: one idea per page, dots that follow the finger, and Skip. */
export function OnboardingScreen({ slides = DEFAULT_SLIDES, onDone, doneLabel = 'Get started' }: OnboardingScreenProps) {
  const t = useSlate();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const scroller = useRef<Animated.ScrollView>(null);
  const progress = useSharedValue(0);
  const [index, setIndex] = useState(0);
  const last = index === slides.length - 1;

  const onScroll = useAnimatedScrollHandler((e) => {
    progress.value = e.contentOffset.x / width;
  });

  const go = (i: number) => {
    scroller.current?.scrollTo({ x: i * width, animated: true });
    setIndex(i);
  };

  return (
    <View style={{ flex: 1, backgroundColor: t.c.bg, paddingTop: insets.top, paddingBottom: insets.bottom + t.space[4] }}>
      <View style={{ height: t.control.md, alignItems: 'flex-end', paddingHorizontal: t.space[2] }}>
        {!last && <Button variant="plain" onPress={onDone}>Skip</Button>}
      </View>

      <Animated.ScrollView
        ref={scroller}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        onMomentumScrollEnd={(e) => setIndex(Math.round(e.nativeEvent.contentOffset.x / width))}
        style={{ flex: 1 }}
      >
        {slides.map((s) => (
          <View key={s.title} style={{ width, justifyContent: 'center', paddingHorizontal: t.space[8], gap: t.space[4] }}>
            <View style={{ width: t.size.tile * 2, height: t.size.tile * 2, borderRadius: t.radius['2xl'], backgroundColor: t.c.accentSoft, alignItems: 'center', justifyContent: 'center', marginBottom: t.space[4] }}>
              <Icon name={s.icon} size={24} color={t.c.accent} />
            </View>
            <Text variant="display" accessibilityRole="header">{s.title}</Text>
            <Text variant="body" tone="muted">{s.body}</Text>
          </View>
        ))}
      </Animated.ScrollView>

      <View style={{ paddingHorizontal: t.component.screenPadding, gap: t.space[6] }}>
        <PageDots count={slides.length} index={index} progress={progress} onIndexChange={go} style={{ alignSelf: 'center' }} />
        <Button block size="lg" iconRight={last ? undefined : 'arrow-right'} onPress={() => (last ? onDone?.() : go(index + 1))}>
          {last ? doneLabel : 'Next'}
        </Button>
      </View>
    </View>
  );
}
