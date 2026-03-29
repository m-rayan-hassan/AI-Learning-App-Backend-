import React from 'react';
import { useCurrentFrame, interpolate, spring, useVideoConfig } from 'remotion';
import { theme, SLIDE_WIDTH, SLIDE_HEIGHT } from '../theme';
import type { ThemeColors } from '../theme';
import { DynamicBackground } from '../components/DynamicBackground';

interface Step {
  label: string;
  icon?: string;
}

interface FlowchartSlideProps {
  title: string;
  steps: Step[];
  themeColors: ThemeColors;
}

export const FlowchartSlide: React.FC<FlowchartSlideProps> = ({ title, steps, themeColors }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleSpring = spring({ frame, fps, config: { damping: 14, stiffness: 80 } });
  const titleOpacity = interpolate(titleSpring, [0, 1], [0, 1]);
  const titleY = interpolate(titleSpring, [0, 1], [40, 0]);

  // Auto-scale for overflow protection
  const safeSteps = steps.slice(0, 7);
  const count = safeSteps.length;
  const orbSize = count > 5 ? 70 : count > 4 ? 85 : 100;
  const connectorWidth = count > 5 ? 30 : count > 4 ? 50 : count > 3 ? 70 : 120;
  const labelFontSize = count > 5 ? 14 : count > 4 ? 16 : theme.fontSize.small;
  const maxLabelWidth = count > 5 ? 120 : count > 4 ? 150 : 200;
  const yAmplitude = count > 5 ? 25 : 40;
  const orbNumSize = count > 5 ? 24 : 36;

  const cardBg = themeColors.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.7)';
  const cardBorder = themeColors.isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(255,255,255,0.9)';
  const labelBg = themeColors.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.85)';

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
          marginBottom: theme.spacing.xl,
        }}
      >
        {title}
      </h2>

      <div
        style={{
          position: 'relative',
          zIndex: 10,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 0,
        }}
      >
        {safeSteps.map((step, i) => {
          const delay = 15 + i * 15;
          const orbSpring = spring({ frame: frame - delay, fps, config: { damping: 12, stiffness: 60 } });
          const orbScale = interpolate(orbSpring, [0, 1], [0, 1]);
          const orbOpacity = interpolate(orbSpring, [0, 1], [0, 1]);

          const lineDelay = delay + 10;
          const lineSpring = spring({ frame: frame - lineDelay, fps, config: { damping: 20, stiffness: 40 } });
          const lineScaleX = interpolate(lineSpring, [0, 1], [0, 1]);
          const lineOpacity = interpolate(lineSpring, [0, 1], [0, 1]);

          const yOffset = i % 2 === 0 ? -yAmplitude : yAmplitude;
          const isLast = i === safeSteps.length - 1;

          return (
            <React.Fragment key={i}>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  transform: `translateY(${yOffset}px)`,
                  gap: theme.spacing.sm,
                }}
              >
                {/* Orb */}
                <div
                  style={{
                    width: orbSize,
                    height: orbSize,
                    borderRadius: '50%',
                    background: cardBg,
                    backdropFilter: 'blur(8px)',
                    WebkitBackdropFilter: 'blur(8px)',
                    border: cardBorder,
                    boxShadow: `inset 0 -8px 16px rgba(0,0,0,0.05), ${theme.shadow.elevated}`,
                    opacity: orbOpacity,
                    transform: `scale(${orbScale})`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: themeColors.primary,
                    fontSize: orbNumSize,
                    fontWeight: 800,
                  }}
                >
                  {i + 1}
                </div>

                {/* Label */}
                <div
                  style={{
                    background: labelBg,
                    padding: `${theme.spacing.xs}px ${theme.spacing.sm}px`,
                    borderRadius: theme.borderRadius.pill,
                    border: cardBorder,
                    boxShadow: theme.shadow.card,
                    opacity: orbOpacity,
                    transform: `scale(${orbScale})`,
                    maxWidth: maxLabelWidth,
                    textAlign: 'center',
                  }}
                >
                  <span
                    style={{
                      fontSize: labelFontSize,
                      fontWeight: 700,
                      color: themeColors.textPrimary,
                    }}
                  >
                    {step.label}
                  </span>
                </div>
              </div>

              {/* Connector with arrow */}
              {!isLast && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    margin: '0 4px',
                  }}
                >
                  <div
                    style={{
                      width: connectorWidth,
                      height: 4,
                      background: `linear-gradient(to right, ${themeColors.primary}, ${themeColors.secondary})`,
                      borderRadius: 2,
                      opacity: lineOpacity,
                      transform: `scaleX(${lineScaleX})`,
                      transformOrigin: 'left center',
                      boxShadow: `0 0 10px ${themeColors.primary}40`,
                    }}
                  />
                  {/* SVG Arrow head */}
                  <svg width="12" height="12" viewBox="0 0 12 12" style={{ opacity: lineOpacity, marginLeft: -2 }}>
                    <polygon points="0,0 12,6 0,12" fill={themeColors.secondary} />
                  </svg>
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
