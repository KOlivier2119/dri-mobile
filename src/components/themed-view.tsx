import { View, type ViewProps } from 'react-native';

import { Colors } from '@/constants/theme';

export type ThemedViewProps = ViewProps & {
  type?: 'background' | 'backgroundElement' | 'backgroundSelected' | 'text' | 'textSecondary';
};

const typeColors = {
  background: Colors.bg,
  backgroundElement: Colors.surface,
  backgroundSelected: Colors.surfaceAlt,
  text: Colors.text,
  textSecondary: Colors.textDim,
} as const;

export function ThemedView({ style, type, ...otherProps }: ThemedViewProps) {
  return <View style={[{ backgroundColor: typeColors[type ?? 'background'] }, style]} {...otherProps} />;
}
