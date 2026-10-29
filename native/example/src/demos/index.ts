import { pages as data } from './data';
import { pages as feedback } from './feedback';
import { pages as forms } from './forms';
import { pages as general } from './general';
import { pages as navigation } from './navigation';
import { pages as overlays } from './overlays';
import type { Group } from './types';

export const groups: Group[] = ['General', 'Forms', 'Feedback', 'Navigation', 'Overlays', 'Data'];
export const allPages = [...general, ...forms, ...feedback, ...navigation, ...overlays, ...data];
export const pageBySlug = Object.fromEntries(allPages.map((p) => [p.slug, p]));
export type { Demo, DemoPage, Group } from './types';
