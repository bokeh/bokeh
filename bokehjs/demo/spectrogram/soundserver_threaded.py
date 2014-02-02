
import flask
import os
from os.path import join
import sys

try:
    import simplejson as json
except:
    import json

import pyaudio
from numpy import zeros, linspace, short, fromstring, hstack, transpose
from scipy import fft

app = flask.Flask(__name__)

NUM_SAMPLES = 1024
SAMPLING_RATE = 44100
MAX_FREQ = SAMPLING_RATE / 8
FREQ_SAMPLES = NUM_SAMPLES / 8
SPECTROGRAM_LENGTH = 400

# Maximum time we want to spend polling the microphone for a single request
MAX_REQ_TIME = 0.05
adata = 0

from threading import Thread, RLock
import numpy as np

mutex = RLock()

_stream = None
def get_audio_data():
    global adata, _stream

    if _stream is None:
        pa = pyaudio.PyAudio()
        _stream = pa.open(format=pyaudio.paInt16, channels=1, rate=SAMPLING_RATE,
            input=True, frames_per_buffer=NUM_SAMPLES)

    while True:
        try:
            audio_data  = fromstring(_stream.read(NUM_SAMPLES), dtype=np.int16)
            normalized_data = audio_data / 32768.0
            with mutex:
                adata = (abs(fft(normalized_data))[:NUM_SAMPLES/2], normalized_data)
        except:
            with mutex:
                adata = 0


@app.route("/")
def root():
    """ Returns the spectrogram of audio data served from /data
    """
    return flask.render_template("spectrogram.html")

@app.route("/data")
def data():
    """ Returns the current audio data sample as a JSON list of two
    arrays of floating-point values: (fft values, audio sample values)
"""
    global adata
    to_send = None

    #minimal work in mutex
    with mutex:
        if not adata:
            return json.dumps({})
        else:
            to_send = adata
            adata = None

    if to_send:
        return json.dumps([to_send[0].tolist(), to_send[1].tolist()])


def main():
    """ Starts the sound server, which retains the audio data inside
    its process space, and forks out workers when web connections are
    made.
    """
    t = Thread(target = get_audio_data, args = ())
    t.daemon = True
    t.setDaemon(True)
    t.start()

    app.debug = True
    app.run()


if __name__ == "__main__":
    main()
