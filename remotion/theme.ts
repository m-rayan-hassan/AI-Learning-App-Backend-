/**
 * Design tokens used across all slide templates.
 * Single source of truth for colors, fonts, spacing, gradients.
 */

export const theme = {
  colors: {
    // Primary palette — light, clean and modern
    bg: '#f8fafc',
    bgCard: '#ffffff',
    bgCardAlt: '#f1f5f9',
    
    // Accent colors
    primary: '#4f46e5', // Indigo
    primaryLight: '#818cf8',
    secondary: '#0ea5e9', // Sky blue
    secondaryLight: '#7dd3fc',
    accent: '#f43f5e', // Rose
    accentLight: '#fb7185',
    
    // Text
    textPrimary: '#0f172a',
    textSecondary: '#475569',
    textMuted: '#94a3b8',
    
    // Utility
    divider: 'rgba(0, 0, 0, 0.06)',
    overlay: 'rgba(255, 255, 255, 0.85)',
    
    // Gradients
    gradientPrimary: 'linear-gradient(135deg, #4f46e5 0%, #818cf8 100%)',
    gradientSecondary: 'linear-gradient(135deg, #0ea5e9 0%, #7dd3fc 100%)',
    gradientAccent: 'linear-gradient(135deg, #f43f5e 0%, #fb7185 100%)',
    gradientBg: 'linear-gradient(160deg, #f8fafc 0%, #e2e8f0 50%, #f8fafc 100%)',
    gradientCard: 'linear-gradient(145deg, #ffffff 0%, #f1f5f9 100%)',
  },
  
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
