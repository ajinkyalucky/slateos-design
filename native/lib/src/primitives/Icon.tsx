import { memo } from 'react';
import Svg, { Circle, Ellipse, Path, Rect } from 'react-native-svg';
import { iconShapes, type IconName } from '../icons';
import { useSlate } from '../theme';

export type { IconName };

export type IconProps = {
  name: IconName;
  /** Points. Default 20. */
  size?: number;
  /** Any colour; defaults to the text colour. */
  color?: string;
  strokeWidth?: number;
  accessibilityLabel?: string;
};

const El = { path: Path, circle: Circle, rect: Rect, ellipse: Ellipse } as const;

/** The 119 SlateOS line icons, drawn on a 24pt grid with a 1.5 stroke. Decorative unless given a label. */
export const Icon = memo(function Icon({ name, size = 20, color, strokeWidth = 1.5, accessibilityLabel }: IconProps) {
  const t = useSlate();
  const shapes = iconShapes[name];
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color ?? t.c.text}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      pointerEvents="none"
      accessible={!!accessibilityLabel}
      accessibilityLabel={accessibilityLabel}
      accessibilityElementsHidden={!accessibilityLabel}
      importantForAccessibility={accessibilityLabel ? 'yes' : 'no-hide-descendants'}
    >
      {shapes.map(([tag, attrs], i) => {
        const C = El[tag] as unknown as React.ComponentType<Record<string, string | number>>;
        return <C key={i} {...attrs} />;
      })}
    </Svg>
  );
});
