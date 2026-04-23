import { registerRoot } from 'remotion';
import React from 'react';
import { Composition } from 'remotion';
import { VideoComposition } from './VideoComposition';
import { SLIDE_WIDTH, SLIDE_HEIGHT, FPS } from './theme';

// Load Premium Typography
import { loadFont as loadJakarta } from '@remotion/google-fonts/PlusJakartaSans';
import { loadFont as loadInter } from '@remotion/google-fonts/Inter';

loadJakarta("normal", {
  weights: ["400", "500", "600", "700", "800"],
  subsets: ["latin"],
});

loadInter("normal", {
  weights: ["400", "500", "600", "700"],
  subsets: ["latin"],
});

/**
 * Remotion entry point — registers the composition via registerRoot().
 * This file is bundled by @remotion/bundler before rendering.
 *
 * inputProps are provided at render time from renderVideoRemotion.js
 */
const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="CourseVideo"
        component={VideoComposition as React.FC<any>}
        durationInFrames={300} // Placeholder — overridden at render time
        fps={FPS}
        width={SLIDE_WIDTH}
        height={SLIDE_HEIGHT}
        defaultProps={{
          slides: [],
          audioDurations: [],
          theme: 'default',
          imageMap: {},
        }}
      />
    </>
  );
};

registerRoot(RemotionRoot);
