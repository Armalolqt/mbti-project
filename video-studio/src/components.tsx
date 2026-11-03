import React, {useEffect, useState} from 'react';
import {
  AbsoluteFill,
  Audio,
  continueRender,
  delayRender,
  interpolate,
  Sequence,
  staticFile,
  useCurrentFrame,
} from 'remotion';
import '@fontsource/noto-serif-sc/300.css';
import '@fontsource/noto-serif-sc/500.css';
import '@fontsource/noto-sans-sc/300.css';
import '@fontsource/noto-sans-sc/500.css';
import {CAPTIONS, CHAPTERS, CUES, MUSIC_FILE, SCENES, SERIES, SFX_GAIN, TYPES} from './film';
import {C, glow, SANS, SERIF} from './theme';
import {bf, lerp, ramp} from './timing';

// ---------------------------------------------------------------------------
// 字体：思源宋体/黑体按字切片加载。渲染前把片中所有用到的字先加载好，避免某帧闪出默认字体。
const ALL_TEXT = [
  ...CAPTIONS.flatMap((c) => [c.zh, c.en ?? '']),
  ...CHAPTERS,
  ...Object.values(SERIES),
  ...TYPES.flat().flatMap((t) => [t.code, t.name]),
  '十六型人格 MBTI 它从哪里来 WHERE THE SIXTEEN TYPES COME FROM 内倾外倾感觉直觉思维情感判断感知',
  '凯瑟琳布里格斯伊莎贝尔迈尔斯第一版问卷心理类型 TYPE INDICATOR FORM A 0123456789×→·「」《》，。：',
  '下一集你的四个字母到底准不准？完 维度 每个二选一 1943 1921',
].join('');

export const FontGate: React.FC = () => {
  const [handle] = useState(() => delayRender('加载字体'));
  useEffect(() => {
    const loads = ['300', '500'].flatMap((w) => [
      document.fonts.load(`${w} 40px "Noto Serif SC"`, ALL_TEXT),
      document.fonts.load(`${w} 40px "Noto Sans SC"`, ALL_TEXT),
    ]);
    Promise.all(loads)
      .then(() => document.fonts.ready)
      .then(() => continueRender(handle))
      .catch(() => continueRender(handle));
  }, [handle]);
  return null;
};

// ---------------------------------------------------------------------------
export const Background: React.FC = () => {
  const frame = useCurrentFrame();
  // 极慢的光斑漂移，让画面「呼吸」
  const x = 50 + Math.sin(frame / 160) * 6;
  const y = 46 + Math.cos(frame / 200) * 4;
  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(ellipse 75% 70% at ${x}% ${y}%, ${C.bgCenter} 0%, #0b1222 45%, ${C.bgEdge} 100%)`,
      }}
    >
      {/* 细颗粒 */}
      <AbsoluteFill
        style={{
          opacity: 0.06,
          backgroundImage:
            'radial-gradient(rgba(255,255,255,0.9) 0.6px, transparent 0.6px)',
          backgroundSize: '3px 3px',
          backgroundPosition: `${(frame * 7) % 3}px ${(frame * 5) % 3}px`,
        }}
      />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
const Corner: React.FC<{x: 'left' | 'right'; y: 'top' | 'bottom'; p: number}> = ({x, y, p}) => {
  const len = 46 * p;
  const s: React.CSSProperties = {position: 'absolute', [x]: 34, [y]: 34, width: len, height: len};
  return (
    <div style={s}>
      <div style={{position: 'absolute', [y]: 0, [x]: 0, width: len, height: 2, background: C.goldSoft}} />
      <div style={{position: 'absolute', [y]: 0, [x]: 0, width: 2, height: len, background: C.goldSoft}} />
    </div>
  );
};

const label: React.CSSProperties = {
  position: 'absolute',
  fontFamily: SANS,
  fontWeight: 300,
  fontSize: 17,
  letterSpacing: '0.35em',
  color: C.dim,
};

/** 取景框 HUD：四角细线、英文小标签、底部章节进度点 */
export const Hud: React.FC<{total: number}> = ({total}) => {
  const frame = useCurrentFrame();
  const p = ramp(frame, 0, 18);
  const chapterIdx = SCENES.filter((s) => bf(s.start) <= frame).slice(-1)[0]?.chapter ?? 0;
  const progress = Math.min(1, frame / total);
  return (
    <AbsoluteFill style={{opacity: p}}>
      <Corner x="left" y="top" p={p} />
      <Corner x="right" y="top" p={p} />
      <Corner x="left" y="bottom" p={p} />
      <Corner x="right" y="bottom" p={p} />
      <div style={{...label, left: 60, top: 52}}>{SERIES.topLeft}</div>
      <div
        style={{
          ...label,
          right: 60,
          top: 46,
          fontFamily: SERIF,
          fontWeight: 500,
          fontSize: 24,
          letterSpacing: '0.28em',
          color: 'rgba(236, 230, 214, 0.62)',
        }}
      >
        {SERIES.channel}
      </div>

      {/* 左下：系列名 | 本集 */}
      <div style={{...label, left: 60, bottom: 58, letterSpacing: '0.12em', fontSize: 20}}>
        <span style={{color: C.gold, fontWeight: 500}}>{SERIES.name}</span>
        <span style={{margin: '0 14px', color: C.line}}>|</span>
        <span>{SERIES.episode}</span>
      </div>

      {/* 右下：章节 */}
      <div style={{position: 'absolute', right: 60, bottom: 52, display: 'flex', gap: 26, alignItems: 'center'}}>
        {CHAPTERS.map((c, i) => (
          <div key={c} style={{display: 'flex', alignItems: 'center', gap: 9}}>
            <div
              style={{
                width: i === chapterIdx ? 9 : 5,
                height: i === chapterIdx ? 9 : 5,
                borderRadius: 9,
                background: i <= chapterIdx ? C.gold : C.line,
                boxShadow: i === chapterIdx ? glow(C.gold, 8) : 'none',
              }}
            />
            <span
              style={{
                fontFamily: SANS,
                fontSize: 16,
                letterSpacing: '0.1em',
                color: i === chapterIdx ? C.gold : C.dim,
                opacity: i === chapterIdx ? 1 : 0.6,
              }}
            >
              {String(i + 1).padStart(2, '0')} {c}
            </span>
          </div>
        ))}
      </div>

      {/* 底部细进度线 */}
      <div style={{position: 'absolute', left: 60, right: 60, bottom: 36, height: 1, background: C.line}}>
        <div style={{width: `${progress * 100}%`, height: 1, background: C.goldSoft}} />
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
/** 底部字幕：中文一行 + 英文副行，在拍点上淡入 */
export const Captions: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill>
      {CAPTIONS.map((c) => {
        const a = bf(c.beat);
        const b = bf(c.end);
        if (frame < a - 2 || frame > b + 2) return null;
        const o = Math.min(ramp(frame, a, 8), 1 - ramp(frame, b - 6, 6));
        const rise = (1 - ramp(frame, a, 12)) * 10;
        return (
          <div
            key={c.beat}
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 128,
              textAlign: 'center',
              opacity: o,
              transform: `translateY(${rise}px)`,
            }}
          >
            <div
              style={{
                fontFamily: SERIF,
                fontWeight: 500,
                fontSize: 40,
                letterSpacing: '0.08em',
                color: C.text,
                textShadow: '0 2px 18px rgba(0,0,0,0.6)',
              }}
            >
              {c.zh}
            </div>
            {c.en ? (
              <div
                style={{
                  marginTop: 10,
                  fontFamily: SERIF,
                  fontStyle: 'italic',
                  fontWeight: 300,
                  fontSize: 20,
                  letterSpacing: '0.04em',
                  color: C.dim,
                }}
              >
                {c.en}
              </div>
            ) : null}
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
/** 音乐 + 所有音效 */
export const SoundTrack: React.FC<{total: number; lastBeat: number}> = ({total, lastBeat}) => {
  return (
    <>
      <Audio
        src={staticFile(MUSIC_FILE)}
        volume={(f) =>
          0.75 * interpolate(f, [total - 45, total], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})
        }
      />
      {CUES.filter((c) => c.beat < lastBeat).map((c, i) => (
        <Sequence key={`${c.beat}-${c.sfx}-${i}`} from={bf(c.beat)} durationInFrames={120} layout="none">
          <Audio src={staticFile(`sfx/${c.sfx}.wav`)} volume={(c.vol ?? 0.5) * SFX_GAIN} />
        </Sequence>
      ))}
    </>
  );
};

// ---------------------------------------------------------------------------
export const GlowDot: React.FC<{size?: number; color?: string; style?: React.CSSProperties}> = ({
  size = 14,
  color = C.gold,
  style,
}) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: size,
      background: `radial-gradient(circle, #fff6dc 0%, ${color} 45%, rgba(232,194,106,0) 100%)`,
      boxShadow: glow(color, size * 1.2),
      ...style,
    }}
  />
);

/** 场景整体淡入淡出 */
export const SceneFade: React.FC<{dur: number; children: React.ReactNode; fadeIn?: number; fadeOut?: number}> = ({
  dur,
  children,
  fadeIn = 6,
  fadeOut = 8,
}) => {
  const frame = useCurrentFrame();
  const o = Math.min(fadeIn ? ramp(frame, 0, fadeIn) : 1, 1 - lerp(frame, dur - fadeOut, dur, 0, 1));
  return <AbsoluteFill style={{opacity: o}}>{children}</AbsoluteFill>;
};
