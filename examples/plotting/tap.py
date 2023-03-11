''' An interactive numerical tap plot based on a simple Python array of data.
    You can select any datapoint by tapping on it.
    This highlights that datapoint and displays all other datapoints in a faded color.

.. bokeh-example-metadata::
    :apis: bokeh.plotting.figure, bokeh.io.show, bokeh.models.TapTool
    :refs: :ref:`ug_interaction_tools_clicktap`
    :keywords: circle, tapplot, text, select_one, renderers
'''


import numpy as np

from bokeh.models import TapTool
from bokeh.plotting import figure, show

N = 26 * 26
x, y = np.mgrid[0:101:4, 0:101:4].reshape((2, N))
text = [str(i) for i in np.arange(N)]
radii = np.random.random(N) * 0.4 + 1.7
colors = np.array([(r, g, 150) for r, g in zip(50+2*x, 30+2*y)], dtype="uint8")

TOOLS = "crosshair,pan,wheel_zoom,box_zoom,reset,tap,save"

p = figure(title="Tappy Scatter", tools=TOOLS)

cr = p.circle(x, y, radius=radii,
              fill_color=colors, fill_alpha=0.6, line_color=None)

tr = p.text(x, y, text=text, alpha=0.5, text_font_size="7px",
            text_baseline="middle", text_align="center")

tool = p.select_one(TapTool).renderers = [cr]

show(p)
