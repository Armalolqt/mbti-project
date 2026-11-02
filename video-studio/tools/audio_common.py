"""音频工具共用函数：写 wav、简单混响、音符频率。只依赖 numpy。"""
import wave

import numpy as np

SR = 44100

NOTE_INDEX = {'C': 0, 'C#': 1, 'D': 2, 'D#': 3, 'E': 4, 'F': 5,
              'F#': 6, 'G': 7, 'G#': 8, 'A': 9, 'A#': 10, 'B': 11}


def note_freq(name: str) -> float:
    """'A4' -> 440.0，'C#5' -> 554.37"""
    pitch, octave = name[:-1], int(name[-1])
    midi = 12 * (octave + 1) + NOTE_INDEX[pitch]
    return 440.0 * 2 ** ((midi - 69) / 12)


def t_axis(seconds: float) -> np.ndarray:
    return np.arange(int(seconds * SR)) / SR


def reverb(x: np.ndarray, seconds: float = 1.2, wet: float = 0.25, seed: int = 7) -> np.ndarray:
    """用指数衰减噪声做冲激响应的卷积混响，够用且没有外部依赖。"""
    rng = np.random.default_rng(seed)
    n = int(seconds * SR)
    ir = rng.standard_normal(n) * np.exp(-np.linspace(0, 7, n))
    ir[0] = 0
    ir /= np.sqrt(np.sum(ir ** 2))
    size = len(x) + n - 1
    nfft = 1 << (size - 1).bit_length()
    y = np.fft.irfft(np.fft.rfft(x, nfft) * np.fft.rfft(ir, nfft), nfft)[:size]
    out = np.zeros(size)
    out[:len(x)] += x * (1 - wet)
    out += y * wet
    return out


def normalize(x: np.ndarray, peak: float = 0.89) -> np.ndarray:
    m = np.max(np.abs(x))
    return x if m == 0 else x * (peak / m)


def write_wav(path: str, x: np.ndarray, stereo: bool = True) -> None:
    x = np.clip(x, -1, 1)
    pcm = (x * 32767).astype('<i2')
    if stereo:
        pcm = np.repeat(pcm[:, None], 2, axis=1)
    with wave.open(path, 'wb') as w:
        w.setnchannels(2 if stereo else 1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())
