import numpy as np

from bokeh.core.properties import Float
from bokeh.io import save
from bokeh.model import Model
from bokeh.models import ColumnDataSource, CustomJS
from bokeh.plotting import figure


class Params(Model):
    __data_model__ = True

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
    const {x, y} = data
    for (let i = 0; i < x.length; i++) {
        y[i] = A*Math.sin(k*x[i] + phi) + B
    }
    source.change.emit()
""")

params.js_on_change("amp", callback)
params.js_on_change("freq", callback)
params.js_on_change("phase", callback)
params.js_on_change("offset", callback)

save(plot)
