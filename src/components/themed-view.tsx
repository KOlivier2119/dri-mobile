import { View, type ViewProps } from 'react-native';

import { Colors } from '@/constants/theme';

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
  type?: 'background' | 'backgroundElement' | 'backgroundSelected' | 'text' | 'textSecondary';
};

const typeColors = {
  background: Colors.ink,
  backgroundElement: Colors.inkSurface,
  backgroundSelected: Colors.inkSurfaceHi,
  text: Colors.warm,
  textSecondary: Colors.warmDim,
} as const;

export function ThemedView({ style, type, ...otherProps }: ThemedViewProps) {
  return <View style={[{ backgroundColor: typeColors[type ?? 'background'] }, style]} {...otherProps} />;
}
