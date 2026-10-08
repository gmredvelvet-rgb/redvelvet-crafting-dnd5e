"""Original, deterministic modal/percussive craft cues; no samples or network inputs.
Requires Python, numpy and ffmpeg. Regenerates assets/audio/*.ogg.
"""
from pathlib import Path
import subprocess
import tempfile
import wave
import numpy as np

RATE = 48000
ROOT = Path(__file__).resolve().parents[1] / "assets" / "audio"
ROOT.mkdir(parents=True, exist_ok=True)
rng = np.random.default_rng(50213)

def modal(duration, fundamental, ratios, decay):
    t = np.arange(int(duration * RATE)) / RATE
    y = np.zeros(len(t))
    for i, ratio in enumerate(ratios):
        y += np.sin(2 * np.pi * fundamental * ratio * t + i * .13) * np.exp(-t * (decay + i * 1.7)) / (i + 1)
    return y

def noise(duration, decay, smooth=1):
    n = int(duration * RATE)
    y = rng.normal(0, 1, n)
    if smooth > 1:
        y = np.convolve(y, np.ones(smooth) / smooth, mode="same")
    return y * np.exp(-np.arange(n) / RATE * decay)

def cue(category, hit):
    duration = .72 if hit else .48
    if category == "herreria":
        y = modal(duration, 420 if hit else 165, [1,2.76,5.41,8.93], 5) + noise(duration, 90) * .18
    elif category == "alquimia":
        y = modal(duration, 760 if hit else 290, [1,1.43,2.51], 12) * .3 + noise(duration, 6, 15) * .8
        for offset in [.10,.17,.28,.38]:
            b = modal(.13, rng.uniform(220,600), [1,1.7], 30)
            start = int(offset * RATE)
            y[start:start+len(b)] += b[:max(0,len(y)-start)] * .15
    elif category == "joyeria":
        y = modal(duration, 1450 if hit else 780, [1,2.31,4.7], 7) * .65 + noise(duration, 100) * .04
    elif category == "trabajo-con-piel":
        y = noise(duration, 12, 4) * .7 + modal(duration, 145 if hit else 93, [1,2.1,3.4], 24) * .35
        t = np.arange(len(y)) / RATE
        y *= .4 + .6 * np.sin(2 * np.pi * 19 * t) ** 2
    elif category == "equipo-vario":
        y = modal(duration, 265 if hit else 125, [1,2.14,3.77], 19) + noise(duration, 36, 3) * .18
    elif category == "construcciones":
        y = modal(duration, 135 if hit else 72, [1,2.62,5.15], 13) + noise(duration, 36, 5) * .5
    elif category == "cultivos":
        y = noise(duration, 9, 28) + modal(duration, 205 if hit else 115, [1,1.4], 25) * .25
    elif category == "monstruos":
        y = noise(duration, 9, 4) * .8 + modal(duration, 320 if hit else 110, [1,2.4,3.3], 24) * .35
    else:
        y = noise(duration, 12, 16) * .65 + modal(duration, 355 if hit else 165, [1,1.83,3.21], 22) * .45
    return y

def save(name, signal):
    n = len(signal)
    fade = int(.008 * RATE)
    signal[:fade] *= np.linspace(0,1,fade)
    signal[-int(.035*RATE):] *= np.linspace(1,0,int(.035*RATE))
    signal -= signal.mean()
    # A short room tail with a slight stereo spread, normalized to -6 dB peak.
    delay = int(.023*RATE)
    tail = np.zeros(n)
    tail[delay:] = signal[:-delay] * .12
    stereo = np.stack([signal + tail,signal + np.roll(tail,int(.004*RATE))], axis=1)
    stereo *= .50 / max(.001, np.max(np.abs(stereo)))
    pcm = (stereo * 32767).astype("<i2")
    with tempfile.TemporaryDirectory(prefix="rv-crafting-audio-") as temp:
        source = Path(temp) / "cue.wav"
        with wave.open(str(source), "wb") as out:
            out.setnchannels(2); out.setsampwidth(2); out.setframerate(RATE); out.writeframes(pcm.tobytes())
        subprocess.run(["ffmpeg","-hide_banner","-loglevel","error","-y","-i",str(source),"-c:a","libvorbis","-q:a","5",str(ROOT / f"{name}.ogg")],check=True)

for category in ["herreria","alquimia","joyeria","trabajo-con-piel","equipo-vario","recoleccion","construcciones","cultivos","monstruos"]:
    for hit in [True,False]:
        save(f"{category}-{'hit' if hit else 'miss'}",cue(category,hit))
save("nav-select",modal(.30,880,[1,1.5,2],16))
save("nav-back",modal(.22,440,[1,1.5],19))
print("Generated 20 original stereo craft cues at 48 kHz.")
