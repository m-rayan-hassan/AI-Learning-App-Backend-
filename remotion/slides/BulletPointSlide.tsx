import React from 'react';
import { useCurrentFrame, interpolate, spring, useVideoConfig } from 'remotion';
import { theme, SLIDE_WIDTH, SLIDE_HEIGHT } from '../theme';
import { DynamicBackground } from '../components/DynamicBackground';

interface BulletPointSlideProps {
  title: string;
  bullets: string[];
}

export const BulletPointSlide: React.FC<BulletPointSlideProps> = ({ title, bullets }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Title
  const titleSpring = spring({ frame, fps, config: { damping: 14, stiffness: 80 } });
  const titleOpacity = interpolate(titleSpring, [0, 1], [0, 1]);
  const titleY = interpolate(titleSpring, [0, 1], [40, 0]);

  // Determine grid layout based on count
  const columns = bullets.length <= 4 ? 2 : 3;

  return (
    <div
      style={{
        boxSizing: 'border-box',
        width: SLIDE_WIDTH,
        height: SLIDE_HEIGHT,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: `${theme.spacing.md}px ${theme.spacing.xl}px`,
        position: 'relative',
        overflow: 'hidden',
        fontFamily: theme.fonts.heading,
      }}
    >
      {/* Background Mesh */}
      <DynamicBackground />

      <div style={{ position: 'relative', zIndex: 1, height: '100%', display: 'flex', flexDirection: 'column' }}>
        <h2
          style={{
            fontSize: theme.fontSize.hero * 0.75,
            fontWeight: 800,
            color: theme.colors.textPrimary,
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

        {/* Visual Grid of Cards */}
        <div 
          style={{ 
            display: 'grid', 
            gridTemplateColumns: `repeat(${columns}, 1fr)`, 
            gap: theme.spacing.md,
            flex: 1,
            alignItems: 'center',
            alignContent: 'center',
          }}
        >
          {bullets.map((bullet, i) => {
            const delay = 18 + i * 10;
            const cardSpring = spring({ frame: frame - delay, fps, config: { damping: 12, stiffness: 70 } });
            const cardOpacity = interpolate(cardSpring, [0, 1], [0, 1]);
            const cardScale = interpolate(cardSpring, [0, 1], [0.8, 1]);

            const colors = [theme.colors.primary, theme.colors.secondary, theme.colors.accent, theme.colors.primaryLight, theme.colors.secondaryLight, theme.colors.accentLight];
            const activeColor = colors[i % colors.length];

            return (
              <div
                key={i}
                style={{
                  opacity: cardOpacity,
                  transform: `scale(${cardScale})`,
                  background: 'rgba(255, 255, 255, 0.7)',
                  backdropFilter: 'blur(8px)',
                  WebkitBackdropFilter: 'blur(8px)',
                  padding: theme.spacing.md,
                  borderRadius: theme.borderRadius.xl,
                  border: '1px solid rgba(255, 255, 255, 0.9)',
                  boxShadow: theme.shadow.card,
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: theme.spacing.md,
                }}
              >
                {/* Visual Icon Header for each bullet */}
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: theme.borderRadius.lg,
                    background: `${activeColor}15`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: `1px solid ${activeColor}30`,
                  }}
                >
                  <div
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      background: activeColor,
                      boxShadow: `0 0 10px ${activeColor}50`,
                    }}
                  />
                </div>
                
                <p
                  style={{
                    flex: 1,
                    fontSize: theme.fontSize.body,
                    color: theme.colors.textPrimary,
                    margin: 0,
                    lineHeight: 1.4,
                    fontWeight: 600,
                    fontFamily: theme.fonts.body,
                  }}
                >
                  {bullet}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
