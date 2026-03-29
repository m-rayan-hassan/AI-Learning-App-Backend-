import React from 'react';
import { useCurrentFrame, interpolate, spring, useVideoConfig } from 'remotion';
import { theme, SLIDE_WIDTH, SLIDE_HEIGHT } from '../theme';
import type { ThemeColors } from '../theme';
import { DynamicBackground } from '../components/DynamicBackground';

interface Event {
  label: string;
  description?: string;
}

interface TimelineSlideProps {
  title: string;
  events: Event[];
  themeColors: ThemeColors;
}

export const TimelineSlide: React.FC<TimelineSlideProps> = ({ title, events, themeColors }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleSpring = spring({ frame, fps, config: { damping: 14, stiffness: 80 } });
  const titleOpacity = interpolate(titleSpring, [0, 1], [0, 1]);
  const titleY = interpolate(titleSpring, [0, 1], [30, 0]);

  // Overflow protection
  const safeEvents = events.slice(0, 6);
  const count = safeEvents.length;
  const cardPadY = count > 4 ? theme.spacing.sm : theme.spacing.md;
  const cardPadX = count > 4 ? theme.spacing.md : theme.spacing.lg;
  const eventGap = count > 4 ? theme.spacing.sm : theme.spacing.md;
  const labelFontSize = count > 4 ? theme.fontSize.body : theme.fontSize.h3;
  const descFontSize = count > 4 ? theme.fontSize.small - 2 : theme.fontSize.body;

  const cardBg = themeColors.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.75)';
  const cardBorder = themeColors.isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(255,255,255,0.9)';

  return (
    <div
      style={{
        boxSizing: 'border-box',
        width: SLIDE_WIDTH,
        height: SLIDE_HEIGHT,
        display: 'flex',
        flexDirection: 'column',
        padding: `${theme.spacing.lg}px ${theme.spacing.xl}px`,
        position: 'relative',
        overflow: 'hidden',
        fontFamily: theme.fonts.heading,
      }}
    >
      <DynamicBackground themeColors={themeColors} />

      <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', height: '100%' }}>
        <h2
          style={{
            fontSize: title.length > 40 ? theme.fontSize.h2 : theme.fontSize.hero * 0.75,
            fontWeight: 800,
            color: themeColors.textPrimary,
            opacity: titleOpacity,
            transform: `translateY(${titleY}px)`,
            margin: 0,
            marginBottom: theme.spacing.md,
            letterSpacing: -1,
            textAlign: 'center',
          }}
        >
          {title}
        </h2>

        <div
          style={{
            flex: 1,
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            maxWidth: 900,
            margin: '0 auto',
            width: '100%',
          }}
        >
          {/* Vertical line */}
          <div
            style={{
              position: 'absolute',
              left: '50%',
              top: 20,
              bottom: 20,
              width: 4,
              background: `linear-gradient(to bottom, ${themeColors.primary}40, ${themeColors.secondary}40)`,
              transform: 'translateX(-50%)',
              borderRadius: 2,
            }}
          />

          {safeEvents.map((event, i) => {
            const delay = 15 + i * 12;
            const isLeft = i % 2 === 0;
            const eventSpring = spring({ frame: frame - delay, fps, config: { damping: 14, stiffness: 60 } });
            const eventOpacity = interpolate(eventSpring, [0, 1], [0, 1]);
            const eventX = interpolate(eventSpring, [0, 1], [isLeft ? -50 : 50, 0]);

            return (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  marginBottom: eventGap,
                  opacity: eventOpacity,
                  transform: `translateX(${eventX}px)`,
                  flexDirection: isLeft ? 'row' : 'row-reverse',
                  width: '100%',
                }}
              >
                <div
                  style={{
                    width: 'calc(50% - 40px)',
                    background: cardBg,
                    backdropFilter: 'blur(8px)',
                    WebkitBackdropFilter: 'blur(8px)',
                    padding: `${cardPadY}px ${cardPadX}px`,
                    borderRadius: theme.borderRadius.xl,
                    boxShadow: theme.shadow.card,
                    border: cardBorder,
                    textAlign: isLeft ? 'right' : 'left',
                  }}
                >
                  <h3
                    style={{
                      fontSize: labelFontSize,
                      fontWeight: 800,
                      color: themeColors.primary,
                      margin: 0,
                      marginBottom: event.description ? theme.spacing.xs : 0,
                      letterSpacing: -0.5,
                    }}
                  >
                    {event.label}
                  </h3>
                  {event.description && (
                    <p
                      style={{
                        fontSize: descFontSize,
                        color: themeColors.textSecondary,
                        margin: 0,
                        lineHeight: 1.4,
                        fontFamily: theme.fonts.body,
                      }}
                    >
                      {event.description}
                    </p>
                  )}
                </div>

                {/* Center node */}
                <div
                  style={{
                    width: 80,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    flexShrink: 0,
                  }}
                >
                  <div
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      background: themeColors.isDark ? themeColors.bg : themeColors.bgCard,
                      border: `4px solid ${themeColors.primary}`,
                      boxShadow: `0 0 15px ${themeColors.primary}50`,
                      zIndex: 2,
                    }}
                  />
                </div>

                <div style={{ width: 'calc(50% - 40px)' }} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
