"""Original 60 s, 120 BPM soundtrack for the Playzy promo, synthesized from scratch.

Every hit/whoosh is placed on the same timestamps the video uses (see promo.html):
scene cuts every bar (2 s), swipe cuts at 8/16/40/44/54, game pushes every 4 s from 16-40.
Writes soundtrack.wav (44.1 kHz, 16-bit stereo).
"""
import sys
import wave
import numpy as np

SR = 44100
BPM = 120
BEAT = 60 / BPM          # 0.5 s
BAR = BEAT * 4           # 2 s
DUR = 60.0
N = int(SR * DUR)
rng = np.random.default_rng(11)

dry = np.zeros((N, 2))
kick_bus = np.zeros((N, 2))  # bypasses the sidechain ducker
verb = np.zeros((N, 2))      # reverb send
duck_src = []                # kick times for sidechain


# ------------------------------------------------------------------ utils
def tt(d):
    return np.arange(int(d * SR)) / SR


def mtof(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def filt(x, lo=None, hi=None, order=2):
    """Static zero-phase filter via FFT. x: (n,) or (n,2)."""
    X = np.fft.rfft(x, axis=0)
    f = np.fft.rfftfreq(x.shape[0], 1 / SR)
    H = np.ones_like(f)
    if hi:
        H *= 1 / np.sqrt(1 + (f / hi) ** (2 * order))
    if lo:
        with np.errstate(divide='ignore'):
            H *= 1 / np.sqrt(1 + (lo / np.maximum(f, 1e-6)) ** (2 * order))
    if x.ndim == 2:
        H = H[:, None]
    return np.fft.irfft(X * H, n=x.shape[0], axis=0)


def stereo(sig, pan=0.0):
    a = (pan + 1) * np.pi / 4
    return np.stack([sig * np.cos(a), sig * np.sin(a)], 1) * np.sqrt(2)


def place(sig, t, gain=1.0, pan=0.0, send=0.0, bus=None):
    if sig.ndim == 1:
        sig = stereo(sig, pan)
    i = int(round(t * SR))
    if i >= N:
        return
    if i < 0:
        sig, i = sig[-i:], 0
    end = min(N, i + len(sig))
    (dry if bus is None else bus)[i:end] += sig[:end - i] * gain
    if send:
        verb[i:end] += sig[:end - i] * gain * send


def blsaw(f, t, harmonics=24, phase=None):
    """Band-limited saw (additive)."""
    out = np.zeros_like(t)
    kmax = int(min(harmonics, 14000 / f))
    ph = rng.uniform(0, 2 * np.pi, kmax) if phase is None else phase
    for k in range(1, kmax + 1):
        out += np.sin(2 * np.pi * k * f * t + ph[k - 1]) / k
    return out * 0.6


def adsr(n, a, d, s, r, sustain_len):
    a, d, r = int(a * SR), int(d * SR), int(r * SR)
    hold = max(0, int(sustain_len * SR) - a - d)
    env = np.concatenate([np.linspace(0, 1, a, False), np.linspace(1, s, d, False), np.full(hold, s), np.linspace(s, 0, r)])
    env = env[:n]
    return np.pad(env, (0, n - len(env)))


# ------------------------------------------------------------------ instruments
def kick():
    t = tt(0.5)
    f = 44 + 120 * np.exp(-t * 32)
    ph = 2 * np.pi * np.cumsum(f) / SR
    s = np.sin(ph) * np.exp(-t * 6.5)
    click = filt(rng.standard_normal(len(t)), lo=2000) * np.exp(-t * 250) * 0.25
    s = np.tanh(2.0 * (s + click)) / np.tanh(2.0)
    return s


def clap():
    t = tt(0.4)
    n = rng.standard_normal(len(t))
    env = np.exp(-t * 16)
    for off in (0.0, 0.012, 0.024):
        env += 0.8 * np.exp(-np.maximum(t - off, 0) * 350) * (t >= off)
    return filt(n * env, lo=900, hi=6000) * 0.55


def snare():
    t = tt(0.25)
    body = np.sin(2 * np.pi * 190 * t) * np.exp(-t * 30) * 0.5
    nz = filt(rng.standard_normal(len(t)), lo=1500, hi=9000) * np.exp(-t * 22) * 0.6
    return body + nz


def hat(open_=False):
    t = tt(0.45 if open_ else 0.09)
    n = filt(rng.standard_normal(len(t)), lo=7500, order=3)
    return n * np.exp(-t * (11 if open_ else 75)) * 0.5


def crash(length=2.6):
    t = tt(length)
    n = filt(rng.standard_normal((len(t), 2)), lo=3500, hi=14000)
    return n * np.exp(-t * 1.7)[:, None] * 0.45


def sub_boom(length=2.8, f0=58, f1=34):
    t = tt(length)
    f = f1 + (f0 - f1) * np.exp(-t * 3)
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 1.4)
    rumble = filt(rng.standard_normal(len(t)), hi=180) * np.exp(-t * 4) * 0.8
    return np.tanh(1.5 * (s + rumble))


def riser(length):
    t = tt(length)
    p = t / length
    nz = rng.standard_normal((len(t), 2))
    # three bands that open up progressively
    lo = filt(nz, lo=400, hi=1500) * (p ** 2.5)[:, None]
    mid = filt(nz, lo=1500, hi=5000) * (p ** 3)[:, None]
    hi = filt(nz, lo=5000, hi=12000) * (p ** 4)[:, None]
    f = 180 * 2 ** (p * 2.5)
    tone = np.sin(2 * np.pi * np.cumsum(f) / SR) * p ** 2 * 0.25
    return (lo * 0.5 + mid * 0.6 + hi * 0.6) + stereo(tone)


def reverse_cymbal(length=1.6):
    return crash(length)[::-1] * 0.9


def whoosh(length=0.75, bright=1.0):
    t = tt(length)
    p = t / length
    env = np.sin(np.pi * np.clip(p / 0.7, 0, 1) ** 0.8) ** 2 * (p < 0.7) + (p >= 0.7) * np.exp(-(p - 0.7) * 14) * 0
    env = np.where(p < 0.7, np.sin(np.pi / 2 * p / 0.7) ** 3, np.exp(-(p - 0.7) * 12))
    n = rng.standard_normal(len(t))
    sig = filt(n, lo=350, hi=2200 + 3000 * bright) * env
    sig += filt(rng.standard_normal(len(t)), lo=4000, hi=10000) * env ** 2 * 0.3 * bright
    pan = np.linspace(-0.85, 0.85, len(t))
    a = (pan + 1) * np.pi / 4
    return np.stack([sig * np.cos(a), sig * np.sin(a)], 1) * np.sqrt(2) * 0.55


def tick(f=2600):
    t = tt(0.05)
    return np.sin(2 * np.pi * f * t) * np.exp(-t * 110) * 0.35


def bell(m, length=2.4):
    t = tt(length)
    f = mtof(m)
    s = (np.sin(2 * np.pi * f * t) + 0.35 * np.sin(2 * np.pi * f * 2.0 * t) * np.exp(-t * 3)
         + 0.18 * np.sin(2 * np.pi * f * 3.01 * t) * np.exp(-t * 5))
    return s * np.exp(-t * 2.2) * np.minimum(1, t * 400) * 0.3


_pad_cache = {}


def pad_note(m, length, cutoff):
    key = (m, round(length, 3), int(cutoff))
    if key in _pad_cache:
        return _pad_cache[key]
    rel = 0.9
    t = tt(length + rel)
    out = np.zeros((len(t), 2))
    for cents, pan in ((-10, -0.7), (0, 0.0), (10, 0.7)):
        f = mtof(m) * 2 ** (cents / 1200)
        out += stereo(blsaw(f, t, 16), pan)
    env = adsr(len(t), 0.45, 0.4, 0.8, rel, length)
    out = filt(out * env[:, None], hi=cutoff, order=2) * 0.11
    _pad_cache[key] = out
    return out


_pluck_cache = {}


def pluck(m, cutoff):
    key = (m, int(cutoff))
    if key in _pluck_cache:
        return _pluck_cache[key]
    t = tt(0.45)
    f = mtof(m)
    s = blsaw(f, t, 14, phase=np.zeros(14)) + 0.5 * np.sin(2 * np.pi * f * 2 * t)
    s *= np.exp(-t * 10) * np.minimum(1, t * 300)
    s = filt(s, hi=cutoff, order=2) * 0.22
    _pluck_cache[key] = s
    return s


_bass_cache = {}


def bass_note(m, length):
    key = (m, round(length, 3))
    if key in _bass_cache:
        return _bass_cache[key]
    t = tt(length + 0.05)
    f = mtof(m)
    sub = np.sin(2 * np.pi * f * t)
    grit = filt(blsaw(f * 2, t, 18, phase=np.zeros(18)), hi=650, order=2)
    env = adsr(len(t), 0.004, 0.08, 0.75, 0.05, length)
    s = np.tanh(1.4 * (sub * 0.8 + grit * 0.6)) * env * 0.42
    _bass_cache[key] = s
    return s


# ------------------------------------------------------------------ harmony
# i - VI - III - VII in A minor: Am  F  C  G   (one chord per bar)
CHORDS = [[57, 60, 64], [53, 57, 60], [55, 60, 64], [55, 59, 62]]
ROOTS = [33, 29, 36, 31]
ARP = [0, 1, 2, 3, 2, 1, 0, 1, 0, 1, 2, 3, 2, 1, 2, 3]   # index 3 = root + octave
ARP_VEL = [1, .55, .7, .6, .9, .55, .7, .6, 1, .55, .7, .6, .9, .55, .75, .65]


def section(t):
    if t < 4: return 'intro'
    if t < 8: return 'build'
    if t < 16: return 'groove'
    if t < 40: return 'drop'
    if t < 44: return 'montage'
    if t < 50: return 'break'
    if t < 54: return 'lift'
    return 'outro'


PAD_CUT = {'intro': 900, 'build': 1400, 'groove': 2200, 'drop': 3200, 'montage': 3600, 'break': 1500, 'lift': 3000, 'outro': 2600}
ARP_CUT = {'intro': 1400, 'build': 2200, 'groove': 3200, 'drop': 4800, 'montage': 5600, 'break': 2400, 'lift': 4800, 'outro': 3600}

# ------------------------------------------------------------------ arrangement
# Pads (bars 0..26), final held Am at 54 s
for bar in range(27):
    t0 = bar * BAR
    sec = section(t0)
    cut = PAD_CUT[sec] if sec != 'intro' else 700 + bar * 250
    g = 0.9 if sec != 'intro' else 0.55 + bar * 0.15
    for m in CHORDS[bar % 4]:
        place(pad_note(m, BAR, cut), t0, g, send=0.45)
for m in (57, 60, 64, 69):
    place(pad_note(m, 4.6, 2400), 54.0, 1.0, send=0.6)

# Arpeggio (16ths) from 2 s to 54 s, ping-pong delay applied later via arp bus
arp = np.zeros((N, 2))
for bar in range(1, 27):
    t0 = bar * BAR
    sec = section(t0)
    chord = CHORDS[bar % 4]
    notes = [chord[0] + 12, chord[1] + 12, chord[2] + 12, chord[0] + 24]
    lvl = {'intro': .45, 'build': .6, 'break': .7}.get(sec, 1.0)
    for i in range(16):
        if sec == 'break' and i % 2:        # half-density in the breakdown
            continue
        t = t0 + i * BEAT / 4
        s = pluck(notes[ARP[i]], ARP_CUT[sec]) * ARP_VEL[i] * lvl
        j = int(round(t * SR))
        e = min(N, j + len(s))
        arp[j:e] += stereo(s[:e - j], 0.25 if i % 2 else -0.25)
# outro arp: slow 8ths, fading
for i in range(12):
    t = 54.0 + i * BEAT / 2
    s = pluck([69, 72, 76, 81][i % 4], 3000) * 0.8 * (1 - i / 13)
    j = int(round(t * SR)); arp[j:j + len(s)] += stereo(s, -0.3 if i % 2 else 0.3)
# ping-pong delay (dotted 8th)
d = int(BEAT * 0.75 * SR)
wet = np.zeros_like(arp)
for k in range(1, 6):
    sh = np.zeros_like(arp)
    sh[k * d:] = arp[:-k * d]
    g = 0.42 ** k
    if k % 2:
        sh = sh[:, ::-1]
    wet += sh * g
arp_bus = arp + filt(wet, lo=300, hi=5000) * 0.8
dry += arp_bus * 0.9
verb += arp_bus * 0.25

# Drums
def drums_on(t):
    return (8 <= t < 44) or (50 <= t < 54)


for b in range(int(DUR / BEAT)):
    t = b * BEAT
    sec = section(t)
    beat_in_bar = b % 4
    # kick
    if drums_on(t) or (6 <= t < 8):
        place(kick(), t, 0.95 if t >= 8 else 0.6, bus=kick_bus)
        duck_src.append(t)
    # clap on 2 & 4 (half-time on 3 in the breakdown)
    if drums_on(t) and beat_in_bar in (1, 3):
        place(clap(), t, 0.75, send=0.18)
    if sec == 'break' and beat_in_bar == 2:
        place(clap(), t, 0.6, send=0.35)
    # hats
    for k in range(4):
        th = t + k * BEAT / 4
        if sec in ('drop', 'montage', 'lift'):
            if k == 2:
                place(hat(True), th, 0.32, pan=0.2)
            else:
                place(hat(), th, [0.42, 0.22, 0, 0.3][k], pan=-0.15)
        elif sec == 'groove' and k == 2:
            place(hat(), th, 0.45, pan=0.15)
        elif sec == 'groove' and k == 0:
            place(hat(), th, 0.22, pan=-0.15)
        elif sec in ('build', 'break') and k == 2 and t >= 5:
            place(hat(), th, 0.28, pan=0.15)
    # extra percussion in the montage
    if sec == 'montage':
        for k in (1, 3):
            place(snare() * 0.35, t + k * BEAT / 4, 0.5, pan=0.4 if k == 1 else -0.4, send=0.1)

# Bass: driving 8ths
for b in range(int(DUR / (BEAT / 2))):
    t = b * BEAT / 2
    if not drums_on(t):
        continue
    bar = int(t // BAR)
    root = ROOTS[bar % 4]
    m = root + (12 if (b % 4 == 3) else 0)
    place(bass_note(m, BEAT / 2 * 0.85), t, 1.0)
# breakdown sub drones
for bar in range(22, 25):
    place(bass_note(ROOTS[bar % 4], BAR * 0.95), bar * BAR, 0.55)

# Snare rolls into drops
for start, end in ((15.0, 16.0), (53.0, 54.0)):
    n = 16
    for i in range(n):
        t = start + (end - start) * (1 - (1 - i / n) ** 1.6)
        place(snare(), t, 0.25 + 0.5 * i / n, send=0.2)

# Risers + reverse cymbals into big moments
for end, length, g in ((8.0, 2.4, 0.55), (16.0, 3.0, 0.7), (40.0, 2.0, 0.45), (50.0, 2.6, 0.55), (54.0, 2.0, 0.65)):
    place(riser(length), end - length, g, send=0.2)
for end in (16.0, 40.0, 54.0):
    place(reverse_cymbal(1.6), end - 1.6, 0.6)

# Impacts + crashes
for t, g in ((0.25, 0.55), (8.0, 0.8), (16.0, 1.0), (40.0, 0.75), (44.0, 0.6), (50.0, 0.7), (54.0, 1.1)):
    place(sub_boom(), t, g, send=0.15)
for t in (8.0, 16.0, 24.0, 32.0, 40.0, 50.0, 54.0):
    place(crash(), t, 0.7, send=0.3)

# Whooshes leading into every cut
for c in (4, 8, 12, 16, 40, 44, 50, 54):
    place(whoosh(0.8, 1.0), c - 0.55, 0.8, send=0.2)
for c in (20, 24, 28, 32, 36):
    place(whoosh(0.6, 0.6), c - 0.42, 0.55, send=0.15)
for t in (44.4, 44.75, 50.5, 51.0, 51.5):        # device + feature entrances
    place(whoosh(0.45, 0.4), t - 0.15, 0.3)

# Counter ticks — same easing as the video (outExpo), one tick per integer step
def outexpo_inverse(v):
    return -np.log2(max(1e-9, 1 - v)) / 10

for k in range(1, 20):
    place(tick(2400 + k * 20), 8.3 + 1.2 * min(1, outexpo_inverse(k / 20)), 0.6, pan=0.1)
for k in range(1, 20):
    place(tick(2000 + k * 30), 12.3 + 1.7 * min(1, outexpo_inverse(k / 20)), 0.5, pan=-0.1)

# Mosaic tile pops (diagonals)
for d in range(7):
    place(tick(1400 + d * 180), 40.0 + d * 0.055 + 0.08, 0.35, pan=-0.6 + d * 0.2)

# Logo stings
for i, m in enumerate((69, 76, 81)):
    place(bell(m), 0.3 + i * 0.12, 0.7, pan=-0.3 + i * 0.3, send=0.6)
for i, m in enumerate((69, 72, 76, 81, 84)):
    place(bell(m, 3.2), 54.5 + i * 0.09, 0.75, pan=-0.4 + i * 0.2, send=0.7)

# ------------------------------------------------------------------ sidechain
duck = np.ones(N)
dt = tt(0.35)
curve = 1 - 0.55 * np.exp(-dt * 11)
for t in duck_src:
    i = int(round(t * SR))
    e = min(N, i + len(curve))
    duck[i:e] = np.minimum(duck[i:e], curve[:e - i])

dry *= duck[:, None] ** 0.6
dry += kick_bus

# ------------------------------------------------------------------ reverb (FFT convolution)
ir_t = tt(2.6)
ir = rng.standard_normal((len(ir_t), 2)) * np.exp(-ir_t * 2.6)[:, None]
ir = filt(ir, lo=200, hi=7000)
ir /= np.sqrt((ir ** 2).sum(0, keepdims=True))
L = N + len(ir)
nfft = 1 << (L - 1).bit_length()
wet = np.fft.irfft(np.fft.rfft(verb, nfft, axis=0) * np.fft.rfft(ir, nfft, axis=0), nfft, axis=0)[:N]
mix = dry + wet * 0.55

# ------------------------------------------------------------------ master
mix = filt(mix, lo=28, order=2)
fade_in = np.minimum(1, tt(DUR)[:N] / 0.15)
fade_out = np.clip((DUR - tt(DUR)[:N]) / 2.5, 0, 1) ** 1.5
mix *= (fade_in * fade_out)[:, None]
mix /= np.max(np.abs(mix)) + 1e-9
mix = np.tanh(mix * 1.6) / np.tanh(1.6)            # gentle saturation / glue
mix *= 0.93 / np.max(np.abs(mix))

out = (mix * 32767).astype(np.int16)
path = sys.argv[1] if len(sys.argv) > 1 else 'soundtrack.wav'
with wave.open(path, 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes(out.tobytes())
print('wrote', path, f'{N / SR:.1f}s')
