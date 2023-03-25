''' This example demonstrates using CustomJS Expression to create a sinusoidal line chart.

.. bokeh-example-metadata::
    :apis: bokeh.models.CustomJSExpr, bokeh.model.DataModel
    :refs: :ref:`ug_interaction_js_callbacks_customjs`
    :keywords: js callbacks, expressions
'''

import numpy as np

from bokeh.core.properties import Float, expr
from bokeh.model import DataModel
from bokeh.models import CustomJSExpr
from bokeh.plotting import figure, show


class Params(DataModel):
    amp = Float(default=0.1, help="Amplitude")
    freq = Float(default=0.1, help="Frequency")
    phase = Float(default=0, help="Phase")
    offset = Float(default=-5, help="Offset")

params = Params(amp=2, freq=3, phase=0.4, offset=1)

x = np.linspace(0, 10, 100)
y = CustomJSExpr(args=dict(params=params), code="""
    const A = params.amp
    const k = params.freq
    const phi = params.phase
    const B = params.offset
    const {x} = this.data
    return x.map((xi) => A*Math.sin(k*xi + phi) + B)
    /* Alternatively:
    for (const xi of x) {
      yield A*Math.sin(k*xi + phi) + B
    }
    */
""")

plot = figure(tags=[params], y_range=(-5, 5), title="Data models with custom JS expressions")
plot.line(x, y=expr(y), line_width=3, line_alpha=0.6)

show(plot)
