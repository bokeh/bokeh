from __future__ import print_function

try:
    import pyaudio
except:
    print("This demo requires pyaudio installed to function")
    import sys
    sys.exit(1)

import numpy as np
import scipy as sp
from scipy.integrate import simps

NUM_SAMPLES = 1024
SAMPLING_RATE = 44100
MAX_FREQ = SAMPLING_RATE / 2
FREQ_SAMPLES = NUM_SAMPLES / 8
TIMESLICE = 100  # ms
NUM_BINS = 16

data = {'values': None}

def _get_audio_data():
    pa = pyaudio.PyAudio()
    stream = pa.open(
        format=pyaudio.paInt16,
        channels=1,
        rate=SAMPLING_RATE,
        input=True,
        frames_per_buffer=NUM_SAMPLES
    )

    while True:
        try:
            raw_data  = np.fromstring(stream.read(NUM_SAMPLES), dtype=np.int16)
            signal = raw_data / 32768.0
            fft = sp.fft(signal)
            spectrum = abs(fft)[:NUM_SAMPLES/2]
            power = spectrum**2
            bins = simps(np.split(power, NUM_BINS))
            data['values'] = signal, spectrum, bins
        except:
            continue
