import { useLocalSearchParams } from 'expo-router';
import { SlateProvider } from '@ajinkyabhagwat/slateos-native';
import { blockByName } from '../../blocks';
import { useSettings } from '../../showcase/settings';
import { ThemeWidget } from '../../showcase/ThemeWidget';

/**
 * A block, full screen. Presented as a modal (swipe down to close) that zooms out of its home-screen card; it sits above the root
 * provider's overlay host, so it gets its own provider: dialogs, sheets and the theme button render inside the modal.
 */
export default function BlockPage() {
  const { name } = useLocalSearchParams<{ name: string }>();
  const { set: _set, ...settings } = useSettings();
  const block = blockByName[name];
  if (!block) return null;
  return (
    <SlateProvider {...settings}>
      {block.render()}
      <ThemeWidget />
    </SlateProvider>
  );
}
