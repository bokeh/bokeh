''' A contour plot containing lines at each contour level and filled polygons
between each pair of contour levels.

.. bokeh-example-metadata::
    :apis: bokeh.plotting.figure.contour, bokeh.models.ContourRenderer
    :refs: :ref:`ug_topics_contour`
    :keywords: contour

'''

import numpy as np

from bokeh.palettes import OrRd
from bokeh.plotting import curdoc, figure, show

x, y = np.meshgrid(np.linspace(0, 4, 33), np.linspace(0, 3, 25))
z = np.sin(np.pi*x) + np.cos(np.pi*y)
levels = np.linspace(-2.0, 2.0, 9)

fig = figure(width=600, height=500, toolbar_location=None, x_range=(0, 4), y_range=(0, 3),
             title=r'$$\text{Contour plot of } z = \sin(\pi x) + \cos(\pi y)$$')

contour_renderer = fig.contour(
    x, y, z, levels, fill_color=OrRd,
    line_color=['white']*4 + ['black']*5, line_dash=['solid']*5 + ['dashed']*4, line_width=2,
)

colorbar = contour_renderer.construct_color_bar()
fig.add_layout(colorbar, 'right')

curdoc().theme = 'dark_minimal'

show(fig)
