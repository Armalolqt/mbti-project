import {Easing, interpolate, spring} from 'remotion';
import beatsData from './data/beats.json';
import {FPS} from './theme';

// 所有时间都用「拍」来写：换一首歌、重跑 analyze_beats.py，画面会自动对齐新节拍。
const beats: number[] = beatsData.beats;
const period = 60 / beatsData.bpm;

export const BPM = beatsData.bpm;

/** 第 i 拍的时间（秒）。超出音乐长度时按 BPM 外推；支持小数拍（如 2.5 = 第 2 拍和第 3 拍正中间）。 */
export const beatTime = (i: number): number => {
  const at = (k: number) =>
    k < beats.length ? beats[k] : beats[beats.length - 1] + (k - beats.length + 1) * period;
  const fl = Math.floor(i);
  return at(fl) + (i - fl) * (at(fl + 1) - at(fl));
};

/** 第 i 拍对应的帧号 */
export const bf = (i: number): number => Math.round(beatTime(i) * FPS);

const easeOut = Easing.bezier(0.16, 1, 0.3, 1);

/** 从 at 帧开始，dur 帧内由 0 到 1（缓出） */
export const ramp = (frame: number, at: number, dur = 10) =>
  interpolate(frame, [at, at + dur], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: easeOut,
  });

/** 弹性出现（略过冲） */
export const pop = (frame: number, at: number, fps = FPS, damping = 13) =>
  spring({frame: frame - at, fps, config: {damping, mass: 0.6, stiffness: 140}});

/** 在 [a, b] 帧之间线性取值 */
export const lerp = (frame: number, a: number, b: number, from: number, to: number) =>
  interpolate(frame, [a, b], [from, to], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
