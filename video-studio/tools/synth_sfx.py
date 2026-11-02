"""第 3 步「配音效」：用代码合成《纪念碑谷》式的叮咚音效，输出到 public/sfx/。

音色：
  bell_<音名>    钟琴：光点出现、节点分裂
  marimba_<音名> 木琴：数字跳变、文字落定
  piano_<和弦>   柔和钢琴和弦：连线、收束
  boom           低频轰：片名、大转场
  whoosh         风声扫过：镜头推移
  tick           细小咔哒：计数器
  shimmer        高音闪光：金色高光、片名
  rise           上扬：揭晓前的铺垫

音阶用五声音阶（C D E G A），随便怎么叠都不会难听。
用法：python3 tools/synth_sfx.py [--out public/sfx]
"""
import argparse
import os
import sys

import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from audio_common import SR, note_freq, normalize, reverb, t_axis, write_wav  # noqa: E402

SCALE = ['C5', 'D5', 'E5', 'G5', 'A5', 'C6', 'D6', 'E6', 'G6', 'A6']


def bell(f, seconds=2.2):
    t = t_axis(seconds)
    partials = [(1, 1.0, 2.6), (2.76, 0.45, 5.5), (5.40, 0.22, 9), (8.93, 0.1, 14)]
    out = sum(a * np.sin(2 * np.pi * f * r * t) * np.exp(-t * d) for r, a, d in partials)
    return out * np.minimum(1, t / 0.002)


def marimba(f, seconds=1.0):
    t = t_axis(seconds)
    partials = [(1, 1.0, 7), (3.93, 0.35, 22), (9.2, 0.12, 45)]
    out = sum(a * np.sin(2 * np.pi * f * r * t) * np.exp(-t * d) for r, a, d in partials)
    return out * np.minimum(1, t / 0.003)


def piano_chord(notes, seconds=2.6):
    t = t_axis(seconds)
    out = np.zeros_like(t)
    for k, n in enumerate(notes):
        f = note_freq(n)
        delay = int(k * 0.018 * SR)  # 轻微琶音，更像手弹
        tone = (np.sin(2 * np.pi * f * t) + 0.4 * np.sin(4 * np.pi * f * t)
                + 0.15 * np.sin(6 * np.pi * f * t)) * np.exp(-t * 2.2)
        out[delay:] += tone[:len(t) - delay]
    return out * np.minimum(1, t / 0.004)


def boom(seconds=2.0):
    t = t_axis(seconds)
    freq = 42 + 30 * np.exp(-t * 6)
    body = np.sin(2 * np.pi * np.cumsum(freq) / SR) * np.exp(-t * 2.2)
    rng = np.random.default_rng(3)
    noise = rng.standard_normal(len(t))
    noise = np.convolve(noise, np.ones(60) / 60, mode='same') * np.exp(-t * 5) * 0.6
    return body + noise


def band_noise(seconds, lo_hz, hi_hz, seed=5):
    rng = np.random.default_rng(seed)
    n = len(t_axis(seconds))
    spec = np.fft.rfft(rng.standard_normal(n))
    freqs = np.fft.rfftfreq(n, 1 / SR)
    spec[(freqs < lo_hz) | (freqs > hi_hz)] = 0
    return np.fft.irfft(spec, n)


def whoosh(seconds=0.9):
    t = t_axis(seconds)
    env = np.sin(np.pi * np.clip(t / seconds, 0, 1)) ** 2
    lo = band_noise(seconds, 200, 1200)
    hi = band_noise(seconds, 1200, 6000, seed=6)
    mixw = np.clip(t / seconds, 0, 1)  # 由低到高扫过去
    return (lo * (1 - mixw) + hi * mixw) * env


def tick(seconds=0.12):
    t = t_axis(seconds)
    return (np.sin(2 * np.pi * 3200 * t) * np.exp(-t * 90)
            + 0.5 * np.sin(2 * np.pi * 5100 * t) * np.exp(-t * 140))


def shimmer(seconds=3.0):
    out = np.zeros(len(t_axis(seconds)))
    for k, n in enumerate(['C6', 'E6', 'G6', 'C7', 'E7']):
        b = bell(note_freq(n), seconds - 0.2)
        i = int(k * 0.045 * SR)
        out[i:i + len(b)] += b[:len(out) - i] * (0.7 ** k)
    return out


def rise(seconds=1.6):
    t = t_axis(seconds)
    freq = 220 * 2 ** (2 * t / seconds)
    tone = np.sin(2 * np.pi * np.cumsum(freq) / SR) * 0.4
    noise = band_noise(seconds, 2000, 8000) * 0.5
    env = (t / seconds) ** 2
    return (tone + noise) * env


def save(out_dir, name, x, verb=0.22, verb_len=1.4):
    y = reverb(x, verb_len, verb)
    # 去掉尾部静音
    thresh = 1e-4 * np.max(np.abs(y))
    last = np.max(np.nonzero(np.abs(y) > thresh)) if np.any(np.abs(y) > thresh) else len(y)
    write_wav(os.path.join(out_dir, f'{name}.wav'), normalize(y[:last + 1], 0.85), stereo=False)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--out', default='public/sfx')
    a = ap.parse_args()
    os.makedirs(a.out, exist_ok=True)
    for n in SCALE:
        save(a.out, f'bell_{n}', bell(note_freq(n)))
        save(a.out, f'marimba_{n}', marimba(note_freq(n)), verb=0.15)
    chords = {'Am': ['A3', 'C4', 'E4', 'A4'], 'F': ['F3', 'A3', 'C4', 'F4'],
              'C': ['C4', 'E4', 'G4', 'C5'], 'G': ['G3', 'B3', 'D4', 'G4']}
    for name, notes in chords.items():
        save(a.out, f'piano_{name}', piano_chord(notes), verb=0.3, verb_len=2.0)
    save(a.out, 'boom', boom(), verb=0.35, verb_len=2.5)
    save(a.out, 'whoosh', whoosh(), verb=0.2)
    save(a.out, 'tick', tick(), verb=0.1, verb_len=0.5)
    save(a.out, 'shimmer', shimmer(), verb=0.35, verb_len=2.5)
    save(a.out, 'rise', rise(), verb=0.25)
    files = sorted(os.listdir(a.out))
    print(f'已生成 {len(files)} 个音效到 {a.out}：', ', '.join(files))


if __name__ == '__main__':
    main()
