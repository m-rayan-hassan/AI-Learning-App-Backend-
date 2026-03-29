/**
 * Design tokens used across all slide templates.
 * Content-adaptive theme palette system — the LLM picks the best palette
 * based on the document topic, and every slide renders in that palette.
 */

/* ───────── Color Palette Definitions ───────── */

interface ThemeColors {
  bg: string;
  bgCard: string;
  bgCardAlt: string;
  primary: string;
  primaryLight: string;
  secondary: string;
  secondaryLight: string;
  accent: string;
  accentLight: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  divider: string;
  overlay: string;
  gradientPrimary: string;
  gradientSecondary: string;
  gradientAccent: string;
  gradientBg: string;
  gradientCard: string;
  /** Dark mode flag — affects text-on-bg calculations */
  isDark: boolean;
}

const palettes: Record<string, ThemeColors> = {
  /* ── 1. Tech / Dark  ── Midnight + Electric Purple */
  tech: {
    bg: '#0f0f1a',
    bgCard: 'rgba(255,255,255,0.06)',
    bgCardAlt: 'rgba(255,255,255,0.03)',
    primary: '#8b5cf6',
    primaryLight: '#a78bfa',
    secondary: '#06b6d4',
    secondaryLight: '#67e8f9',
    accent: '#f472b6',
    accentLight: '#f9a8d4',
    textPrimary: '#f1f5f9',
    textSecondary: '#94a3b8',
    textMuted: '#475569',
    divider: 'rgba(255,255,255,0.08)',
    overlay: 'rgba(0,0,0,0.5)',
    gradientPrimary: 'linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%)',
    gradientSecondary: 'linear-gradient(135deg, #06b6d4 0%, #67e8f9 100%)',
    gradientAccent: 'linear-gradient(135deg, #f472b6 0%, #f9a8d4 100%)',
    gradientBg: 'linear-gradient(160deg, #0f0f1a 0%, #1e1b4b 50%, #0f0f1a 100%)',
    gradientCard: 'linear-gradient(145deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%)',
    isDark: true,
  },

  /* ── 2. Science / Green ── */
  science: {
    bg: '#f0fdf4',
    bgCard: '#ffffff',
    bgCardAlt: '#ecfdf5',
    primary: '#059669',
    primaryLight: '#34d399',
    secondary: '#0891b2',
    secondaryLight: '#67e8f9',
    accent: '#d97706',
    accentLight: '#fbbf24',
    textPrimary: '#064e3b',
    textSecondary: '#374151',
    textMuted: '#9ca3af',
    divider: 'rgba(0,0,0,0.06)',
    overlay: 'rgba(255,255,255,0.85)',
    gradientPrimary: 'linear-gradient(135deg, #059669 0%, #34d399 100%)',
    gradientSecondary: 'linear-gradient(135deg, #0891b2 0%, #67e8f9 100%)',
    gradientAccent: 'linear-gradient(135deg, #d97706 0%, #fbbf24 100%)',
    gradientBg: 'linear-gradient(160deg, #f0fdf4 0%, #d1fae5 50%, #f0fdf4 100%)',
    gradientCard: 'linear-gradient(145deg, #ffffff 0%, #ecfdf5 100%)',
    isDark: false,
  },

  /* ── 3. Business / Blue ── */
  business: {
    bg: '#f8fafc',
    bgCard: '#ffffff',
    bgCardAlt: '#f1f5f9',
    primary: '#1d4ed8',
    primaryLight: '#60a5fa',
    secondary: '#0f766e',
    secondaryLight: '#5eead4',
    accent: '#dc2626',
    accentLight: '#f87171',
    textPrimary: '#0f172a',
    textSecondary: '#475569',
    textMuted: '#94a3b8',
    divider: 'rgba(0,0,0,0.06)',
    overlay: 'rgba(255,255,255,0.85)',
    gradientPrimary: 'linear-gradient(135deg, #1d4ed8 0%, #60a5fa 100%)',
    gradientSecondary: 'linear-gradient(135deg, #0f766e 0%, #5eead4 100%)',
    gradientAccent: 'linear-gradient(135deg, #dc2626 0%, #f87171 100%)',
    gradientBg: 'linear-gradient(160deg, #f8fafc 0%, #dbeafe 50%, #f8fafc 100%)',
    gradientCard: 'linear-gradient(145deg, #ffffff 0%, #f1f5f9 100%)',
    isDark: false,
  },

  /* ── 4. Creative / Warm ── Sunset tones */
  creative: {
    bg: '#fffbeb',
    bgCard: '#ffffff',
    bgCardAlt: '#fef3c7',
    primary: '#ea580c',
    primaryLight: '#fb923c',
    secondary: '#db2777',
    secondaryLight: '#f472b6',
    accent: '#7c3aed',
    accentLight: '#a78bfa',
    textPrimary: '#1c1917',
    textSecondary: '#57534e',
    textMuted: '#a8a29e',
    divider: 'rgba(0,0,0,0.06)',
    overlay: 'rgba(255,255,255,0.85)',
    gradientPrimary: 'linear-gradient(135deg, #ea580c 0%, #fb923c 100%)',
    gradientSecondary: 'linear-gradient(135deg, #db2777 0%, #f472b6 100%)',
    gradientAccent: 'linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%)',
    gradientBg: 'linear-gradient(160deg, #fffbeb 0%, #fed7aa 50%, #fffbeb 100%)',
    gradientCard: 'linear-gradient(145deg, #ffffff 0%, #fef3c7 100%)',
    isDark: false,
  },

  /* ── 5. Medical / Teal ── */
  medical: {
    bg: '#f0fdfa',
    bgCard: '#ffffff',
    bgCardAlt: '#ccfbf1',
    primary: '#0d9488',
    primaryLight: '#2dd4bf',
    secondary: '#4f46e5',
    secondaryLight: '#818cf8',
    accent: '#e11d48',
    accentLight: '#fb7185',
    textPrimary: '#134e4a',
    textSecondary: '#374151',
    textMuted: '#9ca3af',
    divider: 'rgba(0,0,0,0.06)',
    overlay: 'rgba(255,255,255,0.85)',
    gradientPrimary: 'linear-gradient(135deg, #0d9488 0%, #2dd4bf 100%)',
    gradientSecondary: 'linear-gradient(135deg, #4f46e5 0%, #818cf8 100%)',
    gradientAccent: 'linear-gradient(135deg, #e11d48 0%, #fb7185 100%)',
    gradientBg: 'linear-gradient(160deg, #f0fdfa 0%, #99f6e4 50%, #f0fdfa 100%)',
    gradientCard: 'linear-gradient(145deg, #ffffff 0%, #ccfbf1 100%)',
    isDark: false,
  },

  /* ── 6. History / Sepia ── Warm, elegant, parchment-like */
  history: {
    bg: '#fefce8',
    bgCard: '#fffef5',
    bgCardAlt: '#fef9c3',
    primary: '#92400e',
    primaryLight: '#d97706',
    secondary: '#7c2d12',
    secondaryLight: '#ea580c',
    accent: '#166534',
    accentLight: '#22c55e',
    textPrimary: '#1c1917',
    textSecondary: '#57534e',
    textMuted: '#a8a29e',
    divider: 'rgba(0,0,0,0.06)',
    overlay: 'rgba(255,255,255,0.85)',
    gradientPrimary: 'linear-gradient(135deg, #92400e 0%, #d97706 100%)',
    gradientSecondary: 'linear-gradient(135deg, #7c2d12 0%, #ea580c 100%)',
    gradientAccent: 'linear-gradient(135deg, #166534 0%, #22c55e 100%)',
    gradientBg: 'linear-gradient(160deg, #fefce8 0%, #fde68a 50%, #fefce8 100%)',
    gradientCard: 'linear-gradient(145deg, #fffef5 0%, #fef9c3 100%)',
    isDark: false,
  },

  /* ── 7. Math / Purple ── */
  math: {
    bg: '#faf5ff',
    bgCard: '#ffffff',
    bgCardAlt: '#f3e8ff',
    primary: '#7c3aed',
    primaryLight: '#a78bfa',
    secondary: '#2563eb',
    secondaryLight: '#60a5fa',
    accent: '#e11d48',
    accentLight: '#fb7185',
    textPrimary: '#1e1b4b',
    textSecondary: '#4b5563',
    textMuted: '#9ca3af',
    divider: 'rgba(0,0,0,0.06)',
    overlay: 'rgba(255,255,255,0.85)',
    gradientPrimary: 'linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%)',
    gradientSecondary: 'linear-gradient(135deg, #2563eb 0%, #60a5fa 100%)',
    gradientAccent: 'linear-gradient(135deg, #e11d48 0%, #fb7185 100%)',
    gradientBg: 'linear-gradient(160deg, #faf5ff 0%, #e9d5ff 50%, #faf5ff 100%)',
    gradientCard: 'linear-gradient(145deg, #ffffff 0%, #f3e8ff 100%)',
    isDark: false,
  },

  /* ── 8. Default / Indigo (Original) ── */
  default: {
    bg: '#f8fafc',
    bgCard: '#ffffff',
    bgCardAlt: '#f1f5f9',
    primary: '#4f46e5',
    primaryLight: '#818cf8',
    secondary: '#0ea5e9',
    secondaryLight: '#7dd3fc',
    accent: '#f43f5e',
    accentLight: '#fb7185',
    textPrimary: '#0f172a',
    textSecondary: '#475569',
    textMuted: '#94a3b8',
    divider: 'rgba(0,0,0,0.06)',
    overlay: 'rgba(255,255,255,0.85)',
    gradientPrimary: 'linear-gradient(135deg, #4f46e5 0%, #818cf8 100%)',
    gradientSecondary: 'linear-gradient(135deg, #0ea5e9 0%, #7dd3fc 100%)',
    gradientAccent: 'linear-gradient(135deg, #f43f5e 0%, #fb7185 100%)',
    gradientBg: 'linear-gradient(160deg, #f8fafc 0%, #e2e8f0 50%, #f8fafc 100%)',
    gradientCard: 'linear-gradient(145deg, #ffffff 0%, #f1f5f9 100%)',
    isDark: false,
  },
};

/** Resolve a theme name to a colors object. Falls back to 'default'. */
export const getTheme = (name?: string): ThemeColors => {
  if (!name) return palettes.default;
  return palettes[name.toLowerCase()] || palettes.default;
};

export type { ThemeColors };

/** All available palette names — for LLM prompt reference */
export const THEME_NAMES = Object.keys(palettes);

/* ───────── Layout-Agnostic Design Tokens ───────── */

export const theme = {
  fonts: {
    heading: '"Plus Jakarta Sans", "Inter", -apple-system, sans-serif',
    body: '"Inter", -apple-system, sans-serif',
    mono: '"JetBrains Mono", "Fira Code", monospace',
  },

  fontSize: {
    hero: 64,
    h1: 48,
    h2: 36,
    h3: 28,
    body: 22,
    bodyLarge: 26,
    small: 18,
    caption: 14,
  },

  spacing: {
    xs: 8,
    sm: 16,
    md: 24,
    lg: 40,
    xl: 64,
    xxl: 96,
  },

  borderRadius: {
    sm: 8,
    md: 12,
    lg: 20,
    xl: 28,
    pill: 999,
  },

  shadow: {
    card: '0 4px 16px rgba(0, 0, 0, 0.05)',
    elevated: '0 12px 40px rgba(0, 0, 0, 0.08)',
    glow: '0 0 40px rgba(79, 70, 229, 0.15)',
  },
} as const;

/** Slide dimensions (720p) */
export const SLIDE_WIDTH = 1280;
export const SLIDE_HEIGHT = 720;
export const FPS = 30;

/** Helper: compute slide duration in frames from seconds */
export const secondsToFrames = (seconds: number): number => Math.ceil(seconds * FPS);

/** Transition duration in frames (0.5s) */
export const TRANSITION_FRAMES = 15;
