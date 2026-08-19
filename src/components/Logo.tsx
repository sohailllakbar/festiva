import Svg, { Circle, Path, G } from 'react-native-svg';
import { useTheme } from '../theme';

/**
 * Festiva mark: a burst of celebration rays around a calendar dot — the two
 * ideas the product joins together (an occasion, and a date to remember it by).
 * Drawn in code so it recolours per surface and stays crisp at any size.
 */
export function Logo({ size = 72, color }: { size?: number; color?: string }) {
  const { colors } = useTheme();
  // Default has to resolve at render, not in the parameter list, so the mark
  // follows the active theme when no explicit colour is given.
  const stroke = color ?? colors.primary;
  const rays = [0, 45, 90, 135, 180, 225, 270, 315];

  return (
    <Svg width={size} height={size} viewBox="0 0 72 72" accessibilityLabel="Festiva">
      <G opacity={0.9}>
        {rays.map((angle, i) => {
          const long = i % 2 === 0;
          const r1 = long ? 22 : 21;
          const r2 = long ? 32 : 28;
          const rad = (angle * Math.PI) / 180;
          const x1 = 36 + r1 * Math.cos(rad);
          const y1 = 36 + r1 * Math.sin(rad);
          const x2 = 36 + r2 * Math.cos(rad);
          const y2 = 36 + r2 * Math.sin(rad);
          return (
            <Path
              key={angle}
              d={`M${x1} ${y1} L${x2} ${y2}`}
              stroke={stroke}
              strokeWidth={long ? 5 : 3.5}
              strokeLinecap="round"
            />
          );
        })}
      </G>
      <Circle cx={36} cy={36} r={15} stroke={stroke} strokeWidth={5} fill="none" />
      <Circle cx={36} cy={36} r={5.5} fill={stroke} />
    </Svg>
  );
}
