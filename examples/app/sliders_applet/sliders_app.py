"""
This file demonstrates a bokeh server application, which you can
run with `bokeh serve sliders_app.py`
"""

import logging

logging.basicConfig(level=logging.DEBUG)

import numpy as np

from bokeh.plotting import Figure
from bokeh.models import Plot, ColumnDataSource
from bokeh.models.widgets import HBox, Slider, TextInput, VBoxForm
from bokeh.io import curdoc

source = ColumnDataSource(data=dict(x=[], y=[]))

text = TextInput(
    title="title", name='title', value='my sine wave'
)

offset = Slider(
    title="offset", name='offset',
    value=0.0, start=-5.0, end=5.0, step=0.1
)
amplitude = Slider(
    title="amplitude", name='amplitude',
    value=1.0, start=-5.0, end=5.0
)
phase = Slider(
    title="phase", name='phase',
    value=0.0, start=0.0, end=2*np.pi
)
freq = Slider(
    title="frequency", name='frequency',
    value=1.0, start=0.1, end=5.1
)

toolset = "crosshair,pan,reset,resize,save,wheel_zoom"

# Generate a figure container
plot = Figure(title_text_font_size="12pt",
              plot_height=400,
              plot_width=400,
              tools=toolset,
              title=text.value,
              x_range=[0, 4*np.pi],
              y_range=[-2.5, 2.5]
        )

# Plot the line by the x,y values in the source property
plot.line('x', 'y', source=source,
          line_width=3,
          line_alpha=0.6
)

plot = plot

inputs = VBoxForm(
    children=[
        text, offset, amplitude, phase, freq
    ]
)

hbox = HBox(children=[inputs, plot])

def update_data():
    """Called each time that any watched property changes.

        This updates the sin wave data with the most recent values of the
        sliders. This is stored as two numpy arrays in a dict into the app's
        data source property.
        """
    N = 200

    # Get the current slider values
    a = amplitude.value
    b = offset.value
    w = phase.value
    k = freq.value

    # Generate the sine wave
    x = np.linspace(0, 4*np.pi, N)
    y = a*np.sin(k*x + w) + b

    logging.debug(
        "PARAMS: offset: %s amplitude: %s", offset.value,
        amplitude.value
    )

    source.data = dict(x=x, y=y)

update_data()

def input_change(attrname, old, new):
    """Executes whenever the input form changes.

    It is responsible for updating the plot, or anything else you want.

    Args:
        attrname : the attr that changed
        old : old value of attr
        new : new value of attr
        """
    update_data()
    plot.title = text.value

# Text box event registration
text.on_change('value', input_change)

# Slider event registration
for w in [offset, amplitude, phase, freq]:
    w.on_change('value', input_change)

# put ourselves in the document
curdoc().add(hbox)
