import React from 'react';
import { useCurrentFrame, interpolate, Sequence, useVideoConfig } from 'remotion';
import { TitleSlide } from './slides/TitleSlide';
import { HeroTitleSlide } from './slides/HeroTitleSlide';
import { VisualSlide } from './slides/VisualSlide';
import { ImageGridSlide } from './slides/ImageGridSlide';
import { SplitScreenSlide } from './slides/SplitScreenSlide';
import { BulletPointSlide } from './slides/BulletPointSlide';
import { FlowchartSlide } from './slides/FlowchartSlide';
import { ComparisonSlide } from './slides/ComparisonSlide';
import { TimelineSlide } from './slides/TimelineSlide';
import { BigNumberSlide } from './slides/BigNumberSlide';
import { QuoteSlide } from './slides/QuoteSlide';
import { CodeSlide } from './slides/CodeSlide';
import { IconGridSlide } from './slides/IconGridSlide';
import { PyramidSlide } from './slides/PyramidSlide';
import { ProsConsSlide } from './slides/ProsConsSlide';
import { DefinitionSlide } from './slides/DefinitionSlide';
import { TableSlide } from './slides/TableSlide';
import { SectionDividerSlide } from './slides/SectionDividerSlide';
import { SLIDE_WIDTH, SLIDE_HEIGHT, FPS, TRANSITION_FRAMES, getTheme } from './theme';
import type { ThemeColors } from './theme';

/* ─── Slide data types matching LLM output format ─── */

interface BaseSlide {
  index: number;
  layout: string;
  voiceover_script: string;
  imagePrompt?: string;
}

interface TitleSlideData extends BaseSlide {
  layout: 'title';
  title: string;
  subtitle?: string;
}

interface HeroTitleSlideData extends BaseSlide {
  layout: 'hero';
  title: string;
  subtitle?: string;
}

interface VisualSlideData extends BaseSlide {
  layout: 'visual';
  title: string;
  subtitle?: string;
}

interface ImageGridSlideData extends BaseSlide {
  layout: 'imagegrid';
  title: string;
  images: Array<{ caption: string; imagePrompt?: string }>;
}

interface SplitScreenSlideData extends BaseSlide {
  layout: 'splitscreen';
  title: string;
  bullets: string[];
}

interface BulletsSlideData extends BaseSlide {
  layout: 'bullets';
  title: string;
  bullets: string[];
}

interface FlowchartSlideData extends BaseSlide {
  layout: 'flowchart';
  title: string;
  steps: Array<{ label: string; icon?: string }>;
}

interface ComparisonSlideData extends BaseSlide {
  layout: 'comparison';
  title: string;
  columns: Array<{ heading: string; items: string[] }>;
}

interface TimelineSlideData extends BaseSlide {
  layout: 'timeline';
  title: string;
  events: Array<{ label: string; description?: string }>;
}

interface BigNumberSlideData extends BaseSlide {
  layout: 'bignumber';
  title: string;
  number: string;
  unit?: string;
  description?: string;
}

interface QuoteSlideData extends BaseSlide {
  layout: 'quote';
  quote: string;
  author?: string;
}

interface CodeSlideData extends BaseSlide {
  layout: 'code';
  title: string;
  code: string;
  language?: string;
  explanation?: string;
}

interface IconGridSlideData extends BaseSlide {
  layout: 'icongrid';
  title: string;
  items: Array<{ icon: string; label: string; description?: string }>;
}

interface PyramidSlideData extends BaseSlide {
  layout: 'pyramid';
  title: string;
  levels: Array<{ label: string; description?: string }>;
}

interface ProsConsSlideData extends BaseSlide {
  layout: 'proscons';
  title: string;
  pros: string[];
  cons: string[];
}

interface DefinitionSlideData extends BaseSlide {
  layout: 'definition';
  term: string;
  definition: string;
  example?: string;
}

interface TableSlideData extends BaseSlide {
  layout: 'table';
  title: string;
  headers: string[];
  rows: string[][];
}

interface SectionDividerSlideData extends BaseSlide {
  layout: 'section';
  sectionNumber: number;
  title: string;
  subtitle?: string;
}

type SlideData =
  | TitleSlideData
  | HeroTitleSlideData
  | VisualSlideData
  | ImageGridSlideData
  | SplitScreenSlideData
  | BulletsSlideData
  | FlowchartSlideData
  | ComparisonSlideData
  | TimelineSlideData
  | BigNumberSlideData
  | QuoteSlideData
  | CodeSlideData
  | IconGridSlideData
  | PyramidSlideData
  | ProsConsSlideData
  | DefinitionSlideData
  | TableSlideData
  | SectionDividerSlideData;

interface AudioDuration {
  index: number;
  duration: number;
}

export interface VideoCompositionProps {
  slides: SlideData[];
  audioDurations: AudioDuration[];
  theme?: string;
  /** Map of slide index → image data URI (base64) */
  imageMap?: Record<number, string>;
}

/**
 * Renders a single slide based on its layout type,
 * injecting AI-generated images from the imageMap.
 */
const renderSlide = (
  slide: SlideData,
  themeColors: ThemeColors,
  imageMap: Record<number, string>
): React.ReactNode => {
  const imageUrl = imageMap[slide.index];

  switch (slide.layout) {
    case 'hero':
      return (
        <HeroTitleSlide
          title={(slide as HeroTitleSlideData).title}
          subtitle={(slide as HeroTitleSlideData).subtitle}
          imageUrl={imageUrl}
          themeColors={themeColors}
        />
      );
    case 'visual':
      return (
        <VisualSlide
          title={(slide as VisualSlideData).title}
          subtitle={(slide as VisualSlideData).subtitle}
          imageUrl={imageUrl}
          themeColors={themeColors}
        />
      );
    case 'imagegrid': {
      const gridSlide = slide as ImageGridSlideData;
      // Map per-image prompts to image URLs from imageMap
      // Image grid sub-images use keys like: index * 100 + subIndex
      const gridImages = gridSlide.images.map((img, subIdx) => ({
        caption: img.caption,
        imageUrl: imageMap[slide.index * 100 + subIdx] || undefined,
      }));
      return (
        <ImageGridSlide
          title={gridSlide.title}
          images={gridImages}
          themeColors={themeColors}
        />
      );
    }
    case 'title':
      return (
        <TitleSlide
          title={(slide as TitleSlideData).title}
          subtitle={(slide as TitleSlideData).subtitle}
          imageUrl={imageUrl}
          themeColors={themeColors}
        />
      );
    case 'splitscreen':
      return (
        <SplitScreenSlide
          title={(slide as SplitScreenSlideData).title}
          bullets={(slide as SplitScreenSlideData).bullets}
          imagePrompt={slide.imagePrompt}
          imageUrl={imageUrl}
          themeColors={themeColors}
        />
      );
    case 'bullets':
      return <BulletPointSlide title={(slide as BulletsSlideData).title} bullets={(slide as BulletsSlideData).bullets} themeColors={themeColors} />;
    case 'flowchart':
      return <FlowchartSlide title={(slide as FlowchartSlideData).title} steps={(slide as FlowchartSlideData).steps} themeColors={themeColors} />;
    case 'comparison':
      return <ComparisonSlide title={(slide as ComparisonSlideData).title} columns={(slide as ComparisonSlideData).columns} themeColors={themeColors} />;
    case 'timeline':
      return <TimelineSlide title={(slide as TimelineSlideData).title} events={(slide as TimelineSlideData).events} themeColors={themeColors} />;
    case 'bignumber':
      return (
        <BigNumberSlide
          title={(slide as BigNumberSlideData).title}
          number={(slide as BigNumberSlideData).number}
          unit={(slide as BigNumberSlideData).unit}
          description={(slide as BigNumberSlideData).description}
          themeColors={themeColors}
        />
      );
    case 'quote':
      return (
        <QuoteSlide
          quote={(slide as QuoteSlideData).quote}
          author={(slide as QuoteSlideData).author}
          imageUrl={imageUrl}
          themeColors={themeColors}
        />
      );
    case 'code':
      return (
        <CodeSlide
          title={(slide as CodeSlideData).title}
          code={(slide as CodeSlideData).code}
          language={(slide as CodeSlideData).language}
          explanation={(slide as CodeSlideData).explanation}
          themeColors={themeColors}
        />
      );
    case 'icongrid':
      return <IconGridSlide title={(slide as IconGridSlideData).title} items={(slide as IconGridSlideData).items} themeColors={themeColors} />;
    case 'pyramid':
      return <PyramidSlide title={(slide as PyramidSlideData).title} levels={(slide as PyramidSlideData).levels} themeColors={themeColors} />;
    case 'proscons':
      return <ProsConsSlide title={(slide as ProsConsSlideData).title} pros={(slide as ProsConsSlideData).pros} cons={(slide as ProsConsSlideData).cons} themeColors={themeColors} />;
    case 'definition':
      return (
        <DefinitionSlide
          term={(slide as DefinitionSlideData).term}
          definition={(slide as DefinitionSlideData).definition}
          example={(slide as DefinitionSlideData).example}
          themeColors={themeColors}
        />
      );
    case 'table':
      return <TableSlide title={(slide as TableSlideData).title} headers={(slide as TableSlideData).headers} rows={(slide as TableSlideData).rows} themeColors={themeColors} />;
    case 'section':
      return (
        <SectionDividerSlide
          sectionNumber={(slide as SectionDividerSlideData).sectionNumber}
          title={(slide as SectionDividerSlideData).title}
          subtitle={(slide as SectionDividerSlideData).subtitle}
          imageUrl={imageUrl}
          themeColors={themeColors}
        />
      );
    default:
      // Fallback
      return <BulletPointSlide title={(slide as any).title || 'Slide'} bullets={(slide as any).bullets || []} themeColors={themeColors} />;
  }
};

/**
 * Transition overlay — handles fade between slides
 */
const SlideWithTransition: React.FC<{ children: React.ReactNode; durationInFrames: number }> = ({
  children,
  durationInFrames,
}) => {
  const frame = useCurrentFrame();

  const enterOpacity = interpolate(frame, [0, TRANSITION_FRAMES], [0, 1], {
    extrapolateRight: 'clamp',
  });

  const exitOpacity = interpolate(
    frame,
    [durationInFrames - TRANSITION_FRAMES, durationInFrames],
    [1, 0],
    { extrapolateLeft: 'clamp' }
  );

  const enterScale = interpolate(frame, [0, TRANSITION_FRAMES], [1.02, 1], {
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        width: SLIDE_WIDTH,
        height: SLIDE_HEIGHT,
        opacity: Math.min(enterOpacity, exitOpacity),
        transform: `scale(${enterScale})`,
      }}
    >
      {children}
    </div>
  );
};

/**
 * Main video composition — sequences all slides with content-adaptive theming
 * and AI-generated imagery.
 */
export const VideoComposition: React.FC<VideoCompositionProps> = ({
  slides,
  audioDurations,
  theme: themeName,
  imageMap = {},
}) => {
  let currentFrame = 0;

  // Resolve theme colors from the palette name
  const themeColors = getTheme(themeName);

  const durationMap = new Map<number, number>();
  audioDurations.forEach((ad) => durationMap.set(ad.index, ad.duration));

  const GAP_SECONDS = 2;
  const GAP_FRAMES = Math.ceil(GAP_SECONDS * FPS);

  return (
    <div style={{ width: SLIDE_WIDTH, height: SLIDE_HEIGHT, backgroundColor: themeColors.bg }}>
      {slides.map((slide, i) => {
        const audioDuration = durationMap.get(slide.index) || 8;
        const slideDurationFrames = Math.ceil(audioDuration * FPS) + GAP_FRAMES;

        const from = currentFrame;
        currentFrame += slideDurationFrames;

        return (
          <Sequence key={slide.index} from={from} durationInFrames={slideDurationFrames}>
            <SlideWithTransition durationInFrames={slideDurationFrames}>
              {renderSlide(slide, themeColors, imageMap)}
            </SlideWithTransition>
          </Sequence>
        );
      })}
    </div>
  );
};
