import React from 'react';
import { useCurrentFrame, interpolate, spring, useVideoConfig } from 'remotion';
import { theme, SLIDE_WIDTH, SLIDE_HEIGHT } from '../theme';
import { DynamicBackground } from '../components/DynamicBackground';

interface Step {
  label: string;
  icon?: string;
}

interface FlowchartSlideProps {
  title: string;
  steps: Step[];
}

export const FlowchartSlide: React.FC<FlowchartSlideProps> = ({ title, steps }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Title Animation
  const titleSpring = spring({ frame, fps, config: { damping: 14, stiffness: 80 } });
  const titleOpacity = interpolate(titleSpring, [0, 1], [0, 1]);
  const titleY = interpolate(titleSpring, [0, 1], [40, 0]);

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
      <DynamicBackground />

      <h2
        style={{
          position: 'relative',
          zIndex: 10,
          fontSize: theme.fontSize.hero * 0.75,
          fontWeight: 800,
          color: theme.colors.textPrimary,
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

      {/* Floating Orbs Flowchart */}
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
        {steps.map((step, i) => {
          const delay = 15 + i * 20;
          const orbSpring = spring({ frame: frame - delay, fps, config: { damping: 12, stiffness: 60 } });
          const orbScale = interpolate(orbSpring, [0, 1], [0, 1]);
          const orbOpacity = interpolate(orbSpring, [0, 1], [0, 1]);

          // Pulse animation for the lines between orbs
          const lineDelay = delay + 10;
          const lineSpring = spring({ frame: frame - lineDelay, fps, config: { damping: 20, stiffness: 40 } });
          const lineScaleX = interpolate(lineSpring, [0, 1], [0, 1]);
          const lineOpacity = interpolate(lineSpring, [0, 1], [0, 1]);

          // Alternating vertical offset for visual interest
          const yOffset = i % 2 === 0 ? -40 : 40;
          const isLast = i === steps.length - 1;

          return (
            <React.Fragment key={i}>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  transform: `translateY(${yOffset}px)`,
                  gap: theme.spacing.md,
                }}
              >
                {/* 3D Glass Orb */}
                <div
                  style={{
                    width: 100,
                    height: 100,
                    borderRadius: '50%',
                    background: 'rgba(255, 255, 255, 0.7)',
                    backdropFilter: 'blur(8px)',
                    WebkitBackdropFilter: 'blur(8px)',
                    border: '1px solid rgba(255,255,255,0.9)',
                    boxShadow: `inset 0 -10px 20px rgba(0,0,0,0.05), ${theme.shadow.elevated}`,
                    opacity: orbOpacity,
                    transform: `scale(${orbScale})`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: theme.colors.primary,
                    fontSize: 36,
                    fontWeight: 800,
                  }}
                >
                  {i + 1}
                </div>

                {/* Step Label below the orb */}
                <div
                  style={{
                    background: 'rgba(255, 255, 255, 0.85)',
                    padding: `${theme.spacing.xs}px ${theme.spacing.md}px`,
                    borderRadius: theme.borderRadius.pill,
                    border: '1px solid rgba(255,255,255,0.9)',
                    boxShadow: theme.shadow.card,
                    opacity: orbOpacity,
                    transform: `scale(${orbScale})`,
                    maxWidth: 200,
                    textAlign: 'center',
                  }}
                >
                  <span
                    style={{
                      fontSize: theme.fontSize.small,
                      fontWeight: 700,
                      color: theme.colors.textPrimary,
                    }}
                  >
                    {step.label}
                  </span>
                </div>
              </div>

              {/* Connecting Line */}
              {!isLast && (
                <div
                  style={{
                    width: steps.length > 3 ? 60 : 120,
                    height: 4,
                    background: `linear-gradient(to right, ${theme.colors.primary}, ${theme.colors.secondary})`,
                    borderRadius: 2,
                    margin: '0 10px',
                    opacity: lineOpacity,
                    transform: `scaleX(${lineScaleX})`,
                    transformOrigin: 'left center',
                    boxShadow: `0 0 10px ${theme.colors.primary}50`,
                  }}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
