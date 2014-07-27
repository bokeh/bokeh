
import json
from threading import Thread, RLock

from bokeh.embed import components
from bokeh.objects import ColumnDataSource
from bokeh.plotting import image_rgba, line, annular_wedge
from bokeh.resources import Resources
from bokeh.templates import RESOURCES
from bokeh.utils import encode_utf8
from bokeh.widgetobjects import HBox, Paragraph, Slider, VBox
import flask
import pyaudio
from numpy import fromstring, int16
from scipy import fft

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
        spectrogram, resources, "spectrogram"
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
    json.dumps({
        "FREQ_SAMPLES" : FREQ_SAMPLES,
        "MAX_FREQ" : MAX_FREQ,
        "NUM_SAMPLES" : NUM_SAMPLES,
        "SAMPLING_RATE" : SAMPLING_RATE,
        "SPECTROGRAM_LENGTH" : SPECTROGRAM_LENGTH,
        "TILE_WIDTH" : TILE_WIDTH,
        "TIMESLICE" : TIMESLICE,
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
            fft, samples, bins = data
            data = None

    if have_data:
        return json.dumps({
            "fft"     : fft,
            "samples" : samples,
            "bins"    : bins,
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

    TOOLS = ""

    freq = VBox(
        children=[
            Paragraph(text="Freq Range"),
            #Slider(orientation="vertical", start=1, end=MAX_FREQ, value=MAX_FREQ, step=1)
        ]
    )

    gain = VBox(
        children=[
            Paragraph(text="Gain"),
            Slider(orientation="vertical", start=1, end=20, value=1, step=1)
        ]
    )

    spec_source = ColumnDataSource(data=dict(image=[], x=[]))
    spec = image_rgba(
        x='x', y=0, image='image', dw=TILE_WIDTH, dh=MAX_FREQ,
        cols=TILE_WIDTH, rows=SPECTROGRAM_LENGTH, tools=TOOLS,
        source=spec_source, plot_width=1000, plot_height=400)

    fft_source = ColumnDataSource(data=dict(idx=[], y=[]))
    fft = line(x="idx", y="y", line_color="darkblue", tools=TOOLS,
        source=fft_source, plot_width=600, plot_height=200)

    power_source = ColumnDataSource(data=dict(idx=[], y=[]))
    power = line(x="idx", y="y", line_color="darkblue", x_axis_type="log", tools=TOOLS,
        source=power_source, plot_width=600, plot_height=200)

    radial_source = ColumnDataSource(data=dict(
        inner_radius=[], outer_radius=[], start_angle=[], end_angle=[], fill_alpha=[]
    ))
    radial = annular_wedge(
        x=0, y=0, fill_color="#688AB9", fill_alpha="fill_alpha", line_color=None,
        inner_radius="inner_radius", outer_radius="outer_radius",
        start_angle="start_angle", end_angle="end_angle", tools=TOOLS,
        source=radial_source, plot_width=500, plot_height=500)

    lines = VBox(
        children=[fft, power]
    )

    layout = VBox(
        children = [
            HBox(children=[freq, gain, spec]),
            HBox(children=[lines, radial])
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
            raw_data  = fromstring(stream.read(NUM_SAMPLES), dtype=int16)
            normalized_data = raw_data / 32768.0
            with mutex:
                fft = abs(fft(normalized_data))[:NUM_SAMPLES/2]
                samples = normalized_data
                bins = np.array()
                data = fft.tolist(), samples.tolist(), bins.tolist()
        except:
            with mutex:
                data = None

if __name__ == "__main__":
    main()
