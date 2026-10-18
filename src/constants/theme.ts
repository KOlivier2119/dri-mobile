import { Platform } from 'react-native';

export const Colors = {
  ink: '#111713',
  inkSurface: '#1A211C',
  inkSurfaceHi: '#222B25',
  inkBorder: '#2E3931',
  emerald: '#0FA473',
  emeraldDeep: '#0B7A56',
  mint: '#5EE7BB',
  mintSoft: 'rgba(94, 231, 187, 0.14)',
  warm: '#F6F3EC',
  warmDim: 'rgba(246, 243, 236, 0.62)',
  warmFaint: 'rgba(246, 243, 236, 0.38)',
  danger: '#FF7A6B',
  focus: '#3ECF9A',
} as const;

const geist = (weight: '400' | '500' | '600' | '700') =>
  Platform.select({ web: `var(--font-geist-${weight})`, default: `Geist_${weight}` });

export const Fonts = {
  regular: geist('400'),
  medium: geist('500'),
  semibold: geist('600'),
  bold: geist('700'),
} as const;

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 48,
  seven: 64,
} as const;

export const Radius = {
  field: 14,
  card: 20,
  pill: 999,
} as const;

export const BottomTabInset = 0;
export const MaxContentWidth = 520;
