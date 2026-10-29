import { Platform, Settings } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { SlateProvider, type FontName, type StyleName } from '@ajinkyabhagwat/slateos-native';
import { blockByName } from '../../blocks';
import { useSettings } from '../../showcase/settings';

// Launch args for screenshots: -slateosFont <font vibe> and -slateosStyle <style> override the showcase settings.
const arg = (key: string) => (Platform.OS === 'ios' ? (Settings.get(key) as string | undefined) : undefined);

/** The same block as a plain full-screen page, for the docs screenshots (launch with -slateosShot <name>). */
export default function BlockShot() {
  const { name } = useLocalSearchParams<{ name: string }>();
  const { set: _set, ...settings } = useSettings();
  const block = blockByName[name];
  if (!block) return null;
  return (
    <SlateProvider {...settings} font={(arg('slateosFont') as FontName) ?? settings.font} style={(arg('slateosStyle') as StyleName) ?? settings.style}>
      {block.render(true)}
    </SlateProvider>
  );
}
