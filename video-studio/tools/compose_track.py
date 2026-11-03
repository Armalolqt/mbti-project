"""原创配乐生成器：抖音 DJ 风旋律 House（参考《We Never》DJ 版的速度、调性和结构，旋律原创）。

结构（默认 123 BPM，A 小调，Am–F–C–G）：
  前奏 8 小节（铺底 + 闷音拨弦，最后两小节扫频上升）
  高潮 A 8 小节（四拍底鼓、反拍低音、拍手、踩镲、拨弦主旋律）
  间奏 4 小节（钢琴旋律 + 铺底，扫频回到高潮）
  高潮 B 8 小节（主旋律叠高八度）
  尾奏 4 小节

用法：python3 tools/compose_track.py --out out/original_123bpm.mp3 [--bpm 123] [--seed 3]
依赖：numpy、scipy（装 librosa 时已带上）、ffmpeg（转 mp3）
"""
import argparse
import os
import subprocess
import sys

import numpy as np
from scipy.signal import butter, sosfilt

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from audio_common import SR, note_freq  # noqa: E402

CHORDS = {  # 根音（低音用）+ 和弦音
    'Am': ('A1', ['A3', 'C4', 'E4', 'A4']),
    'F': ('F1', ['F3', 'A3', 'C4', 'F4']),
    'C': ('C2', ['G3', 'C4', 'E4', 'G4']),
    'G': ('G1', ['G3', 'B3', 'D4', 'G4']),
}
PROG = ['Am', 'F', 'C', 'G']

# 主旋律（每小节 8 个八分音符，'-' = 延长，'.' = 休止）
MELODY = [
    ['E5', '-', 'C5', '-', 'A4', 'C5', 'D5', 'E5'],
    ['-', '-', 'F5', 'E5', 'D5', '-', 'C5', '-'],
    ['E5', '-', 'G5', '-', 'E5', 'D5', 'C5', 'D5'],
    ['-', '-', 'B4', '-', 'D5', '-', 'G4', '-'],
    ['E5', '-', 'C5', '-', 'A4', 'C5', 'D5', 'E5'],
    ['-', '-', 'A5', 'G5', 'F5', '-', 'E5', '-'],
    ['G5', '-', 'E5', '-', 'D5', '-', 'C5', 'D5'],
    ['E5', '-', '-', '-', '.', '.', 'D5', 'C5'],
]


# ---------------------------------------------------------------------------
def lp(x, hz, order=2):
    return sosfilt(butter(order, min(hz, SR / 2 * 0.95), 'low', fs=SR, output='sos'), x)


def hp(x, hz, order=2):
    return sosfilt(butter(order, hz, 'high', fs=SR, output='sos'), x)


def bp(x, lo, hi, order=2):
    return sosfilt(butter(order, [lo, hi], 'band', fs=SR, output='sos'), x)


def saw(f, n, phase0=0.0):
    """带 polyBLEP 抗混叠的锯齿波"""
    dt = f / SR
    ph = (phase0 + dt * np.arange(n)) % 1.0
    y = 2 * ph - 1
    m1 = ph < dt
    t1 = ph[m1] / dt
    y[m1] -= t1 + t1 - t1 * t1 - 1
    m2 = ph > 1 - dt
    t2 = (ph[m2] - 1) / dt
    y[m2] -= t2 * t2 + t2 + t2 + 1
    return y


def adsr(n, a, d, s, r_len, hold_n):
    env = np.zeros(n)
    a_n, d_n = max(1, int(a * SR)), max(1, int(d * SR))
    r_n = int(r_len * SR)
    i = 0
    seg = np.linspace(0, 1, a_n, endpoint=False)
    env[:min(n, a_n)] = seg[:min(n, a_n)]
    i = a_n
    if i < n:
        k = min(n - i, d_n)
        env[i:i + k] = np.linspace(1, s, d_n, endpoint=False)[:k]
        i += d_n
    if i < hold_n:
        env[i:min(hold_n, n)] = s
    start_r = min(max(hold_n, i), n)
    if start_r < n:
        k = min(n - start_r, r_n)
        level = env[start_r - 1] if start_r > 0 else s
        env[start_r:start_r + k] = np.linspace(level, 0, max(1, r_n), endpoint=False)[:k]
    return env


def add(track, clip, t0):
    i = int(round(t0 * SR))
    if i >= track.shape[-1]:
        return
    j = min(track.shape[-1], i + clip.shape[-1])
    track[..., i:j] += clip[..., :j - i]


def stereo(mono, width=0.0, delay_ms=0.0):
    """单声道 → 立体声；delay_ms 做哈斯效应加宽"""
    d = int(delay_ms * SR / 1000)
    left = mono
    right = np.concatenate([np.zeros(d), mono[:len(mono) - d]]) if d else mono
    mid = (left + right) / 2
    side = (left - right) / 2 * (1 + width)
    return np.stack([mid + side, mid - side])


def reverb_st(x, seconds=2.4, wet=0.3, seed=11):
    """立体声卷积混响（左右用不同噪声冲激响应）"""
    out = np.zeros((2, x.shape[1] + int(seconds * SR)))
    for ch in range(2):
        rng = np.random.default_rng(seed + ch)
        n = int(seconds * SR)
        ir = rng.standard_normal(n) * np.exp(-np.linspace(0, 6.5, n))
        ir = lp(ir, 7000)
        ir[:int(0.012 * SR)] = 0  # 预延迟
        ir /= np.sqrt(np.sum(ir ** 2))
        size = x.shape[1] + n - 1
        nfft = 1 << (size - 1).bit_length()
        y = np.fft.irfft(np.fft.rfft(x[ch], nfft) * np.fft.rfft(ir, nfft), nfft)[:size]
        out[ch, :x.shape[1]] += x[ch] * (1 - wet)
        out[ch, :size] += y * wet
    return out[:, :x.shape[1]]


def delay_st(x, time_s, fb=0.35, wet=0.25, tone=4000):
    """乒乓延迟"""
    d = int(time_s * SR)
    out = x.copy()
    tap = x.copy()
    for k in range(1, 6):
        tap = lp(tap, tone, 1) * fb
        shifted = np.zeros_like(x)
        shifted[:, d * k:] = tap[::-1 if k % 2 else 1, :x.shape[1] - d * k]
        out += shifted * wet / fb
    return out


# ---------------------------------------------------------------------------
def kick(n_sec=0.42):
    n = int(n_sec * SR)
    t = np.arange(n) / SR
    f = 46 + 110 * np.exp(-t * 32)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 7.5)
    click = hp(np.random.default_rng(1).standard_normal(n), 2500) * np.exp(-t * 260) * 0.35
    return np.tanh((body + click) * 1.6)


def clap(seed=2):
    n = int(0.45 * SR)
    t = np.arange(n) / SR
    noise = bp(np.random.default_rng(seed).standard_normal(n), 900, 5200)
    env = np.zeros(n)
    for off in (0, 0.009, 0.018):  # 拍手的三次叠击
        env += (t >= off) * np.exp(-np.maximum(0, t - off) * 55)
    env += np.exp(-t * 11) * 0.35
    return noise * env * 0.6


def hat(open_=False, seed=3):
    n = int((0.22 if open_ else 0.05) * SR)
    t = np.arange(n) / SR
    noise = hp(np.random.default_rng(seed).standard_normal(n), 7000, 3)
    return noise * np.exp(-t * (16 if open_ else 110)) * (0.5 if open_ else 0.3)


def crash():
    n = int(2.6 * SR)
    t = np.arange(n) / SR
    noise = hp(np.random.default_rng(9).standard_normal(n), 3500)
    return noise * np.exp(-t * 1.8) * 0.4


def riser(seconds):
    n = int(seconds * SR)
    t = np.arange(n) / SR
    noise = np.random.default_rng(5).standard_normal(n)
    # 分段扫频：低通截止频率逐步升高
    out = np.zeros(n)
    steps = 24
    for k in range(steps):
        a, b = k * n // steps, (k + 1) * n // steps
        cutoff = 300 * (40 ** (k / steps))
        seg = lp(noise[max(0, a - 2048):b], cutoff)[-(b - a):]
        out[a:b] = seg
    return out * (t / seconds) ** 2 * 0.5


def sub_bass(f, dur):
    n = int(dur * SR)
    t = np.arange(n) / SR
    env = adsr(n, 0.004, 0.08, 0.85, 0.03, int((dur - 0.03) * SR))
    tone = np.sin(2 * np.pi * f * t) + 0.25 * np.tanh(3 * np.sin(2 * np.pi * f * t))
    return tone * env


def pad_chord(notes, dur, cutoff=2400, seed=0):
    n = int(dur * SR)
    rng = np.random.default_rng(seed)
    left = np.zeros(n)
    right = np.zeros(n)
    for name in notes:
        f = note_freq(name)
        for v, det in enumerate(np.linspace(-0.18, 0.18, 6)):
            ff = f * 2 ** (det / 12)
            w = saw(ff, n, rng.random())
            (left if v % 2 == 0 else right)[:] += w
    env = adsr(n, 0.25, 0.4, 0.8, 0.6, int((dur - 0.6) * SR))
    st = np.stack([lp(left, cutoff), lp(right, cutoff)]) * env / (len(notes) * 4)
    return st


def pluck(f, dur, bright=1.0):
    n = int(max(dur, 0.5) * SR)
    t = np.arange(n) / SR
    w = 0.6 * saw(f, n) + 0.4 * saw(f * 1.005, n, 0.3)
    dark = lp(w, 900)
    br = lp(w, 900 + 5200 * bright)
    mixw = np.exp(-t * 14)  # 滤波包络：开头亮，迅速变暗
    tone = br * mixw + dark * (1 - mixw)
    env = np.exp(-t * 5.5) * np.minimum(1, t / 0.002)
    return tone * env


def piano(f, dur):
    n = int(max(dur, 1.8) * SR)
    t = np.arange(n) / SR
    tone = sum(a * np.sin(2 * np.pi * f * h * t) * np.exp(-t * (2.2 + h * 0.9))
               for h, a in [(1, 1), (2, 0.5), (3, 0.22), (4, 0.12), (5.02, 0.06)])
    hammer = hp(np.random.default_rng(int(f)).standard_normal(n), 2000) * np.exp(-t * 300) * 0.05
    return (tone + hammer) * np.minimum(1, t / 0.003)


# ---------------------------------------------------------------------------
def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--bpm', type=float, default=123)
    ap.add_argument('--out', default='out/original_123bpm.mp3')
    ap.add_argument('--style', default='dj', choices=['dj', 'soft'],
                    help='dj = DJ 版（重鼓、反拍低音、拨弦）；soft = 纯音乐版（钢琴主奏、轻鼓、长音低音）')
    a = ap.parse_args()
    soft = a.style == 'soft'

    beat = 60 / a.bpm
    bar = beat * 4
    e8 = beat / 2
    sections = [('intro', 8), ('dropA', 8), ('break', 4), ('dropB', 8), ('outro', 4)]
    bars = sum(n for _, n in sections)
    total = bars * bar + 3.0
    N = int(total * SR)

    drums = np.zeros((2, N))
    bass = np.zeros((2, N))
    pads = np.zeros((2, N))
    lead = np.zeros((2, N))
    keys = np.zeros((2, N))
    fx = np.zeros((2, N))

    K, CL = kick(), clap()
    HC, HO = hat(False), hat(True)

    # 每个小节属于哪一段
    plan = []
    for name, n in sections:
        plan += [(name, k, n) for k in range(n)]

    for b, (sec, k, n_in_sec) in enumerate(plan):
        t0 = b * bar
        chord = PROG[b % 4]
        root, notes = CHORDS[chord]
        mel = MELODY[b % 8]
        full = sec in ('dropA', 'dropB')

        # 铺底（全程；前奏和间奏更暗）
        cutoff = {'intro': 1500 + 1700 * k / 8, 'break': 1400, 'outro': 1200}.get(sec, 3200)
        add(pads, pad_chord(notes, bar + 0.6, cutoff, seed=b), t0)

        # 鼓
        if full or (sec == 'outro' and k < 2):
            for q in range(4):
                add(drums, stereo(K * (0.55 if soft else 1)), t0 + q * beat)
                add(drums, stereo(HO * (0.35 if soft else 0.8), 0.2, 6), t0 + q * beat + e8)
            for q in (1, 3):
                if not soft:
                    add(drums, stereo(CL, 0.3, 9), t0 + q * beat)
            for s16 in range(16):
                if s16 % 2 == 1 and not soft:
                    add(drums, stereo(HC * (0.6 + 0.4 * (s16 % 4 == 3)), 0.5, 3), t0 + s16 * beat / 4)
        if sec == 'intro' and k >= 4:  # 前奏后半段先进底鼓，铺垫
            for q in range(4):
                add(drums, stereo(K * 0.6), t0 + q * beat)

        # 低音：反拍 House 低音
        if full and soft:  # 纯音乐版：每小节一个长音低音
            add(bass, stereo(sub_bass(note_freq(root), bar) * 0.8), t0)
        elif full:
            f = note_freq(root)
            for q in range(4):
                add(bass, stereo(sub_bass(f, e8 * 0.95)), t0 + q * beat + e8)
                add(bass, stereo(sub_bass(f * 2, e8 * 0.4) * 0.25), t0 + q * beat + e8)

        # 主旋律
        if sec in ('intro', 'dropA', 'dropB', 'outro') and not soft:
            bright = {'intro': 0.35 + 0.45 * k / 8, 'outro': 0.3}.get(sec, 1.0)
            gain = {'intro': 0.75, 'outro': 0.5}.get(sec, 0.8)
            for s, name in enumerate(mel):
                if name in ('-', '.'):
                    continue
                hold = 1
                while s + hold < 8 and mel[s + hold] == '-':
                    hold += 1
                f = note_freq(name)
                add(lead, stereo(pluck(f, hold * e8, bright) * gain, 0.3, 4), t0 + s * e8)
                if sec == 'dropB':  # 叠高八度
                    add(lead, stereo(pluck(f * 2, hold * e8, 0.8) * 0.35, 0.6, 11), t0 + s * e8)

        # 间奏：钢琴
        if sec == 'break' or (soft and sec != 'intro') or (soft and sec == 'intro' and k >= 2):
            for s, name in enumerate(mel):
                if name in ('-', '.'):
                    continue
                add(keys, stereo(piano(note_freq(name), 1.8) * 0.7, 0.2, 5), t0 + s * e8)
            add(keys, stereo(piano(note_freq(root.replace('1', '3').replace('2', '3')), 2.4) * 0.5), t0)

        # 段落转场：扫频 + 镲
        if (sec == 'intro' and k == 6) or (sec == 'break' and k == 2):
            add(fx, stereo(riser(2 * bar), 0.6, 13), t0)
        if k == 0 and sec in ('dropA', 'dropB'):
            add(fx, stereo(crash(), 0.6, 15), t0)

    # 侧链压缩：铺底、低音、主旋律跟着底鼓「呼吸」
    t = np.arange(N) / SR
    phase = (t % beat) / beat
    duck = 0.25 + 0.75 * np.minimum(1, phase / 0.45) ** 1.5
    in_drop = np.zeros(N, dtype=bool)
    b0 = 0
    for name, n in sections:
        if name in ('dropA', 'dropB'):
            in_drop[int(b0 * bar * SR):int((b0 + n) * bar * SR)] = True
        b0 += n
    sc = np.where(in_drop, duck, 1.0)

    lead = delay_st(lead, beat * 0.75, fb=0.32, wet=0.22)
    lead = reverb_st(lead, 2.0, 0.22)
    keys = reverb_st(keys, 3.0, 0.38, seed=21)
    pads = reverb_st(pads, 2.8, 0.3, seed=31)
    fx = reverb_st(fx, 2.5, 0.3, seed=41)
    drums = drums + 0.15 * reverb_st(hp(drums, 400), 1.2, 1.0, seed=51)  # 一点房间感
    # 低音以外的轨道切掉 120Hz 以下，避免和底鼓、低音打架
    pads, lead, keys = (hp(x, 120) for x in (pads, lead, keys))

    if soft:
        sc = 0.6 + 0.4 * sc  # 纯音乐版呼吸感轻一些
    mix = (0.95 * drums + 0.9 * bass * sc + 0.72 * pads * sc + 0.75 * lead * (0.55 + 0.45 * sc)
           + (0.85 if soft else 0.6) * keys + 0.5 * fx)
    # 母带：软削波 + 归一化
    mix /= np.max(np.abs(mix)) + 1e-9
    mix = np.tanh(mix * 1.8) / np.tanh(1.8)
    fade = int(2.5 * SR)
    mix[:, -fade:] *= np.linspace(1, 0, fade)
    mix *= 0.82  # 留出余量，mp3 编码后峰值在 -1 dBFS 左右

    os.makedirs(os.path.dirname(os.path.abspath(a.out)), exist_ok=True)
    wav = os.path.splitext(a.out)[0] + '.wav'
    pcm = (np.clip(mix.T, -1, 1) * 32767).astype('<i2')
    import wave
    with wave.open(wav, 'wb') as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())
    if a.out.endswith('.mp3'):
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', wav, '-b:a', '320k', a.out], check=True)
        os.remove(wav)
    print(f'完成：{a.out}  {a.bpm} BPM，{bars} 小节，{total:.1f} 秒')


if __name__ == '__main__':
    main()
