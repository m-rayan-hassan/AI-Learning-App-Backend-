import React from 'react';
import { useCurrentFrame, interpolate, spring, useVideoConfig } from 'remotion';
import { theme, SLIDE_WIDTH, SLIDE_HEIGHT } from '../theme';
import type { ThemeColors } from '../theme';
import { DynamicBackground } from '../components/DynamicBackground';

interface IconGridItem {
  icon: string;
  label: string;
  description?: string;
}

interface IconGridSlideProps {
  title: string;
  items: IconGridItem[];
  themeColors: ThemeColors;
}

export const IconGridSlide: React.FC<IconGridSlideProps> = ({ title, items, themeColors }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleSpring = spring({ frame, fps, config: { damping: 14, stiffness: 80 } });
  const titleOpacity = interpolate(titleSpring, [0, 1], [0, 1]);
  const titleY = interpolate(titleSpring, [0, 1], [40, 0]);

  const safeItems = items.slice(0, 6);
  const count = safeItems.length;
  const columns = count <= 3 ? count : count <= 4 ? 2 : 3;

  const cardBg = themeColors.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.7)';
  const cardBorder = themeColors.isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(255,255,255,0.9)';
  const accentColors = [themeColors.primary, themeColors.secondary, themeColors.accent, themeColors.primaryLight, themeColors.secondaryLight, themeColors.accentLight];

  return (
    <div
      style={{
        boxSizing: 'border-box',
        width: SLIDE_WIDTH,
        height: SLIDE_HEIGHT,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: `${theme.spacing.lg}px ${theme.spacing.xl}px`,
        position: 'relative',
        overflow: 'hidden',
        fontFamily: theme.fonts.heading,
      }}
    >
      <DynamicBackground themeColors={themeColors} />

      <div style={{ position: 'relative', zIndex: 1, height: '100%', display: 'flex', flexDirection: 'column' }}>
        <h2
          style={{
            fontSize: title.length > 40 ? theme.fontSize.h2 : theme.fontSize.hero * 0.75,
            fontWeight: 800,
            color: themeColors.textPrimary,
            opacity: titleOpacity,
            transform: `translateY(${titleY}px)`,
            lineHeight: 1.15,
            letterSpacing: -1,
            margin: 0,
            marginBottom: theme.spacing.lg,
            textAlign: 'center',
          }}
        >
          {title}
        </h2>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${columns}, 1fr)`,
            gap: theme.spacing.md,
            flex: 1,
            alignContent: 'center',
          }}
        >
          {safeItems.map((item, i) => {
            const delay = 15 + i * 10;
            const cardSpring = spring({ frame: frame - delay, fps, config: { damping: 12, stiffness: 70 } });
            const cardOpacity = interpolate(cardSpring, [0, 1], [0, 1]);
            const cardScale = interpolate(cardSpring, [0, 1], [0.85, 1]);
            const activeColor = accentColors[i % accentColors.length];

            return (
              <div
                key={i}
                style={{
                  opacity: cardOpacity,
                  transform: `scale(${cardScale})`,
                  background: cardBg,
                  backdropFilter: 'blur(8px)',
                  WebkitBackdropFilter: 'blur(8px)',
                  padding: theme.spacing.md,
                  borderRadius: theme.borderRadius.xl,
                  border: cardBorder,
                  boxShadow: theme.shadow.card,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  gap: theme.spacing.sm,
                }}
              >
                {/* Emoji icon in colored circle */}
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: '50%',
                    background: `${activeColor}15`,
                    border: `2px solid ${activeColor}30`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 28,
                  }}
                >
                  {item.icon}
                </div>

                <h3
                  style={{
                    fontSize: theme.fontSize.body,
                    fontWeight: 800,
                    color: themeColors.textPrimary,
                    margin: 0,
                    letterSpacing: -0.5,
                  }}
                >
                  {item.label}
                </h3>

                {item.description && (
                  <p
                    style={{
                      fontSize: theme.fontSize.small - 2,
                      color: themeColors.textSecondary,
                      margin: 0,
                      lineHeight: 1.4,
                      fontFamily: theme.fonts.body,
                      fontWeight: 500,
                    }}
                  >
                    {item.description}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
