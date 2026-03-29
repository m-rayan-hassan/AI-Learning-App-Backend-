import React from 'react';
import { useCurrentFrame, interpolate, Sequence, useVideoConfig } from 'remotion';
import { TitleSlide } from './slides/TitleSlide';
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
}

interface TitleSlideData extends BaseSlide {
  layout: 'title';
  title: string;
  subtitle?: string;
}

interface SplitScreenSlideData extends BaseSlide {
  layout: 'splitscreen';
  title: string;
  bullets: string[];
  imagePrompt?: string;
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
  imagePrompt?: string;
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
}

/**
 * Renders a single slide based on its layout type
 */
const renderSlide = (slide: SlideData, themeColors: ThemeColors): React.ReactNode => {
  switch (slide.layout) {
    case 'title':
      return <TitleSlide title={slide.title} subtitle={slide.subtitle} themeColors={themeColors} />;
    case 'splitscreen':
      return <SplitScreenSlide title={slide.title} bullets={slide.bullets} imagePrompt={slide.imagePrompt} themeColors={themeColors} />;
    case 'bullets':
      return <BulletPointSlide title={slide.title} bullets={slide.bullets} themeColors={themeColors} />;
    case 'flowchart':
      return <FlowchartSlide title={slide.title} steps={slide.steps} themeColors={themeColors} />;
    case 'comparison':
      return <ComparisonSlide title={slide.title} columns={slide.columns} themeColors={themeColors} />;
    case 'timeline':
      return <TimelineSlide title={slide.title} events={slide.events} themeColors={themeColors} />;
    case 'bignumber':
      return <BigNumberSlide title={slide.title} number={slide.number} unit={slide.unit} description={slide.description} themeColors={themeColors} />;
    case 'quote':
      return <QuoteSlide quote={slide.quote} author={slide.author} themeColors={themeColors} />;
    case 'code':
      return <CodeSlide title={slide.title} code={slide.code} language={slide.language} explanation={slide.explanation} themeColors={themeColors} />;
    case 'icongrid':
      return <IconGridSlide title={slide.title} items={slide.items} themeColors={themeColors} />;
    case 'pyramid':
      return <PyramidSlide title={slide.title} levels={slide.levels} themeColors={themeColors} />;
    case 'proscons':
      return <ProsConsSlide title={slide.title} pros={slide.pros} cons={slide.cons} themeColors={themeColors} />;
    case 'definition':
      return <DefinitionSlide term={slide.term} definition={slide.definition} example={slide.example} themeColors={themeColors} />;
    case 'table':
      return <TableSlide title={slide.title} headers={slide.headers} rows={slide.rows} themeColors={themeColors} />;
    case 'section':
      return <SectionDividerSlide sectionNumber={slide.sectionNumber} title={slide.title} subtitle={slide.subtitle} themeColors={themeColors} />;
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
 */
export const VideoComposition: React.FC<VideoCompositionProps> = ({ slides, audioDurations, theme: themeName }) => {
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
              {renderSlide(slide, themeColors)}
            </SlideWithTransition>
          </Sequence>
        );
      })}
    </div>
  );
};
