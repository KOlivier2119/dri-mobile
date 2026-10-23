import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { Colors } from '@/constants/theme';

/** Line icons on a 24pt grid, drawn with SVG so they stay crisp at any size. */

type IconProps = { size?: number; color?: string; strokeWidth?: number };

function Icon({
  size = 24,
  color = Colors.primary,
  strokeWidth = 1.8,
  children,
}: IconProps & { children: (stroke: { stroke: string; strokeWidth: number }) => React.ReactNode }) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none">
      {children({ stroke: color, strokeWidth })}
    </Svg>
  );
}

const round = { strokeLinecap: 'round', strokeLinejoin: 'round' } as const;

export function MoonIcon(props: IconProps) {
  return (
    <Icon {...props}>
      {(s) => <Path d="M20 14.6A8.2 8.2 0 0 1 9.4 4a8.2 8.2 0 1 0 10.6 10.6Z" {...s} {...round} />}
    </Icon>
  );
}

export function SunIcon(props: IconProps) {
  return (
    <Icon {...props}>
      {(s) => (
        <>
          <Circle cx={12} cy={12} r={4} {...s} />
          <Path
            d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4"
            {...s}
            {...round}
          />
        </>
      )}
    </Icon>
  );
}

/** Steering wheel. */
export function WheelIcon(props: IconProps) {
  return (
    <Icon {...props}>
      {(s) => (
        <>
          <Circle cx={12} cy={12} r={9} {...s} />
          <Circle cx={12} cy={12} r={2.4} {...s} />
          <Path d="M12 14.4V21M9.7 11.3 3.3 10M14.3 11.3l6.4-1.3" {...s} {...round} />
        </>
      )}
    </Icon>
  );
}

export function CarIcon(props: IconProps) {
  return (
    <Icon {...props}>
      {(s) => (
        <>
          <Path
            d="M3.5 16.5V12l1.9-4.6A2.2 2.2 0 0 1 7.4 6h9.2a2.2 2.2 0 0 1 2 1.4l1.9 4.6v4.5Z"
            {...s}
            {...round}
          />
          <Path d="M3.5 12h17M5.5 16.5v2M18.5 16.5v2" {...s} {...round} />
          <Circle cx={7.5} cy={14.2} r={0.6} {...s} />
          <Circle cx={16.5} cy={14.2} r={0.6} {...s} />
        </>
      )}
    </Icon>
  );
}

export function PinIcon(props: IconProps) {
  return (
    <Icon {...props}>
      {(s) => (
        <>
          <Path d="M12 21s-6.5-5.8-6.5-11a6.5 6.5 0 0 1 13 0c0 5.2-6.5 11-6.5 11Z" {...s} {...round} />
          <Circle cx={12} cy={10} r={2.4} {...s} />
        </>
      )}
    </Icon>
  );
}

export function CheckIcon(props: IconProps) {
  return <Icon {...props}>{(s) => <Path d="M5 12.5 9.5 17 19 7.5" {...s} {...round} />}</Icon>;
}

export function CloseIcon(props: IconProps) {
  return <Icon {...props}>{(s) => <Path d="M6.5 6.5l11 11M17.5 6.5l-11 11" {...s} {...round} />}</Icon>;
}

export function ClockIcon(props: IconProps) {
  return (
    <Icon {...props}>
      {(s) => (
        <>
          <Circle cx={12} cy={12} r={9} {...s} />
          <Path d="M12 7.5V12l3 2" {...s} {...round} />
        </>
      )}
    </Icon>
  );
}

export function ShieldIcon(props: IconProps) {
  return (
    <Icon {...props}>
      {(s) => (
        <>
          <Path d="M12 3 19 6v5.4c0 4.4-2.9 7.9-7 9.6-4.1-1.7-7-5.2-7-9.6V6Z" {...s} {...round} />
          <Path d="m9 12 2.2 2.2L15.5 10" {...s} {...round} />
        </>
      )}
    </Icon>
  );
}

export function PhoneIcon(props: IconProps) {
  return (
    <Icon {...props}>
      {(s) => (
        <>
          <Rect x={6.5} y={2.5} width={11} height={19} rx={2.5} {...s} />
          <Path d="M10.5 18.5h3" {...s} {...round} />
        </>
      )}
    </Icon>
  );
}

export function UserIcon(props: IconProps) {
  return (
    <Icon {...props}>
      {(s) => (
        <>
          <Circle cx={12} cy={8} r={3.8} {...s} />
          <Path d="M4.5 20.5c1.2-3.6 4-5.5 7.5-5.5s6.3 1.9 7.5 5.5" {...s} {...round} />
        </>
      )}
    </Icon>
  );
}

export function StarIcon({ size = 14, color = Colors.sun }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="m12 2.8 2.8 5.8 6.3.9-4.6 4.4 1.1 6.3L12 17.2l-5.6 3 1.1-6.3-4.6-4.4 6.3-.9Z"
        fill={color}
      />
    </Svg>
  );
}

export function EyeIcon(props: IconProps) {
  return (
    <Icon {...props}>
      {(s) => (
        <>
          <Path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" {...s} {...round} />
          <Circle cx={12} cy={12} r={3} {...s} />
        </>
      )}
    </Icon>
  );
}

export function EyeOffIcon(props: IconProps) {
  return (
    <Icon {...props}>
      {(s) => (
        <>
          <Path
            d="M9.9 5.7A9.6 9.6 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a17 17 0 0 1-2.6 3.4M6.5 7.6A16.6 16.6 0 0 0 2.5 12S6 18.5 12 18.5a9.3 9.3 0 0 0 4.4-1.1"
            {...s}
            {...round}
          />
          <Path d="M9.9 9.9a3 3 0 0 0 4.2 4.2M3.5 3.5l17 17" {...s} {...round} />
        </>
      )}
    </Icon>
  );
}
