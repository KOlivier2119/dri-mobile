import { Platform } from 'react-native';

/**
 * Light palette: warm paper background, white cards, deep emerald for action,
 * amber reserved for night/rating accents. Text tokens all pass WCAG AA on
 * both `bg` and `surface`.
 */
export const Colors = {
  bg: '#F6F5F0',
  surface: '#FFFFFF',
  surfaceAlt: '#EFEEE7',
  border: '#E3E1D8',
  borderStrong: '#CBC8BC',

  text: '#14201A',
  textDim: '#56605A',
  textFaint: '#6C756F',

  primary: '#0B7A57',
  primaryPressed: '#09664A',
  primaryBright: '#16A575',
  primarySoft: '#E3F3EA',
  primaryTint: '#BFE5D1',
  onPrimary: '#FFFFFF',

  sun: '#E9A23B',
  sunSoft: '#FCF0DA',
  dusk: '#5B5FA8',
  duskSoft: '#E8E8F6',

  danger: '#C2392F',
  dangerSoft: '#FBE8E5',

  scrim: 'rgba(20, 32, 26, 0.38)',

  // Dark surfaces: photo overlays and the BOB Night card. Text on them uses
  // onNight / onNightDim (AA on `night`).
  night: '#0D1914',
  nightRaised: '#16261F',
  onNight: '#FFFFFF',
  onNightDim: 'rgba(255, 255, 255, 0.74)',
  glass: 'rgba(255, 255, 255, 0.16)',
  glassBorder: 'rgba(255, 255, 255, 0.28)',
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

/** Soft, low-spread elevation for white cards on the paper background. */
export const Shadow = Platform.select({
  web: { boxShadow: '0 1px 2px rgba(20,32,26,0.05), 0 4px 16px rgba(20,32,26,0.05)' },
  default: {
    shadowColor: '#14201A',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
}) as object;

/** Deeper lift for floating cards and photo tiles. */
export const ShadowLifted = Platform.select({
  web: { boxShadow: '0 2px 6px rgba(20,32,26,0.06), 0 14px 32px rgba(20,32,26,0.10)' },
  default: {
    shadowColor: '#14201A',
    shadowOpacity: 0.12,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
}) as object;

export const BottomTabInset = 0;
export const MaxContentWidth = 520;
