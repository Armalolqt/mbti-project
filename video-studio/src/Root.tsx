import React from 'react';
import {AbsoluteFill, Composition, Sequence} from 'remotion';
import {Background, Captions, FontGate, Hud, SceneFade, SoundTrack} from './components';
import {FILM_BEATS, OPENING_BEATS, SCENES} from './film';
import {SCENE_COMPONENTS} from './scenes';
import {FPS, H, W} from './theme';
import {bf} from './timing';

const Film: React.FC<{lastBeat: number}> = ({lastBeat}) => {
  const total = bf(lastBeat);
  return (
    <AbsoluteFill>
      <FontGate />
      <Background />
      {SCENES.filter((s) => s.start < lastBeat).map((s) => {
        const Scene = SCENE_COMPONENTS[s.id];
        const from = bf(s.start);
        const dur = bf(s.end) - from;
        return (
          <Sequence key={s.id} from={from} durationInFrames={dur} name={s.id}>
            <SceneFade dur={dur} fadeIn={s.start === 0 ? 0 : 6}>
              <Scene start={s.start} />
            </SceneFade>
          </Sequence>
        );
      })}
      <Captions />
      <Hud total={bf(FILM_BEATS)} />
      <SoundTrack total={total} lastBeat={lastBeat} />
    </AbsoluteFill>
  );
};

export const RemotionRoot: React.FC = () => (
  <>
    {/* 第 4 步「试片」：先只渲染开头 ~10 秒 */}
    <Composition
      id="Opening10s"
      component={Film}
      durationInFrames={bf(OPENING_BEATS)}
      fps={FPS}
      width={W}
      height={H}
      defaultProps={{lastBeat: OPENING_BEATS}}
    />
    <Composition
      id="Film"
      component={Film}
      durationInFrames={bf(FILM_BEATS)}
      fps={FPS}
      width={W}
      height={H}
      defaultProps={{lastBeat: FILM_BEATS}}
    />
  </>
);
