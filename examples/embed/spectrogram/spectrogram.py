
import json
from threading import Thread, RLock

import flask
import pyaudio
import numpy as np
import scipy as sp
from scipy.integrate import simps

from bokeh.embed import components
from bokeh.models import ColumnDataSource
from bokeh.plotting import image_rgba, line, annular_wedge, grid
from bokeh.resources import Resources
from bokeh.templates import RESOURCES
from bokeh.utils import encode_utf8
from bokeh.models.widgets import HBox, Paragraph, Slider, VBox

app = flask.Flask(__name__)

NUM_SAMPLES = 1024
SAMPLING_RATE = 44100
MAX_FREQ = SAMPLING_RATE / 2
FREQ_SAMPLES = NUM_SAMPLES / 8
NGRAMS = 800
SPECTROGRAM_LENGTH = 512
TILE_WIDTH = 500
TIMESLICE = 40 # ms

mutex = RLock()
data = None
stream = None


@app.route("/")
def root():
    """ Returns the spectrogram of audio data served from /data """

    spectrogram = make_spectrogram()

    resources = Resources("inline")
    plot_resources = RESOURCES.render(
        js_raw = resources.js_raw,
        css_raw = resources.css_raw,
        js_files = resources.js_files,
        css_files = resources.css_files,
    )

    plot_script, plot_div = components(
        spectrogram, resources
    )

    html = flask.render_template(
        "spectrogram.html",
        plot_resources = plot_resources,
        plot_script = plot_script,
        plot_div = plot_div,
    )
    return encode_utf8(html)

@app.route("/params")
def params():
    return json.dumps({
        "FREQ_SAMPLES": FREQ_SAMPLES,
        "MAX_FREQ": MAX_FREQ,
        "NGRAMS": NGRAMS,
        "NUM_SAMPLES": NUM_SAMPLES,
        "SAMPLING_RATE": SAMPLING_RATE,
        "SPECTROGRAM_LENGTH": SPECTROGRAM_LENGTH,
        "TILE_WIDTH": TILE_WIDTH,
        "TIMESLICE": TIMESLICE,
        "EQ_CLAMP": 20,
        "FRAMES_PER_SECOND": 20
    })


@app.route("/data")
def data():
    """ Return the current audio data sample as a JSON dict of three arrays
    of floating-point values: (fft values, audio sample values, frequency bins)
    """
    global data
    have_data = False

    with mutex:
        if not data:
            return json.dumps({})
        else:
            have_data = True
            signal, spectrum, bins = data
            data = None

    if have_data:
        return json.dumps({
            "signal"   : signal,
            "spectrum" : spectrum,
            "bins"     : bins,
        })


def main():
    """ Start the sound server, which retains the audio data inside
    its process space, and forks out workers when web connections are
    made.
    """
    t = Thread(target=get_audio_data, args=())

    t.daemon = True
    t.setDaemon(True)
    t.start()

    app.run(debug=True)

def make_spectrogram():

    plot_kw = dict(
        tools="", min_border=1, h_symmetry=False, v_symmetry=False, toolbar_location=None
    )

    freq = VBox(
        children=[
            Paragraph(text="Freq Range"),
            Slider(orientation="vertical", start=1, end=MAX_FREQ, value=MAX_FREQ, step=1, name="freq")
        ]
    )

    gain = VBox(
        children=[
            Paragraph(text="Gain"),
            Slider(orientation="vertical", start=1, end=20, value=1, step=1, name="gain")
        ]
    )

    spec_source = ColumnDataSource(data=dict(image=[], x=[]))
    spec = image_rgba(
        x='x', y=0, image='image', dw=TILE_WIDTH, dh=MAX_FREQ,
        cols=TILE_WIDTH, rows=SPECTROGRAM_LENGTH, title=None,
        source=spec_source, plot_width=800, plot_height=300,
        x_range=[0, NGRAMS], y_range=[0, MAX_FREQ],
        dilate=True, name="spectrogram", **plot_kw)

    spectrum_source = ColumnDataSource(data=dict(x=[], y=[]))
    spectrum = line(
        x="x", y="y", line_color="darkblue", title="Power Spectrum",
        source=spectrum_source, plot_width=800, plot_height=250,
        x_range=[0, MAX_FREQ], y_range=[10**(-4), 10**3], y_axis_type="log",
        name="spectrum", **plot_kw)

    signal_source = ColumnDataSource(data=dict(x=[], y=[]))
    signal = line(
        x="x", y="y", line_color="darkblue", title="Signal",
        source=signal_source, plot_width=800, plot_height=250,
        x_range=[0, TIMESLICE*1.01], y_range=[-0.1, 0.1],
        name="signal", **plot_kw)

    radial_source = ColumnDataSource(data=dict(
        inner_radius=[], outer_radius=[], start_angle=[], end_angle=[], fill_alpha=[],
    ))
    eq = annular_wedge(
        x=0, y=0, fill_color="#688AB9", fill_alpha="fill_alpha", line_color=None,
        inner_radius="inner_radius", outer_radius="outer_radius",
        start_angle="start_angle", end_angle="end_angle", title=None,
        source=radial_source, plot_width=500, plot_height=520,
        x_range=[-20, 20], y_range=[-20, 20],
        name="eq", **plot_kw)
    grid().grid_line_color=None

    lines = VBox(
        children=[spectrum, signal]
    )

    layout = VBox(
        children = [
            HBox(children=[freq, gain, spec]),
            HBox(children=[lines, eq])
        ]
    )

    return layout

def get_audio_data():
    global data, stream

    if stream is None:
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
            bins = [simps(a) for a in np.split(power, 16)]
            with mutex:
                data = signal.tolist(), spectrum.tolist(), bins
        except:
            with mutex:
                data = None

if __name__ == "__main__":
    main()
