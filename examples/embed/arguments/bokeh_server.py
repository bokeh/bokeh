#!/usr/bin/env python

'''This example demonstrates embedding an autoloaded Bokeh server
into a simple Flask application, and passing arguments to Bokeh.

To view the example, run:

    python flask_server.py

in this directory, and navigate to:

    http://localhost:5000

'''
import numpy as np

from bokeh.io import curdoc
from bokeh.layouts import column, row
from bokeh.models import ColumnDataSource, Slider, TextInput
from bokeh.plotting import figure

# Retrieving the arguments
args = curdoc().session_context.request.arguments

try:
    batchid = int(args.get('batchid')[0])
except (ValueError, TypeError):
    batchid = 1

func = {
    1 : np.cos,
    2 : np.sin,
    3 : np.tan
}[batchid]

# Set up data
N = 200
x = np.linspace(0, 4*np.pi, N)
y = func(x)
source = ColumnDataSource(data=dict(x=x, y=y))

# Set up plot
plot = figure(plot_height=400, plot_width=400, title="my wave",
              tools="crosshair,pan,reset,save,wheel_zoom",
              x_range=[0, 4*np.pi], y_range=[-2.5, 2.5])

plot.line('x', 'y', source=source, line_width=3, line_alpha=0.6)

# Set up widgets
text = TextInput(title="title", value=f"Batch n°{batchid}")
offset = Slider(title="offset", value=0.0, start=-5.0, end=5.0, step=0.1)
amplitude = Slider(title="amplitude", value=1.0, start=-5.0, end=5.0)
phase = Slider(title="phase", value=0.0, start=0.0, end=2*np.pi)
freq = Slider(title="frequency", value=1.0, start=0.1, end=5.1)

# Set up callbacks
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
    y = a*func(k*x + w) + b

    source.data = dict(x=x, y=y)

for w in [offset, amplitude, phase, freq]:
    w.on_change('value', update_data)

# Set up layouts and add to document
inputs = column(text, offset, amplitude, phase, freq)

curdoc().add_root(row(inputs, plot, width=800))
