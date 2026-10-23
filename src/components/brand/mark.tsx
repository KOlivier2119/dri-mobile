import { useId } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, Mask, Path, Rect } from 'react-native-svg';

import { Colors, Fonts } from '@/constants/theme';

type Props = { size?: number; color?: string };

/**
 * The DRI glyph: a location pin (a driver comes to you) with a steering wheel
 * cut out of it. One solid shape, so it holds up from app icon down to 16px.
 * Source artwork: assets/brand/dri-mark.svg.
 */
export function BrandMark({ size = 96, color = Colors.primary }: Props) {
  // mask ids are document-global on web
  const id = `dri-wheel-${useId().replace(/:/g, '')}`;
  return (
    <View style={{ width: size, height: size }} accessibilityElementsHidden>
      <Svg width={size} height={size} viewBox="0 0 100 100">
        <Defs>
          <Mask id={id} maskUnits="userSpaceOnUse" x="0" y="0" width="100" height="100">
            <Path d="M50 93 C46 88.5 17 66 17 41 A33 33 0 0 1 83 41 C83 66 54 88.5 50 93 Z" fill="#fff" />
            <Circle cx={50} cy={41} r={18} fill="none" stroke="#000" strokeWidth={6.2} />
            <Circle cx={50} cy={41} r={7.4} fill="#000" />
            <Rect x={32} y={37.9} width={36} height={6.2} rx={0.6} fill="#000" />
            <Rect x={46.9} y={41} width={6.2} height={18} rx={0.6} fill="#000" />
          </Mask>
        </Defs>
        <Rect width={100} height={100} fill={color} mask={`url(#${id})`} />
      </Svg>
    </View>
  );
}

export function Wordmark({ style, size = 30 }: { style?: object; size?: number }) {
  return (
    <Text
      style={[
        styles.word,
        { fontSize: size, lineHeight: size * 1.25, letterSpacing: size * 0.32 },
        style as object,
      ]}
      accessibilityLabel="DRI">
      DRI
    </Text>
  );
}

const styles = StyleSheet.create({
  word: {
    fontFamily: Fonts.bold,
    color: Colors.text,
  },
});
