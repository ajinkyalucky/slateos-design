import { useLocalSearchParams } from 'expo-router';
import { blockByName } from '../../blocks';

/** The same block as a plain full-screen page, for the docs screenshots (launch with -slateosShot <name>). */
export default function BlockShot() {
  const { name } = useLocalSearchParams<{ name: string }>();
  return blockByName[name]?.render(true) ?? null;
}
