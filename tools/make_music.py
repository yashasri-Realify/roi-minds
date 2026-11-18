"""Original background music for the films, synthesised from scratch (no samples, so nothing to license).
A soft pad, a slow arpeggio and a quiet pulse over a four-chord loop; each film gets its own key and tempo.
Usage: python3 tools/make_music.py [A1 B2 ...]   -> music/<id>.wav (44.1 kHz stereo, 16-bit)"""
import sys, wave
import numpy as np

SR = 44100
FILMS = {"A1": 30, "A2": 30, "A3": 28, "B1": 32, "B2": 30, "B3": 30, "B4": 28, "C1": 32, "C2": 28, "D1": 32, "D2": 30}
# id -> (root midi note, bpm, chord order). Minor-ish and major-ish moods, all gentle.
STYLE = {
    "A1": (57, 92, [0, 3, 4, 2]), "A2": (59, 96, [0, 4, 5, 3]), "A3": (55, 88, [0, 5, 3, 4]),
    "B1": (60, 94, [0, 3, 4, 5]), "B2": (57, 90, [0, 5, 3, 4]), "B3": (62, 98, [0, 4, 3, 5]),
    "B4": (55, 92, [0, 3, 5, 4]), "C1": (59, 100, [0, 5, 4, 3]), "C2": (60, 86, [0, 4, 5, 3]),
    "D1": (57, 96, [0, 3, 4, 5]), "D2": (62, 94, [0, 5, 3, 4]),
}
# scale-degree triads (semitone offsets from root, natural minor): i, III, iv, v, VI, VII
CHORDS = {0: (0, 3, 7), 2: (3, 7, 10), 3: (5, 8, 12), 4: (7, 10, 14), 5: (8, 12, 15)}


def hz(m): return 440.0 * 2 ** ((m - 69) / 12)


def tone(freq, n, harm=(1.0, 0.5, 0.25, 0.12)):
    t = np.arange(n) / SR
    return sum(a * np.sin(2 * np.pi * freq * (k + 1) * t) for k, a in enumerate(harm))


def render(fid, dur):
    root, bpm, order = STYLE[fid]
    n = int(dur * SR)
    beat = 60.0 / bpm
    bar = 4 * beat
    out = np.zeros((2, n))
    rng = np.random.default_rng(sum(map(ord, fid)))
    for b in range(int(dur / bar) + 1):
        chord = CHORDS[order[b % 4]]
        s0 = int(b * bar * SR)
        if s0 >= n: break
        L = min(int(bar * SR) + int(0.8 * SR), n - s0)
        env = np.minimum(1, np.arange(L) / (0.6 * SR)) * np.exp(-np.maximum(0, np.arange(L) / SR - bar) * 3)
        for i, semi in enumerate(chord):                      # pad: each note a pair of slightly detuned tones
            f = hz(root + semi - 12)
            for det, pan in ((0.997, 0.35), (1.003, 0.65)):
                w = tone(f * det, L, (1.0, 0.35, 0.12)) * env * 0.075
                out[0, s0:s0 + L] += w * (1 - pan); out[1, s0:s0 + L] += w * pan
        bass = tone(hz(root + chord[0] - 24), L, (1.0, 0.3)) * env * 0.16
        out[0, s0:s0 + L] += bass; out[1, s0:s0 + L] += bass
        for q in range(8):                                    # arpeggio, eighth notes, a calm pluck
            st = s0 + int(q * beat / 2 * SR)
            if st >= n: break
            semi = chord[[0, 1, 2, 1, 2, 1, 0, 1][q]] + 12 + (12 if q in (3, 6) else 0)
            Ln = min(int(1.4 * SR), n - st)
            pl = tone(hz(root + semi), Ln, (1.0, 0.4, 0.15)) * np.exp(-np.arange(Ln) / SR * 3.2) * 0.07
            pan = 0.3 + 0.4 * ((q * 37) % 10) / 10
            out[0, st:st + Ln] += pl * (1 - pan); out[1, st:st + Ln] += pl * pan
        for q in range(4):                                    # soft pulse on each beat, plus a quiet shaker off-beat
            st = s0 + int(q * beat * SR)
            if st >= n: break
            Ln = min(int(0.28 * SR), n - st)
            tt = np.arange(Ln) / SR
            kick = np.sin(2 * np.pi * (52 + 70 * np.exp(-tt * 30)) * tt) * np.exp(-tt * 14) * 0.2
            out[0, st:st + Ln] += kick; out[1, st:st + Ln] += kick
            sh = s0 + int((q + 0.5) * beat * SR)
            if sh < n:
                Lh = min(int(0.05 * SR), n - sh)
                noise = rng.standard_normal(Lh) * np.exp(-np.arange(Lh) / SR * 70) * 0.018
                out[0, sh:sh + Lh] += noise; out[1, sh:sh + Lh] += noise
    # light reverb: convolve with a decaying noise tail, mixed under the dry signal
    ir_n = int(1.6 * SR)
    ir = rng.standard_normal((2, ir_n)) * np.exp(-np.arange(ir_n) / SR * 2.6)
    size = 1 << int(np.ceil(np.log2(n + ir_n)))
    wet = np.stack([np.fft.irfft(np.fft.rfft(out[c], size) * np.fft.rfft(ir[c], size), size)[:n] for c in (0, 1)])
    wet *= 0.10 * np.abs(out).max() / max(np.abs(wet).max(), 1e-9)
    out = out + wet
    fade_in, fade_out = int(1.6 * SR), int(3.0 * SR)          # fade in, and out so the loop of the film ends cleanly
    out[:, :fade_in] *= np.linspace(0, 1, fade_in) ** 2
    out[:, -fade_out:] *= np.linspace(1, 0, fade_out) ** 2
    out *= 0.55 / np.abs(out).max()
    return (out.T * 32767).astype("<i2")


for fid in (sys.argv[1:] or FILMS):
    pcm = render(fid, FILMS[fid])
    with wave.open(f"music/{fid}.wav", "wb") as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
    print(fid, FILMS[fid], "s")
