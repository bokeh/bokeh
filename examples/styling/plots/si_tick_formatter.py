"""
Automatic SI prefixes
---------------------

Use ``SITickFormatter`` to select one SI prefix for all visible ticks while
keeping the underlying data in megahertz. The ``input_scale`` converts values
to hertz for formatting without changing the data.

.. bokeh-example-metadata::
    :apis: bokeh.models.SITickFormatter, bokeh.plotting.figure.line
    :refs: :ref:`ug_styling_plots_axes_tick_label_formats`
    :keywords: SI, unit, prefix, tick formatter
"""

import numpy as np

from bokeh.models import SITickFormatter
from bokeh.plotting import figure, show

frequency = np.linspace(0, 5, 800)  # MHz
response = (
    np.exp(-0.5*((frequency - 1.1)/0.18)**2)
    + 0.65*np.exp(-0.5*((frequency - 3.4)/0.32)**2)
)

p = figure(
    width=700,
    height=320,
    title="Resonant response",
    x_axis_label="Frequency",
    y_axis_label="Response",
    tools="xpan,xwheel_zoom,reset",
    active_scroll="xwheel_zoom",
)
p.line(frequency, response, line_width=3)
p.xaxis.formatter = SITickFormatter(unit="Hz", input_scale=1e6)
p.y_range.start = 0

show(p)
