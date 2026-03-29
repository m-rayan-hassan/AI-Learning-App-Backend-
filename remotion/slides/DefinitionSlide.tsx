import React from 'react';
import { useCurrentFrame, interpolate, spring, useVideoConfig } from 'remotion';
import { theme, SLIDE_WIDTH, SLIDE_HEIGHT } from '../theme';
import type { ThemeColors } from '../theme';
import { DynamicBackground } from '../components/DynamicBackground';

interface DefinitionSlideProps {
  term: string;
  definition: string;
  example?: string;
  themeColors: ThemeColors;
}

export const DefinitionSlide: React.FC<DefinitionSlideProps> = ({ term, definition, example, themeColors }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Card entrance
  const cardSpring = spring({ frame, fps, config: { damping: 14, stiffness: 70 } });
  const cardOpacity = interpolate(cardSpring, [0, 1], [0, 1]);
  const cardScale = interpolate(cardSpring, [0, 1], [0.9, 1]);

  // Term reveal
  const termSpring = spring({ frame: frame - 8, fps, config: { damping: 14, stiffness: 80 } });
  const termOpacity = interpolate(termSpring, [0, 1], [0, 1]);
  const termY = interpolate(termSpring, [0, 1], [30, 0]);

  // Definition reveal
  const defSpring = spring({ frame: frame - 20, fps, config: { damping: 14, stiffness: 80 } });
  const defOpacity = interpolate(defSpring, [0, 1], [0, 1]);
  const defY = interpolate(defSpring, [0, 1], [20, 0]);

  // Example reveal
  const exSpring = spring({ frame: frame - 35, fps, config: { damping: 14, stiffness: 80 } });
  const exOpacity = interpolate(exSpring, [0, 1], [0, 1]);
  const exY = interpolate(exSpring, [0, 1], [15, 0]);

  const cardBg = themeColors.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.7)';
  const cardBorder = themeColors.isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(255,255,255,0.8)';
  const exBg = themeColors.isDark ? `${themeColors.primary}12` : `${themeColors.primary}08`;

  return (
    <div
      style={{
        boxSizing: 'border-box',
        width: SLIDE_WIDTH,
        height: SLIDE_HEIGHT,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: theme.fonts.heading,
      }}
    >
      <DynamicBackground themeColors={themeColors} />

      {/* Dictionary-style card */}
      <div
        style={{
          position: 'relative',
          zIndex: 10,
          background: cardBg,
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: cardBorder,
          borderRadius: theme.borderRadius.xl,
          padding: `${theme.spacing.xl}px ${theme.spacing.xxl}px`,
          width: '80%',
          maxWidth: 950,
          boxShadow: theme.shadow.elevated,
          opacity: cardOpacity,
          transform: `scale(${cardScale})`,
        }}
      >
        {/* Top accent line */}
        <div
          style={{
            width: 80,
            height: 5,
            background: themeColors.gradientPrimary,
            borderRadius: theme.borderRadius.pill,
            marginBottom: theme.spacing.lg,
          }}
        />

        {/* Term */}
        <h1
          style={{
            fontSize: term.length > 25 ? theme.fontSize.h1 : theme.fontSize.hero,
            fontWeight: 900,
            color: themeColors.textPrimary,
            opacity: termOpacity,
            transform: `translateY(${termY}px)`,
            lineHeight: 1.1,
            letterSpacing: -2,
            margin: 0,
            marginBottom: theme.spacing.xs,
          }}
        >
          {term}
        </h1>

        {/* Part of speech style label */}
        <span
          style={{
            fontSize: theme.fontSize.small,
            fontWeight: 600,
            color: themeColors.primary,
            fontStyle: 'italic',
            fontFamily: theme.fonts.body,
            opacity: termOpacity,
            display: 'block',
            marginBottom: theme.spacing.lg,
          }}
        >
          noun / concept
        </span>

        {/* Definition */}
        <p
          style={{
            fontSize: theme.fontSize.bodyLarge,
            color: themeColors.textSecondary,
            opacity: defOpacity,
            transform: `translateY(${defY}px)`,
            margin: 0,
            lineHeight: 1.6,
            fontFamily: theme.fonts.body,
            fontWeight: 500,
            paddingLeft: theme.spacing.md,
            borderLeft: `4px solid ${themeColors.primary}40`,
          }}
        >
          {definition}
        </p>

        {/* Example */}
        {example && (
          <div
            style={{
              marginTop: theme.spacing.lg,
              opacity: exOpacity,
              transform: `translateY(${exY}px)`,
              background: exBg,
              padding: `${theme.spacing.md}px ${theme.spacing.lg}px`,
              borderRadius: theme.borderRadius.lg,
              border: `1px solid ${themeColors.primary}20`,
            }}
          >
            <span
              style={{
                fontSize: theme.fontSize.caption,
                fontWeight: 700,
                color: themeColors.primary,
                textTransform: 'uppercase',
                letterSpacing: 2,
                display: 'block',
                marginBottom: theme.spacing.xs,
              }}
            >
              Example
            </span>
            <p
              style={{
                fontSize: theme.fontSize.body,
                color: themeColors.textSecondary,
                margin: 0,
                lineHeight: 1.5,
                fontFamily: theme.fonts.body,
                fontStyle: 'italic',
              }}
            >
              {example}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
