"""第 2 步「卡点」：分析配乐，测 BPM 和每个重拍的时间，写到 src/data/beats.json。

画面代码只认 beats.json 里的「拍号」，所以换一首歌只要重跑这个脚本，所有切换会自动对齐新节拍。

用法：python3 tools/analyze_beats.py public/music.wav [--out src/data/beats.json] [--fps 30]
依赖：pip install librosa
"""
import argparse
import json
import os

import librosa
import numpy as np


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('audio')
    ap.add_argument('--out', default='src/data/beats.json')
    ap.add_argument('--fps', type=int, default=30)
    a = ap.parse_args()

    y, sr = librosa.load(a.audio, sr=22050, mono=True)
    duration = len(y) / sr
    onset_env = librosa.onset.onset_strength(y=y, sr=sr)
    tempo, frames = librosa.beat.beat_track(onset_envelope=onset_env, sr=sr)
    tempo = float(np.atleast_1d(tempo)[0])
    beats = librosa.frames_to_time(frames, sr=sr)

    period = 60 / tempo

    # 节拍跟踪偶尔会锁在「反拍」上（被沙锤、八分音符琶音带偏）。
    # 正拍通常有底鼓/贝斯，所以用低频（<200Hz）起音强度比较「原位」和「挪半拍」，取更强的一边。
    low_env = librosa.onset.onset_strength(y=y, sr=sr, fmax=200, n_mels=32)

    def score(times, env):
        idx = np.clip(librosa.time_to_frames(times, sr=sr), 0, len(env) - 1)
        # 允许 ±2 帧（≈46ms）误差
        return float(np.mean([env[max(0, i - 2):i + 3].max() for i in idx]))

    shifted = beats + period / 2
    shifted = shifted[shifted < duration]
    if len(shifted) and score(shifted, low_env) > 1.15 * score(beats, low_env):
        beats = shifted
        shift_note = '（已从反拍校正到正拍）'
    else:
        shift_note = ''

    # 拍子太少时（比如前奏很安静）用 BPM 往前补齐，保证从第 0 秒附近就有拍可踩
    while len(beats) and beats[0] - period > -0.02:
        beats = np.insert(beats, 0, max(0.0, beats[0] - period))

    # 估计小节第一拍（强拍）：看哪个相位上低频起音最强
    low_strength = np.array([score([b], low_env) for b in beats])
    phase_score = [low_strength[p::4].mean() if len(low_strength[p::4]) else 0 for p in range(4)]
    phase = int(np.argmax(phase_score))
    downbeats = beats[phase::4]
    strength = np.array([score([b], onset_env) for b in beats])

    # 每拍的相对强度（0~1），画面上可用来决定哪一拍做大动作
    s = (strength - strength.min()) / (np.ptp(strength) or 1)

    data = {
        'source': os.path.basename(a.audio),
        'fps': a.fps,
        'bpm': round(tempo, 2),
        'duration': round(duration, 3),
        'beatPhaseOfDownbeat': phase,
        'beats': [round(float(b), 3) for b in beats],
        'beatFrames': [int(round(b * a.fps)) for b in beats],
        'downbeats': [round(float(b), 3) for b in downbeats],
        'strength': [round(float(v), 3) for v in s],
    }
    os.makedirs(os.path.dirname(os.path.abspath(a.out)), exist_ok=True)
    with open(a.out, 'w') as f:
        json.dump(data, f, ensure_ascii=False, indent=1)

    print(f'BPM ≈ {tempo:.1f}{shift_note}，共 {len(beats)} 拍，时长 {duration:.1f}s，强拍相位 {phase}')
    print('前 16 个拍点（秒）：', ', '.join(f'{b:.2f}' for b in beats[:16]))
    print('强拍（秒）：', ', '.join(f'{b:.2f}' for b in downbeats[:12]), '…')
    print(f'已写入 {a.out}')


if __name__ == '__main__':
    main()
