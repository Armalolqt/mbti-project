"""生成一首 112 BPM 的占位配乐（public/music.wav）。

只是为了在拿到真正的配乐之前把流程跑通：节拍清楚、氛围安静、带钢琴琶音。
拿到正式配乐后直接覆盖 public/music.wav（或用 analyze_beats.py 指定路径）即可。

用法：python3 tools/make_placeholder_music.py [--bpm 112] [--bars 22] [--out public/music.wav]
"""
import argparse
import os
import sys

import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from audio_common import SR, note_freq, normalize, reverb, t_axis, write_wav  # noqa: E402

# 小调循环 Am - F - C - G
PROGRESSION = [
    ['A2', 'A3', 'C4', 'E4'],
    ['F2', 'F3', 'A3', 'C4'],
    ['C3', 'G3', 'C4', 'E4'],
    ['G2', 'G3', 'B3', 'D4'],
]
ARP = [
    ['A4', 'C5', 'E5', 'A5'],
    ['F4', 'A4', 'C5', 'F5'],
    ['E4', 'G4', 'C5', 'E5'],
    ['D4', 'G4', 'B4', 'D5'],
]


def pad(freqs, seconds):
    t = t_axis(seconds)
    env = np.minimum(1, t / 0.35) * np.minimum(1, (seconds - t) / 0.4)
    out = np.zeros_like(t)
    for f in freqs:
        for detune in (-0.6, 0.6):
            ff = f + detune
            out += np.sin(2 * np.pi * ff * t) + 0.25 * np.sin(4 * np.pi * ff * t)
    return out * env / (len(freqs) * 2)


def piano(f, seconds=1.4):
    t = t_axis(seconds)
    env = np.exp(-t * 3.2) * np.minimum(1, t / 0.004)
    tone = (np.sin(2 * np.pi * f * t) + 0.45 * np.sin(4 * np.pi * f * t)
            + 0.18 * np.sin(6 * np.pi * f * t) + 0.08 * np.sin(8 * np.pi * f * t))
    return tone * env


def kick(seconds=0.35):
    t = t_axis(seconds)
    freq = 45 + 70 * np.exp(-t * 30)
    phase = 2 * np.pi * np.cumsum(freq) / SR
    return np.sin(phase) * np.exp(-t * 9)


def shaker(seconds=0.08, seed=1):
    rng = np.random.default_rng(seed)
    t = t_axis(seconds)
    n = rng.standard_normal(len(t))
    n = np.diff(n, prepend=0)  # 粗略高通
    return n * np.exp(-t * 60) * 0.5


def place(track, clip, start_s, gain=1.0):
    i = int(start_s * SR)
    j = min(len(track), i + len(clip))
    if i < len(track):
        track[i:j] += clip[:j - i] * gain


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--bpm', type=float, default=112)
    ap.add_argument('--bars', type=int, default=22)
    ap.add_argument('--out', default='public/music.wav')
    a = ap.parse_args()

    beat = 60 / a.bpm
    bar = beat * 4
    total = a.bars * bar + 2.5
    mix = np.zeros(int(total * SR))
    pads = np.zeros_like(mix)
    keys = np.zeros_like(mix)
    drums = np.zeros_like(mix)

    for b in range(a.bars):
        chord = b % 4
        place(pads, pad([note_freq(n) for n in PROGRESSION[chord]], bar + 0.4), b * bar)
        # 8 分音符琶音，最后两小节只留长音
        if b < a.bars - 2:
            for k in range(8):
                n = ARP[chord][[0, 1, 2, 3, 2, 1, 2, 3][k]]
                place(keys, piano(note_freq(n)), b * bar + k * beat / 2, 0.55 if k % 2 == 0 else 0.35)
        else:
            place(keys, piano(note_freq(ARP[chord][0]), 3.0), b * bar, 0.7)
        # 第 2 小节起进鼓：1、3 拍底鼓，反拍沙锤
        if 1 <= b < a.bars - 1:
            for k in range(4):
                if k in (0, 2):
                    place(drums, kick(), b * bar + k * beat, 0.9)
                place(drums, shaker(seed=b * 4 + k), b * bar + k * beat + beat / 2, 0.35)

    mix = 0.55 * pads + 0.5 * reverb(keys, 1.6, 0.35)[:len(mix)] + 0.6 * drums
    fade = int(2.0 * SR)
    mix[-fade:] *= np.linspace(1, 0, fade)
    os.makedirs(os.path.dirname(os.path.abspath(a.out)), exist_ok=True)
    write_wav(a.out, normalize(mix, 0.8))
    print(f'wrote {a.out}: {a.bpm} BPM, {a.bars} bars, {total:.1f}s')


if __name__ == '__main__':
    main()
