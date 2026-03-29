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
import { SLIDE_WIDTH, SLIDE_HEIGHT, FPS, TRANSITION_FRAMES, theme } from './theme';

/**
 * Slide data types matching LLM output format
 */
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
}

interface CodeSlideData extends BaseSlide {
  layout: 'code';
  title: string;
  code: string;
  language?: string;
  explanation?: string;
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
  | CodeSlideData;

interface AudioDuration {
  index: number;
  duration: number;
}

export interface VideoCompositionProps {
  slides: SlideData[];
  audioDurations: AudioDuration[];
}

/**
 * Renders a single slide based on its layout type
 */
const renderSlide = (slide: SlideData): React.ReactNode => {
  switch (slide.layout) {
    case 'title':
      return <TitleSlide title={slide.title} subtitle={slide.subtitle} />;
    case 'splitscreen':
      return <SplitScreenSlide title={slide.title} bullets={slide.bullets} imagePrompt={slide.imagePrompt} />;
    case 'bullets':
      return <BulletPointSlide title={slide.title} bullets={slide.bullets} />;
    case 'flowchart':
      return <FlowchartSlide title={slide.title} steps={slide.steps} />;
    case 'comparison':
      return <ComparisonSlide title={slide.title} columns={slide.columns} />;
    case 'timeline':
      return <TimelineSlide title={slide.title} events={slide.events} />;
    case 'bignumber':
      return <BigNumberSlide title={slide.title} number={slide.number} unit={slide.unit} description={slide.description} />;
    case 'quote':
      return <QuoteSlide quote={slide.quote} author={slide.author} />;
    case 'code':
      return <CodeSlide title={slide.title} code={slide.code} language={slide.language} explanation={slide.explanation} />;
    default:
      // Fallback: render as a bullet slide if layout not recognized
      return <BulletPointSlide title={(slide as any).title || 'Slide'} bullets={(slide as any).bullets || []} />;
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

  // Fade in (first 0.5s)
  const enterOpacity = interpolate(frame, [0, TRANSITION_FRAMES], [0, 1], {
    extrapolateRight: 'clamp',
  });

  // Fade out (last 0.5s)
  const exitOpacity = interpolate(
    frame,
    [durationInFrames - TRANSITION_FRAMES, durationInFrames],
    [1, 0],
    { extrapolateLeft: 'clamp' }
  );

  // Subtle scale on enter
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
 * Main video composition — sequences all slides
 */
export const VideoComposition: React.FC<VideoCompositionProps> = ({ slides, audioDurations }) => {
  let currentFrame = 0;

  // Map audio durations by slide index for easy lookup
  const durationMap = new Map<number, number>();
  audioDurations.forEach((ad) => durationMap.set(ad.index, ad.duration));

  // Gap between slides (2 seconds, matches the silence track in stitcher.js)
  const GAP_SECONDS = 2;
  const GAP_FRAMES = Math.ceil(GAP_SECONDS * FPS);

  return (
    <div style={{ width: SLIDE_WIDTH, height: SLIDE_HEIGHT, backgroundColor: theme.colors.bg }}>
      {slides.map((slide, i) => {
        // Duration = audio duration for this slide + gap
        const audioDuration = durationMap.get(slide.index) || 8; // fallback 8s
        const slideDurationFrames = Math.ceil(audioDuration * FPS) + GAP_FRAMES;

        const from = currentFrame;
        currentFrame += slideDurationFrames;

        return (
          <Sequence key={slide.index} from={from} durationInFrames={slideDurationFrames}>
            <SlideWithTransition durationInFrames={slideDurationFrames}>
              {renderSlide(slide)}
            </SlideWithTransition>
          </Sequence>
        );
      })}
    </div>
  );
};
