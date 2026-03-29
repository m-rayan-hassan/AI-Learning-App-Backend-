import React from 'react';
import { useCurrentFrame, interpolate, spring, useVideoConfig } from 'remotion';
import { theme, SLIDE_WIDTH, SLIDE_HEIGHT } from '../theme';
import type { ThemeColors } from '../theme';
import { DynamicBackground } from '../components/DynamicBackground';

interface Level {
  label: string;
  description?: string;
}

interface PyramidSlideProps {
  title: string;
  levels: Level[]; // Bottom to top
  themeColors: ThemeColors;
}

export const PyramidSlide: React.FC<PyramidSlideProps> = ({ title, levels, themeColors }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleSpring = spring({ frame, fps, config: { damping: 14, stiffness: 80 } });
  const titleOpacity = interpolate(titleSpring, [0, 1], [0, 1]);
  const titleY = interpolate(titleSpring, [0, 1], [40, 0]);

  const safeLevels = levels.slice(0, 5);
  const count = safeLevels.length;
  // Reverse so index 0 = top (narrowest), last = bottom (widest)
  const reversed = [...safeLevels].reverse();

  const pyramidHeight = 420;
  const levelHeight = pyramidHeight / count;
  const minWidth = 180;
  const maxWidth = 900;

  const cardBorder = themeColors.isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(255,255,255,0.9)';

  // Gradient from primary to accent across layers
  const layerColors = [
    themeColors.primary,
    themeColors.secondary,
    themeColors.accent,
    themeColors.primaryLight,
    themeColors.secondaryLight,
  ];

  return (
    <div
      style={{
        boxSizing: 'border-box',
        width: SLIDE_WIDTH,
        height: SLIDE_HEIGHT,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: `${theme.spacing.lg}px ${theme.spacing.xl}px`,
        position: 'relative',
        overflow: 'hidden',
        fontFamily: theme.fonts.heading,
      }}
    >
      <DynamicBackground themeColors={themeColors} />

      <h2
        style={{
          position: 'relative',
          zIndex: 10,
          fontSize: title.length > 40 ? theme.fontSize.h2 : theme.fontSize.hero * 0.75,
          fontWeight: 800,
          color: themeColors.textPrimary,
          opacity: titleOpacity,
          transform: `translateY(${titleY}px)`,
          textAlign: 'center',
          letterSpacing: -1,
          margin: 0,
          marginBottom: theme.spacing.lg,
        }}
      >
        {title}
      </h2>

      <div
        style={{
          position: 'relative',
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 6,
          flex: 1,
          justifyContent: 'center',
        }}
      >
        {reversed.map((level, i) => {
          const widthFraction = (i + 1) / count;
          const levelWidth = minWidth + (maxWidth - minWidth) * widthFraction;

          const delay = 10 + i * 15;
          const levelSpring = spring({ frame: frame - delay, fps, config: { damping: 12, stiffness: 60 } });
          const levelOpacity = interpolate(levelSpring, [0, 1], [0, 1]);
          const levelScale = interpolate(levelSpring, [0, 1], [0.8, 1]);

          const color = layerColors[i % layerColors.length];
          const bgColor = themeColors.isDark ? `${color}25` : `${color}18`;

          return (
            <div
              key={i}
              style={{
                width: levelWidth,
                height: levelHeight - 8,
                background: bgColor,
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                borderRadius: theme.borderRadius.lg,
                border: cardBorder,
                boxShadow: `0 4px 20px ${color}15`,
                opacity: levelOpacity,
                transform: `scale(${levelScale})`,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: `${theme.spacing.xs}px ${theme.spacing.md}px`,
                position: 'relative',
              }}
            >
              {/* Colored left accent bar */}
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  top: '15%',
                  bottom: '15%',
                  width: 4,
                  background: color,
                  borderRadius: 2,
                }}
              />

              <h3
                style={{
                  fontSize: count > 4 ? theme.fontSize.small : theme.fontSize.body,
                  fontWeight: 800,
                  color: themeColors.textPrimary,
                  margin: 0,
                  letterSpacing: -0.5,
                }}
              >
                {level.label}
              </h3>
              {level.description && (
                <p
                  style={{
                    fontSize: theme.fontSize.caption,
                    color: themeColors.textSecondary,
                    margin: 0,
                    marginTop: 2,
                    fontFamily: theme.fonts.body,
                    fontWeight: 500,
                  }}
                >
                  {level.description}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
