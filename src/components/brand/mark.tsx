import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

import { Colors, Fonts } from '@/constants/theme';

type Props = { size?: number };

/** The DRI route mark — identical artwork to the native splash image. */
export function BrandMark({ size = 96 }: Props) {
  return (
    <View style={{ width: size, height: size }} accessibilityElementsHidden>
      <Image
        source={require('@/assets/images/dri-mark.png')}
        style={{ width: size, height: size }}
        contentFit="contain"
        accessibilityLabel="DRI route mark"
      />
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
    fontFamily: Fonts.semibold,
    fontWeight: '700',
    color: Colors.warm,
  },
});
