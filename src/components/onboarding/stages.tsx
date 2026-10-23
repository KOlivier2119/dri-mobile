import { StyleSheet, View } from 'react-native';
import Svg, { Circle, ClipPath, Defs, Ellipse, G, Line, Path, Rect } from 'react-native-svg';

import { Colors } from '@/constants/theme';
import { useI18n, type MessageKey } from '@/i18n';

/** Flat illustrations for the onboarding pages, drawn on a shared 320×220 canvas. */

const W = 320;
const H = 220;

function Canvas({ children, labelKey }: { children: React.ReactNode; labelKey: MessageKey }) {
  const { t } = useI18n();
  return (
    <View style={styles.canvas} accessible accessibilityRole="image" accessibilityLabel={t(labelKey)}>
      <Svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`}>
        <Defs>
          <ClipPath id="frame">
            <Rect width={W} height={H} rx={24} />
          </ClipPath>
        </Defs>
        <G clipPath="url(#frame)">{children}</G>
      </Svg>
    </View>
  );
}

const PARK = '#CFE9DA';
const TREE = '#9ED2B6';

/** Page 1 — a city grid with your route, your car on it, and your driver. */
export function CityRouteScene() {
  const blocks: [number, number, number, number, string?][] = [
    [16, 16, 80, 64],
    [112, 16, 88, 64, PARK],
    [216, 16, 88, 64],
    [16, 96, 80, 44],
    [112, 96, 88, 44],
    [216, 96, 88, 44],
    [16, 156, 80, 48],
    [112, 156, 88, 48],
    [216, 156, 88, 48, PARK],
  ];
  const route = 'M40 148 H96 Q104 148 104 140 V96 Q104 88 112 88 H200 Q208 88 208 80 V50';

  return (
    <Canvas labelKey="onboarding.route.a11y">
      <Rect width={W} height={H} fill="#E4EEE8" />
      {blocks.map(([x, y, w, h, fill], i) => (
        <Rect key={i} x={x} y={y} width={w} height={h} rx={10} fill={fill ?? Colors.surface} />
      ))}
      <Circle cx={136} cy={42} r={10} fill={TREE} />
      <Circle cx={160} cy={58} r={12} fill={TREE} />
      <Circle cx={182} cy={36} r={8} fill={TREE} />
      <Circle cx={292} cy={174} r={8} fill={TREE} />

      <Path d={route} stroke={Colors.surface} strokeWidth={12} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <Path d={route} stroke={Colors.primary} strokeWidth={5} fill="none" strokeLinecap="round" strokeLinejoin="round" />

      <Circle cx={40} cy={148} r={7} fill={Colors.surface} stroke={Colors.text} strokeWidth={3} />

      <Path d="M208 50 C203 44 196 37 196 30 A12 12 0 1 1 220 30 C220 37 213 44 208 50 Z" fill={Colors.sun} />
      <Circle cx={208} cy={30} r={4.5} fill={Colors.surface} />

      <G transform="translate(156 88) rotate(90)">
        <Rect x={-11} y={-18} width={22} height={36} rx={7} fill={Colors.text} />
        <Rect x={-8} y={-10} width={16} height={7} rx={2.5} fill={Colors.primaryTint} />
        <Rect x={-8} y={7} width={16} height={5} rx={2} fill={Colors.primaryTint} />
      </G>

      <Rect x={150} y={155} width={150} height={52} rx={14} fill={Colors.text} opacity={0.06} />
      <Rect x={150} y={150} width={150} height={52} rx={14} fill={Colors.surface} />
      <Circle cx={176} cy={176} r={14} fill={Colors.primaryTint} />
      <Circle cx={176} cy={172} r={5} fill={Colors.primary} />
      <Path d="M167 186 C169 180 183 180 185 186" stroke={Colors.primary} strokeWidth={3.5} strokeLinecap="round" fill="none" />
      <Rect x={198} y={166} width={66} height={8} rx={4} fill={Colors.text} opacity={0.85} />
      <Rect x={198} y={180} width={44} height={7} rx={3.5} fill={Colors.borderStrong} />
      <Star cx={282} cy={170} r={7} />
    </Canvas>
  );
}

/** Page 2 — the same car, a driver at the wheel, from evening to daytime. */
export function DayNightScene() {
  return (
    <Canvas labelKey="onboarding.dayNight.a11y">
      <Rect x={0} y={0} width={160} height={H} fill={Colors.duskSoft} />
      <Rect x={160} y={0} width={160} height={H} fill={Colors.sunSoft} />

      <Circle cx={58} cy={50} r={18} fill={Colors.dusk} />
      <Circle cx={67} cy={43} r={16} fill={Colors.duskSoft} />
      {[
        [104, 34, 2],
        [126, 62, 1.6],
        [30, 88, 1.6],
        [96, 84, 2],
      ].map(([cx, cy, r], i) => (
        <Circle key={i} cx={cx} cy={cy} r={r} fill={Colors.dusk} opacity={0.55} />
      ))}

      <Circle cx={254} cy={50} r={17} fill={Colors.sun} />
      {Array.from({ length: 8 }, (_, i) => {
        const a = (i * Math.PI) / 4;
        return (
          <Line
            key={i}
            x1={254 + Math.cos(a) * 25}
            y1={50 + Math.sin(a) * 25}
            x2={254 + Math.cos(a) * 31}
            y2={50 + Math.sin(a) * 31}
            stroke={Colors.sun}
            strokeWidth={3}
            strokeLinecap="round"
          />
        );
      })}

      {[
        [10, 112, 30, 70],
        [44, 92, 26, 90],
        [74, 122, 34, 60],
        [112, 102, 28, 80],
        [140, 130, 20, 52],
      ].map(([x, y, w, h], i) => (
        <Rect key={i} x={x} y={y} width={w} height={h} rx={3} fill="#D4D5EE" />
      ))}
      {[
        [50, 104],
        [58, 120],
        [118, 114],
        [126, 132],
        [18, 126],
      ].map(([x, y], i) => (
        <Rect key={i} x={x} y={y} width={5} height={6} rx={1} fill={Colors.sun} opacity={0.75} />
      ))}
      {[
        [160, 120, 24, 62],
        [188, 98, 30, 84],
        [222, 126, 26, 56],
        [252, 106, 32, 76],
        [288, 124, 32, 58],
      ].map(([x, y, w, h], i) => (
        <Rect key={i} x={x} y={y} width={w} height={h} rx={3} fill="#F2DFBC" />
      ))}

      <Rect x={0} y={178} width={W} height={42} fill={Colors.border} />
      <Line x1={0} y1={202} x2={W} y2={202} stroke={Colors.surface} strokeWidth={3} strokeDasharray="14 10" />

      <Ellipse cx={160} cy={192} rx={66} ry={5} fill={Colors.text} opacity={0.08} />
      <Path d="M126 152 L140 129 Q143 125 148 125 H178 Q183 125 186 129 L200 152 Z" fill={Colors.primary} />
      <Rect x={104} y={150} width={112} height={32} rx={12} fill={Colors.primary} />
      <Path d="M135 150 L145 133 Q147 130 150 130 H158 V150 Z" fill={Colors.primaryTint} />
      <Path d="M163 150 V130 H176 Q179 130 181 133 L191 150 Z" fill={Colors.primaryTint} />
      <Circle cx={173} cy={141} r={5} fill={Colors.text} opacity={0.8} />
      <Rect x={207} y={160} width={9} height={6} rx={3} fill={Colors.sunSoft} />
      <Rect x={104} y={160} width={6} height={6} rx={2} fill={Colors.danger} opacity={0.8} />
      <Circle cx={133} cy={182} r={12} fill={Colors.text} />
      <Circle cx={133} cy={182} r={5} fill={Colors.borderStrong} />
      <Circle cx={188} cy={182} r={12} fill={Colors.text} />
      <Circle cx={188} cy={182} r={5} fill={Colors.borderStrong} />
    </Canvas>
  );
}

/** Page 3 — a live trip screen, a vetted-driver shield and a shared-trip card. */
export function TrustScene() {
  return (
    <Canvas labelKey="onboarding.trust.a11y">
      <Rect width={W} height={H} fill={Colors.primarySoft} />
      <Circle cx={160} cy={118} r={96} stroke={Colors.primaryTint} strokeWidth={1.5} fill="none" />
      <Circle cx={160} cy={118} r={66} stroke={Colors.primaryTint} strokeWidth={1.5} fill="none" />

      <Rect x={100} y={24} width={120} height={220} rx={20} fill={Colors.text} opacity={0.06} />
      <Rect x={100} y={18} width={120} height={220} rx={20} fill={Colors.surface} />
      <Rect x={110} y={30} width={100} height={72} rx={12} fill={Colors.surfaceAlt} />
      <Path d="M122 90 C140 90 140 58 160 60 S186 46 198 44" stroke={Colors.primaryTint} strokeWidth={4} strokeLinecap="round" fill="none" />
      <Path d="M122 90 C140 90 140 58 160 60" stroke={Colors.primary} strokeWidth={4} strokeLinecap="round" fill="none" />
      <Circle cx={122} cy={90} r={4} fill={Colors.text} />
      <Circle cx={160} cy={60} r={5.5} fill={Colors.surface} stroke={Colors.primary} strokeWidth={3} />
      <Circle cx={198} cy={44} r={5} fill={Colors.sun} />

      <Circle cx={124} cy={124} r={12} fill={Colors.primaryTint} />
      <Circle cx={124} cy={121} r={4.5} fill={Colors.primary} />
      <Path d="M116.5 132 C118 127 130 127 131.5 132" stroke={Colors.primary} strokeWidth={3} strokeLinecap="round" fill="none" />
      <Rect x={142} y={116} width={50} height={7} rx={3.5} fill={Colors.text} opacity={0.85} />
      <Rect x={142} y={128} width={34} height={6} rx={3} fill={Colors.borderStrong} />
      <Star cx={202} cy={120} r={5} />

      <Rect x={110} y={150} width={100} height={24} rx={12} fill={Colors.primary} />
      <Rect x={138} y={160} width={44} height={4} rx={2} fill={Colors.surface} opacity={0.9} />
      <Rect x={110} y={186} width={100} height={6} rx={3} fill={Colors.surfaceAlt} />
      <Rect x={110} y={198} width={70} height={6} rx={3} fill={Colors.surfaceAlt} />

      <Path d="M62 86 L88 96 V116 C88 133 77 144 62 150 C47 144 36 133 36 116 V96 Z" fill={Colors.primary} />
      <Path d="M51 117 L59 125 L74 109" stroke={Colors.surface} strokeWidth={4.5} strokeLinecap="round" strokeLinejoin="round" fill="none" />

      <Rect x={228} y={133} width={80} height={46} rx={13} fill={Colors.text} opacity={0.06} />
      <Rect x={228} y={128} width={80} height={46} rx={13} fill={Colors.surface} />
      <Circle cx={248} cy={151} r={11} fill={Colors.sunSoft} />
      <Circle cx={244} cy={151} r={2.5} fill={Colors.sun} />
      <Circle cx={252} cy={146} r={2.5} fill={Colors.sun} />
      <Circle cx={252} cy={156} r={2.5} fill={Colors.sun} />
      <Path d="M244 151 L252 146 M244 151 L252 156" stroke={Colors.sun} strokeWidth={1.6} />
      <Rect x={264} y={144} width={34} height={6} rx={3} fill={Colors.text} opacity={0.85} />
      <Rect x={264} y={155} width={24} height={5} rx={2.5} fill={Colors.borderStrong} />
    </Canvas>
  );
}

function Star({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  const pts = Array.from({ length: 10 }, (_, i) => {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 === 0 ? r : r * 0.45;
    return `${(cx + Math.cos(a) * rr).toFixed(2)},${(cy + Math.sin(a) * rr).toFixed(2)}`;
  });
  return <Path d={`M${pts.join(' L')} Z`} fill={Colors.sun} />;
}

const styles = StyleSheet.create({
  canvas: {
    width: '100%',
    maxWidth: 400,
    aspectRatio: W / H,
    alignSelf: 'center',
  },
});
