import type { ReactElement } from 'react';

export type Group = 'General' | 'Forms' | 'Feedback' | 'Navigation' | 'Overlays' | 'Data';

/** One live example: what it renders and the code a reader would copy. */
export type Demo = { title: string; render: () => ReactElement; code: string };

export type DemoPage = {
  slug: string;
  name: string;
  group: Group;
  /** One sentence: what it is and when to use it. */
  description: string;
  demos: Demo[];
};
