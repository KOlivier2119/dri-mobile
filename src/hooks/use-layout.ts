import { useWindowDimensions } from 'react-native';

import { Spacing } from '@/constants/theme';

/**
 * Width/height buckets shared by every screen so small phones (320–359pt),
 * regular phones and short screens (SE-class, landscape-ish web) all get
 * proportionate gutters instead of one fixed 24pt inset.
 */
export function useLayout() {
  const { width, height } = useWindowDimensions();
  const compact = width < 360;
  const short = height < 700;
  const gutter = compact ? Spacing.three : width < 400 ? 20 : Spacing.four;
  return { width, height, compact, short, gutter };
}
