import { StyleSheet, Text, useWindowDimensions, type StyleProp, type TextProps, type TextStyle } from 'react-native';

import { Colors, Fonts } from '@/constants/theme';

export type ThemedTextProps = TextProps & {
  type?:
    | 'default'
    | 'display'
    | 'title'
    | 'subtitle'
    | 'body'
    | 'caption'
    | 'label'
    | 'overline'
    | 'small';
  color?: string;
};

/** Headings shrink on narrow phones (down to 86% at 320pt) so they keep their line breaks. */
const SCALED = new Set(['display', 'title']);

export function ThemedText({
  style,
  type = 'body',
  color,
  maxFontSizeMultiplier = 1.35,
  ...rest
}: ThemedTextProps) {
  const { width } = useWindowDimensions();
  const base: StyleProp<TextStyle> = [styles[type], color ? { color } : null, style];

  let scaled: object | undefined;
  if (SCALED.has(type) && width < 390) {
    const factor = Math.max(0.86, width / 390);
    const { fontSize, lineHeight } = StyleSheet.flatten<TextStyle>(base);
    if (fontSize) {
      scaled = {
        fontSize: Math.round(fontSize * factor),
        lineHeight: lineHeight ? Math.round(lineHeight * factor) : undefined,
      };
    }
  }

  return <Text maxFontSizeMultiplier={maxFontSizeMultiplier} style={[base, scaled]} {...rest} />;
}

const styles = StyleSheet.create({
  default: { fontFamily: Fonts.regular, color: Colors.text },
  display: { fontFamily: Fonts.bold, fontSize: 40, lineHeight: 44, letterSpacing: -1, color: Colors.text },
  title: { fontFamily: Fonts.bold, fontSize: 30, lineHeight: 36, letterSpacing: -0.6, color: Colors.text },
  subtitle: { fontFamily: Fonts.semibold, fontSize: 19, lineHeight: 25, letterSpacing: -0.2, color: Colors.text },
  body: { fontFamily: Fonts.regular, fontSize: 16, lineHeight: 24, color: Colors.text },
  caption: { fontFamily: Fonts.regular, fontSize: 14, lineHeight: 20, color: Colors.textDim },
  label: { fontFamily: Fonts.medium, fontSize: 13, lineHeight: 18, color: Colors.textDim },
  overline: {
    fontFamily: Fonts.semibold,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: Colors.primary,
  },
  small: { fontFamily: Fonts.medium, fontSize: 13, lineHeight: 18, color: Colors.text },
});
