from time import sleep

import numpy as np
from scipy.fft import fft
from scipy.integrate import simps

NUM_SAMPLES = 1024
SAMPLING_RATE = 44100.
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
            rate=int(SAMPLING_RATE),
            input=True,
            frames_per_buffer=NUM_SAMPLES,
        )

        while True:
            try:
                raw_data  = np.fromstring(stream.read(NUM_SAMPLES), dtype=np.int16)
                signal = raw_data / 32768.0
                spectrum = abs(fft(signal))[:int(NUM_SAMPLES/2)]
                power = spectrum**2
                bins = simps(np.split(power, NUM_BINS))
                data['values'] = signal, spectrum, bins
            except Exception:
                continue

except ImportError:
    print()
    print(" *** Pyaudio package not installed, using synthesized audio data ***")
    print()

    def fm_modulation(x, f_carrier = 220, f_mod =220, Ind_mod = 1):
        y = np.sin(2*np.pi*f_carrier*x + Ind_mod*np.sin(2*np.pi*f_mod*x))
        return y

    # These are basically picked out of a hat to show something vaguely interesting
    _t = np.arange(0, NUM_SAMPLES/SAMPLING_RATE, 1.0/SAMPLING_RATE)
    _f_carrier = 2000
    _f_mod = 1000
    _ind_mod = 1

    def update_audio_data():
        while True:
            # Generate FM signal with drifting carrier and mod frequencies
            global _f_carrier, _f_mod, _ind_mod
            _f_carrier = max([_f_carrier+np.random.randn()*50, 0])
            _f_mod = max([_f_mod+np.random.randn()*20, 0])
            _ind_mod = max([_ind_mod+np.random.randn()*0.1, 0])
            A = 0.4 + 0.05 * np.random.random()
            signal = A * fm_modulation(_t, _f_carrier, _f_mod, _ind_mod)

            spectrum = abs(fft(signal))[:int(NUM_SAMPLES/2)]
            power = spectrum**2
            bins = simps(np.split(power, NUM_BINS))
            data['values'] = signal, spectrum, bins
            sleep(1.0/12)
