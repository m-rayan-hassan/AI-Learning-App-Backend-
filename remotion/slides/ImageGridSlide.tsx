import React from 'react';
import { useCurrentFrame, interpolate, spring, useVideoConfig } from 'remotion';
import { theme, SLIDE_WIDTH, SLIDE_HEIGHT } from '../theme';
import type { ThemeColors } from '../theme';
import { AnimatedImage } from '../components/AnimatedImage';
import { DynamicBackground } from '../components/DynamicBackground';

interface ImageGridItem {
  imageUrl?: string;
  caption: string;
}

interface ImageGridSlideProps {
  title: string;
  images: ImageGridItem[];
  themeColors: ThemeColors;
}

/**
 * Multi-image grid layout with AI-generated images and glass caption cards.
 * Supports 2-4 images with staggered reveal animations.
 */
export const ImageGridSlide: React.FC<ImageGridSlideProps> = ({
  title,
  images,
  themeColors,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Title animation
  const titleSpring = spring({ frame, fps, config: { damping: 14, stiffness: 80 } });
  const titleOpacity = interpolate(titleSpring, [0, 1], [0, 1]);
  const titleY = interpolate(titleSpring, [0, 1], [30, 0]);

  const safeImages = images.slice(0, 4);
  const count = safeImages.length;
  const columns = count <= 2 ? 2 : 2;
  const rows = count <= 2 ? 1 : 2;

  const gridGap = theme.spacing.md;
  const gridPadX = theme.spacing.xl;
  const gridPadTop = theme.spacing.sm;
  const titleHeight = 80;
  const availableWidth = SLIDE_WIDTH - gridPadX * 2;
  const availableHeight = SLIDE_HEIGHT - titleHeight - gridPadTop - theme.spacing.lg;
  const cellWidth = (availableWidth - gridGap * (columns - 1)) / columns;
  const cellHeight = (availableHeight - gridGap * (rows - 1)) / rows;

  const captionBg = themeColors.isDark ? 'rgba(0,0,0,0.55)' : 'rgba(0,0,0,0.45)';

  // Placeholder gradient for missing images
  const placeholderGradients = [
    `linear-gradient(135deg, ${themeColors.primary}40 0%, ${themeColors.secondary}40 100%)`,
    `linear-gradient(135deg, ${themeColors.secondary}40 0%, ${themeColors.accent}40 100%)`,
    `linear-gradient(135deg, ${themeColors.accent}40 0%, ${themeColors.primaryLight}40 100%)`,
    `linear-gradient(135deg, ${themeColors.primaryLight}40 0%, ${themeColors.primary}40 100%)`,
  ];

  return (
    <div
      style={{
        boxSizing: 'border-box',
        width: SLIDE_WIDTH,
        height: SLIDE_HEIGHT,
        position: 'relative',
        overflow: 'hidden',
        fontFamily: theme.fonts.heading,
      }}
    >
      <DynamicBackground themeColors={themeColors} />

      <div
        style={{
          position: 'relative',
          zIndex: 1,
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          padding: `${theme.spacing.md}px ${gridPadX}px`,
        }}
      >
        {/* Title */}
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
            marginBottom: gridPadTop,
            textAlign: 'center',
          }}
        >
          {title}
        </h2>

        {/* Image Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${columns}, 1fr)`,
            gap: gridGap,
            flex: 1,
          }}
        >
          {safeImages.map((img, i) => {
            const delay = 12 + i * 10;
            const cardSpring = spring({
              frame: frame - delay,
              fps,
              config: { damping: 14, stiffness: 60 },
            });
            const cardScale = interpolate(cardSpring, [0, 1], [0.8, 1]);
            const cardOpacity = interpolate(cardSpring, [0, 1], [0, 1]);

            return (
              <div
                key={i}
                style={{
                  position: 'relative',
                  borderRadius: theme.borderRadius.lg,
                  overflow: 'hidden',
                  opacity: cardOpacity,
                  transform: `scale(${cardScale})`,
                  boxShadow: theme.shadow.elevated,
                  border: themeColors.isDark
                    ? '1px solid rgba(255,255,255,0.1)'
                    : '1px solid rgba(255,255,255,0.8)',
                }}
              >
                {/* Image or placeholder */}
                {img.imageUrl ? (
                  <AnimatedImage
                    src={img.imageUrl}
                    width={cellWidth}
                    height={cellHeight}
                    kenBurns="none"
                    animateEntrance={false}
                    vignetteOpacity={0}
                    objectFit="contain"
                    style={{ width: '100%', height: '100%' }}
                  />
                ) : (
                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      background: placeholderGradients[i % placeholderGradients.length],
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <div
                      style={{
                        width: 60,
                        height: 60,
                        borderRadius: '50%',
                        background: `${themeColors.primary}25`,
                        border: `2px solid ${themeColors.primary}40`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 28,
                      }}
                    >
                      🖼
                    </div>
                  </div>
                )}

                {/* Glass caption */}
                <div
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    padding: `${theme.spacing.sm}px ${theme.spacing.md}px`,
                    background: captionBg,
                    backdropFilter: 'blur(8px)',
                    WebkitBackdropFilter: 'blur(8px)',
                  }}
                >
                  <p
                    style={{
                      fontSize: count > 2 ? theme.fontSize.small : theme.fontSize.body,
                      fontWeight: 700,
                      color: '#ffffff',
                      margin: 0,
                      lineHeight: 1.3,
                      textShadow: '0 1px 4px rgba(0,0,0,0.3)',
                    }}
                  >
                    {img.caption}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
