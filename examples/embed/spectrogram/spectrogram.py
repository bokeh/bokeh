
import json
from threading import Thread, RLock

import flask
from flask import send_from_directory
import pyaudio
import numpy as np
import scipy as sp
from scipy.integrate import simps

from bokeh.embed import components
from bokeh.models import ColumnDataSource, Slider
from bokeh.plotting import figure
from bokeh.resources import Resources
from bokeh.util.string import encode_utf8

app = flask.Flask(__name__)

NUM_SAMPLES = 1024
SAMPLING_RATE = 44100
MAX_FREQ = SAMPLING_RATE / 2
FREQ_SAMPLES = NUM_SAMPLES / 8
NGRAMS = 800
SPECTROGRAM_LENGTH = 512
TILE_WIDTH = 200
TIMESLICE = 40  # ms

mutex = RLock()
data = None
stream = None


@app.route("/")
def root():
    """ Returns the spectrogram of audio data served from /data """

    freq_slider, gain_slider, spectrum, signal, spec, eq = make_spectrogram()

    spectrogram_plots = {
        'freq_slider': freq_slider,  # slider
        'gain_slider': gain_slider,  # slider
        'spec': spec,  # image
        'spectrum': spectrum,  # line
        'signal': signal,  # line
        'equalizer': eq  # radial
    }

    script, divs = components(spectrogram_plots)
    bokeh = Resources(mode="inline")

    html = flask.render_template("spectrogram.html", bokeh=bokeh, script=script, divs=divs)
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
        "FRAMES_PER_SECOND": 15
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


@app.route('/images/<path:path>')
def send_image(path):
    return send_from_directory('images', path)

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
        tools="", min_border=20, h_symmetry=False, v_symmetry=False, toolbar_location=None, outline_line_color='#595959',
    )

    freq_slider = Slider(start=1, end=MAX_FREQ, value=MAX_FREQ, step=1, name="freq", title="Frequency")
    gain_slider = Slider(start=1, end=20, value=1, step=1, name="gain", title="Gain")

    spec_source = ColumnDataSource(data=dict(image=[], x=[]))
    spec = figure(
        title=None, plot_width=990, plot_height=300, min_border_left=80,
        x_range=[0, NGRAMS], y_range=[0, MAX_FREQ], border_fill= "#d4e7e4", **plot_kw)
    spec.image_rgba(
        x='x', y=0, image='image', dw=TILE_WIDTH, dh=MAX_FREQ,
        cols=TILE_WIDTH, rows=SPECTROGRAM_LENGTH,
        source=spec_source, dilate=True, name="spectrogram")
    spec.grid.grid_line_color = None
    spec.background_fill="#024768"
    spec.axis.major_label_text_font = "Georgia"
    spec.axis.major_label_text_font_size = "8pt"
    spec.axis.major_label_text_color = "#231f20"

    spectrum_source = ColumnDataSource(data=dict(x=[], y=[]))
    spectrum = figure(
        title=None, plot_width=600, plot_height=220,
        y_range=[10**(-4), 10**3], x_range=[0, MAX_FREQ*0.001],
        y_axis_type="log", background_fill="#f2f7f6", border_fill= "#d4e7e4",
        **plot_kw)
    spectrum.line(
        x="x", y="y", line_color="#024768",
        source=spectrum_source, name="spectrum")
    spectrum.xgrid.grid_line_dash=[2, 2]
    spectrum.xaxis.axis_label = "Frequency (kHz)"
    spectrum.axis.axis_label_text_font = "Georgia"
    spectrum.axis.axis_label_text_font_size = "12pt"
    spectrum.axis.axis_label_text_font_style = "bold"
    spectrum.axis.axis_label_text_color = "#231f20"
    spectrum.axis.major_label_text_font = "Georgia"
    spectrum.axis.major_label_text_font_size = "8pt"
    spectrum.axis.major_label_text_color = "#231f20"

    signal_source = ColumnDataSource(data=dict(x=[], y=[]))
    signal = figure(
        title=None, plot_width=600, plot_height=220, background_fill="#f2f7f6",
        x_range=[0, TIMESLICE*1.01], y_range=[-0.1, 0.1], border_fill= "#d4e7e4",**plot_kw)
    signal.line(
        x="x", y="y", line_color="#024768",
        source=signal_source,  name="signal")
    signal.xgrid.grid_line_dash = [2, 2]
    signal.xaxis.axis_label = "Time (ms)"
    signal.axis.axis_label_text_font = "Georgia"
    signal.axis.axis_label_text_font_size = "12pt"
    signal.axis.axis_label_text_font_style = "bold"
    signal.axis.axis_label_text_color = "#231f20"
    signal.axis.major_label_text_font = "Georgia"
    signal.axis.major_label_text_font_size = "8pt"
    signal.axis.major_label_text_color = "#231f20"

    radial_source = ColumnDataSource(data=dict(
        inner_radius=[], outer_radius=[], start_angle=[], end_angle=[], fill_alpha=[],
    ))
    plot_kw['min_border'] = 0
    eq = figure(
        title=None, plot_width=300, plot_height=300,
        x_axis_type=None, y_axis_type=None,
        x_range=[-20, 20], y_range=[-20, 20], background_fill="#d4e7e4",
        border_fill= "#d4e7e4",**plot_kw)
    eq.outline_line_color = None
    eq.annular_wedge(
        x=0, y=0, fill_color="#024768", fill_alpha="fill_alpha", line_color=None,
        inner_radius="inner_radius", outer_radius="outer_radius",
        start_angle="start_angle", end_angle="end_angle",
        source=radial_source, name="eq")
    eq.grid.grid_line_color = None

    return freq_slider, gain_slider, spectrum, signal, spec, eq


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
            new_data = signal.tolist(), spectrum.tolist(), bins
            with mutex:
                data = new_data
        except:
            with mutex:
                data = None

if __name__ == "__main__":
    main()
