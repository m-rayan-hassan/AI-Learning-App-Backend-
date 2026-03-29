import React from 'react';
import { useCurrentFrame, interpolate, spring, useVideoConfig } from 'remotion';
import { theme, SLIDE_WIDTH, SLIDE_HEIGHT } from '../theme';
import { DynamicBackground } from '../components/DynamicBackground';

interface Event {
  label: string;
  description?: string;
}

interface TimelineSlideProps {
  title: string;
  events: Event[];
}

export const TimelineSlide: React.FC<TimelineSlideProps> = ({ title, events }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Title
  const titleSpring = spring({ frame, fps, config: { damping: 14, stiffness: 80 } });
  const titleOpacity = interpolate(titleSpring, [0, 1], [0, 1]);
  const titleY = interpolate(titleSpring, [0, 1], [30, 0]);

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
      <DynamicBackground />

      <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', height: '100%' }}>
        <h2
          style={{
            fontSize: theme.fontSize.hero * 0.75,
            fontWeight: 800,
            color: theme.colors.textPrimary,
            opacity: titleOpacity,
            transform: `translateY(${titleY}px)`,
            margin: 0,
            marginBottom: theme.spacing.lg,
            letterSpacing: -1,
            textAlign: 'center',
          }}
        >
          {title}
        </h2>

        {/* Vertical Timeline container */}
        <div 
          style={{ 
            flex: 1, 
            position: 'relative', 
            display: 'flex', 
            flexDirection: 'column', 
            justifyContent: 'center',
            maxWidth: 900,
            margin: '0 auto',
            width: '100%'
          }}
        >
          {/* Connecting Vertical Line */}
          <div
            style={{
              position: 'absolute',
              left: '50%',
              top: 40,
              bottom: 40,
              width: 4,
              background: `linear-gradient(to bottom, ${theme.colors.primary}40, ${theme.colors.secondary}40)`,
              transform: 'translateX(-50%)',
              borderRadius: 2,
            }}
          />

          {events.map((event, i) => {
            const delay = 15 + i * 15;
            // Slide inward from left or right depending on even/odd
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
                  marginBottom: theme.spacing.md,
                  opacity: eventOpacity,
                  transform: `translateX(${eventX}px)`,
                  // Force flex-direction row or row-reverse based on side
                  flexDirection: isLeft ? 'row' : 'row-reverse',
                  width: '100%',
                }}
              >
                {/* Content Card (Takes up slightly less than half) */}
                <div
                  style={{
                    width: 'calc(50% - 40px)',
                    background: 'rgba(255,255,255,0.75)',
                    backdropFilter: 'blur(8px)',
                    WebkitBackdropFilter: 'blur(8px)',
                    padding: `${theme.spacing.md}px ${theme.spacing.lg}px`,
                    borderRadius: theme.borderRadius.xl,
                    boxShadow: theme.shadow.card,
                    border: '1px solid rgba(255,255,255,0.9)',
                    textAlign: isLeft ? 'right' : 'left',
                  }}
                >
                  <h3
                    style={{
                      fontSize: theme.fontSize.h3,
                      fontWeight: 800,
                      color: theme.colors.primary,
                      margin: 0,
                      marginBottom: theme.spacing.xs,
                      letterSpacing: -1,
                    }}
                  >
                    {event.label}
                  </h3>
                  {event.description && (
                    <p
                      style={{
                        fontSize: theme.fontSize.body,
                        color: theme.colors.textSecondary,
                        margin: 0,
                        lineHeight: 1.5,
                        fontFamily: theme.fonts.body,
                      }}
                    >
                      {event.description}
                    </p>
                  )}
                </div>

                {/* Center Node (Always directly on the center line) */}
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
                      background: theme.colors.bgCard,
                      border: `4px solid ${theme.colors.primary}`,
                      boxShadow: `0 0 15px ${theme.colors.primary}50`,
                      zIndex: 2, // above the line
                    }}
                  />
                </div>
                
                {/* Empty space filler for the other side */}
                <div style={{ width: 'calc(50% - 40px)' }} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
