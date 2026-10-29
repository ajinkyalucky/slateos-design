import { useId, useState } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from 'react-native-svg';
import { useSlate } from '../../theme';
import { areaPath, extent, linePath, svgId, type Point } from './chart';

export type SparklineProps = {
  data: number[];
  /** Default: fills the container. */
  width?: number;
  /** Default t.space[6]. */
  height?: number;
  /** Line colour. Default chart1. */
  color?: string;
  /** Soft fill under the line. Default true. */
  area?: boolean;
  /** Mark the latest value with a dot. Default true. */
  showLast?: boolean;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
};

/** A tiny trend line for a stat or a table row. No axes; the shape is the message. */
export function Sparkline({ data, width, height, color, area = true, showLast = true, accessibilityLabel, style }: SparklineProps) {
  const t = useSlate();
  const [measured, setMeasured] = useState(0);
  const id = svgId(useId());
  const w = width ?? measured;
  const h = height ?? t.space[6];
  const stroke = color ?? t.c.chart1;
  const r = t.space['0_5'] + 1;
  const pad = r + 1;
  const [lo, hi] = extent(data, 0);
  const pts: Point[] = data.map((v, i) => [
    pad + (data.length > 1 ? (i / (data.length - 1)) * (w - pad * 2) : (w - pad * 2) / 2),
    pad + (1 - (v - lo) / (hi - lo)) * (h - pad * 2),
  ]);
  const last = pts[pts.length - 1];
  const label = accessibilityLabel ?? (data.length ? `Trend from ${data[0]} to ${data[data.length - 1]}` : 'No data');
  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={label}
      onLayout={width ? undefined : (e) => setMeasured(Math.round(e.nativeEvent.layout.width))}
      style={[{ width: width ?? '100%', height: h }, style]}
    >
      {w > 0 && data.length > 0 && (
        <Svg width={w} height={h}>
          {area && (
            <>
              <Defs>
                <LinearGradient id={id} x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0" stopColor={stroke} stopOpacity={0.22} />
                  <Stop offset="1" stopColor={stroke} stopOpacity={0} />
                </LinearGradient>
              </Defs>
              <Path d={areaPath(pts, h)} fill={`url(#${id})`} />
            </>
          )}
          <Path d={linePath(pts)} stroke={stroke} strokeWidth={1.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          {showLast && last && <Circle cx={last[0]} cy={last[1]} r={r} fill={stroke} stroke={t.c.surfaceRaised} strokeWidth={1.5} />}
        </Svg>
      )}
    </View>
  );
}
