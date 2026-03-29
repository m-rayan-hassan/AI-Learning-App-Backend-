import React from 'react';
import { useCurrentFrame, interpolate, spring, useVideoConfig } from 'remotion';
import { theme, SLIDE_WIDTH, SLIDE_HEIGHT } from '../theme';
import { DynamicBackground } from '../components/DynamicBackground';

interface BigNumberSlideProps {
  title: string;
  number: string;
  unit?: string;
  description?: string;
}

export const BigNumberSlide: React.FC<BigNumberSlideProps> = ({ title, number, unit, description }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Title
  const titleSpring = spring({ frame, fps, config: { damping: 14, stiffness: 80 } });
  const titleOpacity = interpolate(titleSpring, [0, 1], [0, 1]);
  const titleY = interpolate(titleSpring, [0, 1], [30, 0]);

  // Big number — dramatic scale-in
  const numSpring = spring({ frame: frame - 10, fps, config: { damping: 10, stiffness: 50, mass: 1.2 } });
  const numScale = interpolate(numSpring, [0, 1], [0.5, 1]);
  const numOpacity = interpolate(numSpring, [0, 1], [0, 1]);

  // Description
  const descSpring = spring({ frame: frame - 25, fps, config: { damping: 14, stiffness: 80 } });
  const descOpacity = interpolate(descSpring, [0, 1], [0, 1]);
  const descY = interpolate(descSpring, [0, 1], [20, 0]);

  // Animated SVG Ring behind number
  const ringProgress = interpolate(frame, [15, 60], [0, Math.PI * 2 * 0.75], { extrapolateRight: 'clamp' });
  const ringRadius = 240;

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
      <DynamicBackground />

      {/* SVG Animated Arc */}
      <svg
        width={600}
        height={600}
        style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 1 }}
      >
        {/* Background Track */}
        <circle 
          cx={300} cy={300} r={ringRadius} 
          fill="none" 
          stroke="rgba(0,0,0,0.04)" 
          strokeWidth="30" 
        />
        {/* Progress Arc */}
        <circle 
          cx={300} cy={300} r={ringRadius} 
          fill="none" 
          stroke={theme.colors.primary} 
          strokeWidth="30" 
          strokeLinecap="round"
          strokeDasharray={Math.PI * 2 * ringRadius}
          strokeDashoffset={Math.PI * 2 * ringRadius - ringProgress * ringRadius}
          style={{ transformOrigin: 'center', transform: 'rotate(-90deg)' }}
        />
      </svg>

      <div 
        style={{ 
          position: 'relative', 
          zIndex: 10, 
          textAlign: 'center',
          background: 'rgba(255, 255, 255, 0.5)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          borderRadius: '50%',
          width: 440,
          height: 440,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: theme.shadow.elevated,
          border: '1px solid rgba(255,255,255,0.7)',
          opacity: numOpacity,
          transform: `scale(${numScale})`,
        }}
      >
        {/* Title inside circle */}
        <h3
          style={{
            fontSize: theme.fontSize.h3,
            fontWeight: 500,
            color: theme.colors.textSecondary,
            opacity: titleOpacity,
            transform: `translateY(${titleY}px)`,
            margin: 0,
            marginBottom: theme.spacing.sm,
            textTransform: 'uppercase',
            letterSpacing: 2,
          }}
        >
          {title}
        </h3>

        {/* Big Number */}
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center' }}>
          <span
            style={{
              fontSize: 160,
              fontWeight: 900,
              color: theme.colors.textPrimary,
              lineHeight: 1,
              letterSpacing: -5,
            }}
          >
            {number}
          </span>
          {unit && (
            <span
              style={{
                fontSize: theme.fontSize.h1,
                fontWeight: 600,
                color: theme.colors.primary,
                marginLeft: theme.spacing.xs,
              }}
            >
              {unit}
            </span>
          )}
        </div>
      </div>

      {/* Description below */}
      {description && (
        <p
          style={{
            position: 'relative',
            zIndex: 10,
            fontSize: theme.fontSize.h3,
            color: theme.colors.textSecondary,
            opacity: descOpacity,
            transform: `translateY(${descY}px)`,
            margin: 0,
            marginTop: theme.spacing.xl,
            maxWidth: 700,
            lineHeight: 1.5,
            textAlign: 'center',
            background: 'rgba(255,255,255,0.8)',
            backdropFilter: 'blur(8px)',
            padding: theme.spacing.md,
            borderRadius: theme.borderRadius.lg,
            border: '1px solid rgba(255,255,255,0.7)',
            fontFamily: theme.fonts.body,
          }}
        >
          {description}
        </p>
      )}
    </div>
  );
};
