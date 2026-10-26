"""Adjust a sine wave with sliders and a Python callback."""

import numpy as np

from bokeh.layouts import column, row
from bokeh.models import ColumnDataSource, Slider, TextInput
from bokeh.plotting import figure
from bokeh.server.asgi import BokehASGI


def modify_document(doc):
    N = 200
    x = np.linspace(0, 4*np.pi, N)
    y = np.sin(x)
    source = ColumnDataSource(data=dict(x=x, y=y), name="signal")
    plot = figure(height=400, width=400, title="my sine wave",
                  tools="crosshair,pan,reset,save,wheel_zoom",
                  x_range=[0, 4*np.pi], y_range=[-2.5, 2.5])
    plot.line('x', 'y', source=source, line_width=3, line_alpha=0.6)
    text = TextInput(title="title", value='my sine wave')
    offset = Slider(title="offset", value=0.0, start=-5.0, end=5.0, step=0.1)
    amplitude = Slider(name="amplitude", title="amplitude", value=1.0, start=-5.0, end=5.0, step=0.1)
    phase = Slider(title="phase", value=0.0, start=0.0, end=2*np.pi)
    freq = Slider(title="frequency", value=1.0, start=0.1, end=5.1, step=0.1)

    def update_title(attrname, old, new):
        plot.title.text = text.value

    text.on_change('value', update_title)

    def update_data(attrname, old, new):

        # Get the current slider values
        a = amplitude.value
        b = offset.value
        w = phase.value
        k = freq.value

        # Generate the new curve
        x = np.linspace(0, 4*np.pi, N)
        y = a*np.sin(k*x + w) + b
        source.data = dict(x=x, y=y)

    for w in [offset, amplitude, phase, freq]:
        w.on_change('value', update_data)

    inputs = column(text, offset, amplitude, phase, freq)
    doc.add_root(row(inputs, plot, width=800))
    doc.title = "Sliders"


app = BokehASGI(modify_document)
