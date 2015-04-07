"""
This file demonstrates a bokeh applet, which can be viewed directly
on a bokeh-server. See the README.md file in this directory for
instructions on running.
"""

import logging

logging.basicConfig(level=logging.DEBUG)

import numpy as np

from bokeh.plotting import figure
from bokeh.models import ColumnDataSource
from bokeh.models.widgets import AppHBox, AppVBoxForm,Slider, TextInput
from bokeh.simpleapp import simpleapp

N = 200

title_widget = TextInput(title="title", name='title', value='my sine wave')
offset_widget = Slider(title="offset", name='offset', value=0.0,
                       start=-5.0, end=5.0, step=0.1)
amplitude_widget = Slider(title="amplitude", name='amplitude',
                          value=1.0, start=-5.0, end=5.0)
phase_widget = Slider(title="phase", name='phase', value=0.0, start=0.0, end=2*np.pi)
freq_widget = Slider(title="freq", name='freq', value=1.0, start=0.1, end=5.1)


def create_plot(title, amplitude, offset, phase, freq):
    """ Create a plot object with a sin curve using received args
    """
    toolset = "crosshair,pan,reset,resize,save,wheel_zoom"
    plot = figure(
        title_text_font_size="12pt",
        height=400, width=400, tools=toolset,
        title=title, x_range=[0, 4*np.pi], y_range=[-2.5, 2.5]
    )
    # Plot the line by the x,y values in the source property
    x = np.linspace(0, 4*np.pi, N)
    y = amplitude*np.sin(freq*x + phase) + offset
    source = ColumnDataSource(data=dict(x=x, y=y))
    plot.line('x', 'y', source=source, line_width=3, line_alpha=0.6)
    return plot

@simpleapp(title_widget, amplitude_widget, offset_widget, phase_widget, freq_widget)
def sliders(title, amplitude, offset, phase, freq):
    return {'plot': create_plot(title, amplitude, offset, phase, freq)}

@sliders.layout
def app_layout(app):
    inputs = AppVBoxForm(app=app,
        children=['title', 'offset', 'amplitude', 'phase', 'freq']
    )
    layout = AppHBox(app=app, children=[inputs, 'plot'])
    return layout

@sliders.update(['title', 'offset', 'amplitude', 'phase', 'freq'])
def updated_inputs(title, offset, amplitude, phase, freq, app):
    return sliders(title, offset, amplitude, phase, freq)

sliders.route("/bokeh/simplesliders/")
