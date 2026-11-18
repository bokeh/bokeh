''' Use WebGL to draw and select points in a 10,000-point scatter plot.

.. bokeh-example-metadata::
    :title: Scatter10k
    :keywords: scatter10k, output, webgl
    :apis: bokeh.plotting.figure.scatter
'''

import numpy as np

from bokeh.plotting import figure, show

N = 10000

x = np.random.normal(0, np.pi, N)
y = np.sin(x) + np.random.normal(0, 0.2, N)

TOOLS = "pan,wheel_zoom,box_zoom,reset,save,box_select"

p = figure(tools=TOOLS, output_backend="webgl")
p.scatter(x, y, alpha=0.1, nonselection_alpha=0.001)

show(p)
