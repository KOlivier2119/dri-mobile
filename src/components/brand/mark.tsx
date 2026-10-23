import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from 'react-native-svg';

import { Colors, Fonts } from '@/constants/theme';

type Props = { size?: number };

/** The DRI route mark: an origin dot, a winding route and the destination ring. */
export function BrandMark({ size = 96 }: Props) {
  return (
    <View style={{ width: size, height: size }} accessibilityElementsHidden>
      <Svg width={size} height={size} viewBox="0 0 100 100">
        <Defs>
          <LinearGradient id="dri-route" x1="0.2" y1="0.8" x2="0.8" y2="0.2">
            <Stop offset="0" stopColor={Colors.primary} />
            <Stop offset="1" stopColor={Colors.primaryBright} />
          </LinearGradient>
        </Defs>
        <Path
          d="M24 76 C36 76 40 67 44 56 S48 47 51 47 S57 43 61 33 S68 24 76 24"
          stroke="url(#dri-route)"
          strokeWidth={8}
          strokeLinecap="round"
          fill="none"
        />
        <Circle cx={76} cy={24} r={11} stroke={Colors.primaryBright} strokeWidth={4.5} fill="none" />
        <Circle cx={24} cy={76} r={6.5} fill={Colors.text} />
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
