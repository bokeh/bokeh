''' This example shows creating sinusoidal wave using bokeh DataModel.

.. bokeh-example-metadata::
    :apis: bokeh.models.DataModel, bokeh.models.ColumnDataSource, bokeh.models.CustomJS, bokeh.core.properties.Float
    :keywords: wave, sinusoidal, phase, frequency, amplitude

'''
import numpy as np

from bokeh.core.properties import Float
from bokeh.model import DataModel
from bokeh.models import ColumnDataSource, CustomJS
from bokeh.plotting import figure, show


class Params(DataModel):
    amp = Float(default=0.1, help="Amplitude")
    freq = Float(default=0.1, help="Frequency")
    phase = Float(default=0, help="Phase")
    offset = Float(default=-5, help="Offset")

params = Params(amp=2, freq=3, phase=0.4, offset=1)

A = params.amp
k = params.freq
phi = params.phase
B = params.offset
x = np.linspace(0, 10, 100)
y = A*np.sin(k*x + phi) + B

source = ColumnDataSource(data=dict(x=x, y=y))

plot = figure(tags=[params], y_range=(-10, 10), title="Data models example")
plot.line("x", "y", source=source, line_width=3, line_alpha=0.6)

callback = CustomJS(args=dict(source=source, params=params), code="""
    const data = source.data
    const A = params.amp
    const k = params.freq
    const phi = params.phase
    const B = params.offset

    const x = source.data.x
    const y = Array.from(x, (x) => B + A*Math.sin(k*x+phi))
    source.data = { x, y }
""")

params.js_on_change("amp", callback)
params.js_on_change("freq", callback)
params.js_on_change("phase", callback)
params.js_on_change("offset", callback)

show(plot)
