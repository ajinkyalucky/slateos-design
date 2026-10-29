import { ScrollView } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Text, useSlate } from '@ajinkyabhagwat/slateos-native';
import { pageBySlug } from '../demos';
import { DemoCard } from '../showcase/DemoCard';

export default function ComponentPage() {
  const t = useSlate();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const page = pageBySlug[slug];
  if (!page) return null;
  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      keyboardDismissMode="interactive"
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{ padding: t.space[4], paddingBottom: t.space[10], gap: t.space[6] }}
    >
      <Text tone="muted">{page.description}</Text>
      {page.demos.map((d) => (
        <DemoCard key={d.title} demo={d} />
      ))}
    </ScrollView>
  );
}
