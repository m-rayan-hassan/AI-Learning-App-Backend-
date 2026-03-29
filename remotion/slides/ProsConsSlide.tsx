import React from 'react';
import { useCurrentFrame, interpolate, spring, useVideoConfig } from 'remotion';
import { theme, SLIDE_WIDTH, SLIDE_HEIGHT } from '../theme';
import type { ThemeColors } from '../theme';
import { DynamicBackground } from '../components/DynamicBackground';

interface ProsConsSlideProps {
  title: string;
  pros: string[];
  cons: string[];
  themeColors: ThemeColors;
}

export const ProsConsSlide: React.FC<ProsConsSlideProps> = ({ title, pros, cons, themeColors }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleSpring = spring({ frame, fps, config: { damping: 14, stiffness: 80 } });
  const titleOpacity = interpolate(titleSpring, [0, 1], [0, 1]);
  const titleY = interpolate(titleSpring, [0, 1], [30, 0]);

  const safePros = pros.slice(0, 5);
  const safeCons = cons.slice(0, 5);
  const maxItems = Math.max(safePros.length, safeCons.length);
  const itemFontSize = maxItems > 4 ? theme.fontSize.small : theme.fontSize.body;

  const cardBg = themeColors.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.7)';
  const cardBorder = themeColors.isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(255,255,255,0.9)';
  const itemBg = themeColors.isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.8)';

  const proColor = '#22c55e';
  const conColor = '#ef4444';

  const renderColumn = (items: string[], type: 'pro' | 'con', columnDelay: number) => {
    const color = type === 'pro' ? proColor : conColor;
    const headerBg = type === 'pro'
      ? 'linear-gradient(135deg, #22c55e 0%, #4ade80 100%)'
      : 'linear-gradient(135deg, #ef4444 0%, #f87171 100%)';
    const label = type === 'pro' ? 'Advantages' : 'Disadvantages';
    const icon = type === 'pro' ? '✓' : '✗';

    return (
      <div
        style={{
          flex: 1,
          background: cardBg,
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          borderRadius: theme.borderRadius.xl,
          boxShadow: theme.shadow.elevated,
          border: cardBorder,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            background: headerBg,
            padding: `${theme.spacing.md}px`,
            textAlign: 'center',
          }}
        >
          <h3
            style={{
              fontSize: theme.fontSize.h3,
              fontWeight: 800,
              color: '#ffffff',
              margin: 0,
              letterSpacing: -0.5,
            }}
          >
            {label}
          </h3>
        </div>

        {/* Items */}
        <div style={{ padding: theme.spacing.md, flex: 1, display: 'flex', flexDirection: 'column', gap: theme.spacing.sm }}>
          {items.map((item, j) => {
            const delay = columnDelay + 10 + j * 8;
            const iSpring = spring({ frame: frame - delay, fps, config: { damping: 14, stiffness: 80 } });
            const iOpacity = interpolate(iSpring, [0, 1], [0, 1]);
            const iX = interpolate(iSpring, [0, 1], [type === 'pro' ? -20 : 20, 0]);

            return (
              <div
                key={j}
                style={{
                  opacity: iOpacity,
                  transform: `translateX(${iX}px)`,
                  background: itemBg,
                  padding: `${theme.spacing.sm}px ${theme.spacing.md}px`,
                  borderRadius: theme.borderRadius.md,
                  display: 'flex',
                  alignItems: 'center',
                  gap: theme.spacing.sm,
                  border: `1px solid ${color}20`,
                }}
              >
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    background: `${color}15`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    fontSize: 16,
                    fontWeight: 900,
                    color: color,
                  }}
                >
                  {icon}
                </div>
                <p
                  style={{
                    fontSize: itemFontSize,
                    color: themeColors.textSecondary,
                    margin: 0,
                    lineHeight: 1.35,
                    fontWeight: 500,
                    fontFamily: theme.fonts.body,
                  }}
                >
                  {item}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

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
          fontSize: title.length > 40 ? theme.fontSize.h2 : theme.fontSize.hero * 0.9,
          fontWeight: 800,
          color: themeColors.textPrimary,
          opacity: titleOpacity,
          transform: `translateY(${titleY}px)`,
          textAlign: 'center',
          letterSpacing: -1,
          margin: 0,
          marginBottom: theme.spacing.md,
        }}
      >
        {title}
      </h2>

      <div
        style={{
          position: 'relative',
          zIndex: 10,
          display: 'flex',
          gap: theme.spacing.lg,
          width: '100%',
          maxWidth: 1100,
          flex: 1,
          paddingBottom: theme.spacing.md,
        }}
      >
        {renderColumn(safePros, 'pro', 15)}
        {renderColumn(safeCons, 'con', 25)}
      </div>
    </div>
  );
};
