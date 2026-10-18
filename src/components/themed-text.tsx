import { StyleSheet, Text, type TextProps } from 'react-native';

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

export function ThemedText({ style, type = 'body', color, ...rest }: ThemedTextProps) {
  return (
    <Text
      style={[{ color: color ?? Colors.warm }, type && styles[type], style]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  default: { fontFamily: Fonts.regular, color: Colors.warm },
  display: { fontFamily: Fonts.bold, fontSize: 40, lineHeight: 44, letterSpacing: -1, color: Colors.warm },
  title: { fontFamily: Fonts.bold, fontSize: 30, lineHeight: 36, letterSpacing: -0.6, color: Colors.warm },
  subtitle: { fontFamily: Fonts.semibold, fontSize: 21, lineHeight: 28, letterSpacing: -0.3, color: Colors.warm },
  body: { fontFamily: Fonts.regular, fontSize: 16, lineHeight: 24, color: Colors.warm },
  caption: { fontFamily: Fonts.regular, fontSize: 14, lineHeight: 20, color: Colors.warmDim },
  label: { fontFamily: Fonts.medium, fontSize: 13, lineHeight: 18, color: Colors.warmDim },
  overline: {
    fontFamily: Fonts.semibold,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    color: Colors.mint,
  },
  small: { fontFamily: Fonts.medium, fontSize: 13, lineHeight: 18, color: Colors.warm },
});
