import React from 'react';
import { useCurrentFrame, interpolate, spring, useVideoConfig } from 'remotion';
import { theme, SLIDE_WIDTH, SLIDE_HEIGHT } from '../theme';
import { DynamicBackground } from '../components/DynamicBackground';

interface Column {
  heading: string;
  items: string[];
}

interface ComparisonSlideProps {
  title: string;
  columns: Column[]; // Expected 2 columns
}

export const ComparisonSlide: React.FC<ComparisonSlideProps> = ({ title, columns }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Title
  const titleSpring = spring({ frame, fps, config: { damping: 14, stiffness: 80 } });
  const titleOpacity = interpolate(titleSpring, [0, 1], [0, 1]);
  const titleY = interpolate(titleSpring, [0, 1], [30, 0]);

  // Ensure 2 columns max for safety visually
  const safeColumns = columns.slice(0, 2);

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
      <DynamicBackground />

      <h2
        style={{
          position: 'relative',
          zIndex: 10,
          fontSize: theme.fontSize.hero * 0.9,
          fontWeight: 800,
          color: theme.colors.textPrimary,
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

      {/* Comparison Cards wrapping container */}
      <div 
        style={{ 
          position: 'relative', 
          zIndex: 10, 
          display: 'flex', 
          gap: theme.spacing.lg, 
          width: '100%', 
          maxWidth: 1100, 
          flex: 1, 
          paddingBottom: theme.spacing.lg 
        }}
      >
        {safeColumns.map((col, i) => {
          // Staggered card entrance
          const delay = 15 + i * 15;
          const cardSpring = spring({ frame: frame - delay, fps, config: { damping: 12, stiffness: 60 } });
          const cardOpacity = interpolate(cardSpring, [0, 1], [0, 1]);
          const cardY = interpolate(cardSpring, [0, 1], [50, 0]);
          
          const isPrimary = i === 1; // Second column gets primary brand colored header
          const cardBg = 'rgba(255, 255, 255, 0.7)';
          const headerGradient = isPrimary ? theme.colors.gradientPrimary : theme.colors.gradientCard;
          const headerTextColor = isPrimary ? '#ffffff' : theme.colors.textPrimary;

          return (
            <div
              key={i}
              style={{
                flex: 1,
                opacity: cardOpacity,
                transform: `translateY(${cardY}px)`,
                background: cardBg,
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                borderRadius: theme.borderRadius.xl,
                boxShadow: theme.shadow.elevated,
                border: '1px solid rgba(255,255,255,0.9)',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                position: 'relative', // for internal overlapping vs scale
                marginTop: isPrimary ? -20 : 0, // Slight visual overlap/offset effect
                marginBottom: isPrimary ? 20 : 0,
              }}
            >
              {/* Card Header */}
              <div
                style={{
                  background: headerGradient,
                  padding: `${theme.spacing.lg}px`,
                  textAlign: 'center',
                  borderBottom: `1px solid rgba(0,0,0,0.05)`,
                }}
              >
                <h3
                  style={{
                    fontSize: theme.fontSize.h2,
                    fontWeight: 800,
                    color: headerTextColor,
                    margin: 0,
                    letterSpacing: -1,
                  }}
                >
                  {col.heading}
                </h3>
              </div>

              {/* Card Content (Items) */}
              <div style={{ padding: theme.spacing.lg, flex: 1, display: 'flex', flexDirection: 'column', gap: theme.spacing.md, overflow: 'hidden' }}>
                {col.items.map((item, j) => {
                  const itemDelay = delay + 10 + j * 8;
                  const itemSpring = spring({ frame: frame - itemDelay, fps, config: { damping: 14, stiffness: 80 } });
                  const itemOpacity = interpolate(itemSpring, [0, 1], [0, 1]);
                  const itemX = interpolate(itemSpring, [0, 1], [-20, 0]);

                  return (
                    <div
                      key={j}
                      style={{
                        opacity: itemOpacity,
                        transform: `translateX(${itemX}px)`,
                        background: 'rgba(255,255,255,0.8)',
                        padding: `${theme.spacing.md}px ${theme.spacing.lg}px`,
                        borderRadius: theme.borderRadius.md,
                        display: 'flex',
                        alignItems: 'center',
                        gap: theme.spacing.md,
                        border: '1px solid rgba(255,255,255,0.9)',
                      }}
                    >
                      <div 
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          background: isPrimary ? theme.colors.primary : theme.colors.textMuted,
                          flexShrink: 0,
                        }}
                      />
                      <p
                        style={{
                          fontSize: theme.fontSize.body,
                          color: theme.colors.textSecondary,
                          margin: 0,
                          lineHeight: 1.4,
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
        })}

        {/* Floating VS Badge in the center */}
        {safeColumns.length === 2 && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: `translate(-50%, -50%) scale(${interpolate(spring({ frame: frame - 40, fps, config: { damping: 12, stiffness: 60 } }), [0, 1], [0, 1])})`,
              width: 80,
              height: 80,
              borderRadius: '50%',
              background: '#ffffff',
              boxShadow: theme.shadow.elevated,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: `4px solid ${theme.colors.bgCardAlt}`,
              zIndex: 20,
              fontSize: 24,
              fontWeight: 900,
              color: theme.colors.primary,
              letterSpacing: 1,
            }}
          >
            VS
          </div>
        )}
      </div>
    </div>
  );
};
