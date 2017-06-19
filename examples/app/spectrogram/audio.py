from __future__ import print_function

from time import sleep

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

try:
    import pyaudio

    def update_audio_data():
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
                spectrum = abs(fft)[:int(NUM_SAMPLES/2)]
                power = spectrum**2
                bins = simps(np.split(power, NUM_BINS))
                data['values'] = signal, spectrum, bins
            except:
                continue

except:
    print()
    print(" *** Pyaudio package not installed, using synthesized audio data ***")
    print()

    # These are basically picked out of a hat to show something vaguely interesting
    _t = np.arange(0, NUM_SAMPLES/SAMPLING_RATE, 1.0/SAMPLING_RATE)
    _f = 2000 + 3000*(2+np.sin(4*np.linspace(0, 2*np.pi, 500)))
    _i = 0

    def update_audio_data():
        while True:
            global _i
            A = 0.3 + 0.05 * np.random.random()
            signal = A*np.sin(2*np.pi*_f[_i]*_t + np.sin(2*np.pi*200*_t))

            fft = sp.fft(signal)
            spectrum = abs(fft)[:int(NUM_SAMPLES/2)]
            power = spectrum**2
            bins = simps(np.split(power, NUM_BINS))
            data['values'] = signal, spectrum, bins
            _i = (_i + 1) % len(_f)
            sleep(1.0/12)
