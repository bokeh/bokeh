''' A demonstration of a ColorBar with a log color scale.

.. bokeh-example-metadata::
    :apis: bokeh.models.ColorBar, bokeh.models.LogColorMapper
    :refs: :ref:`ug_basic_annotations_color_bars`
    :keywords: colorbar

'''
import numpy as np

from bokeh.models import LogColorMapper
from bokeh.plotting import figure, show


def normal2d(X, Y, sigx=1.0, sigy=1.0, mux=0.0, muy=0.0):
    z = (X-mux)**2 / sigx**2 + (Y-muy)**2 / sigy**2
    return np.exp(-z/2) / (2 * np.pi * sigx * sigy)

X, Y = np.mgrid[-3:3:200j, -2:2:200j]
Z = normal2d(X, Y, 0.1, 0.2, 1.0, 1.0) + 0.1*normal2d(X, Y, 1.0, 1.0)
image = Z * 1e6

color_mapper = LogColorMapper(palette="Viridis256", low=1, high=1e7)

plot = figure(x_range=(0,1), y_range=(0,1), toolbar_location=None)
r = plot.image(image=[image], color_mapper=color_mapper,
               dh=1.0, dw=1.0, x=0, y=0)

color_bar = r.construct_color_bar(padding=1)

plot.add_layout(color_bar, "right")

show(plot)
