'''This example shows how to plot rectangles. The first figure uses a static
width and height. The second applies a variable configuration for each rect
and the third plot adds an angle to each rect.

.. bokeh-example-metadata::
    :apis: bokeh.plotting.figure.rect
    :refs: :ref:`ug_basic_areas_rects`
    :keywords: rect

'''
import numpy as np

from bokeh.layouts import gridplot
from bokeh.plotting import figure, show

x = np.linspace(0, 4*np.pi, 80)
y = np.sin(x)

# fixed width and height
p1 = figure(title="width/height screen units")
p1.rect(x, y, 6, 4, color="tomato",
        width_units="screen", height_units="screen")

# variable width and height
w = 0.02*np.exp(1+0.1*x)
h = 0.2*abs(np.cos(x))
p2 = figure(title="variable width/height")
p2.rect(x, y, w, h, color="olivedrab", alpha=0.6)

# angle
p3 = figure(title="angle")
p3.rect(x, y, 0.1, 0.1, alpha=0.5, color="navy", angle=-np.pi/6)

show(gridplot([p1, p2, p3], ncols=2, width=400, height=400))
