''' This example shows how to use colours to map range of values within a given
array as low, high or median.

.. bokeh-example-metadata::
    :apis: bokeh.plotting.figure, bokeh.layouts.gridplot, bokeh.models.LinearColorMapper, bokeh.transform.transform
    :refs: :ref:`ug_plotting_scatter_markers`, :ref:`ug_interaction_tooltips`
    :keywords: plot, tooltips, tools
    
'''
import numpy as np

from bokeh.layouts import gridplot
from bokeh.models import LinearColorMapper
from bokeh.plotting import figure, show
from bokeh.transform import transform

tooltips = [("x", "$x"), ("y", "$y"), ("r", "@radius")]
tools = "pan,box_select,box_zoom,reset"

def data_flat(c=1.0):
    N = 500
    x = np.random.random(size=N)
    y = np.random.random(size=N)
    r = c*np.linspace(0, 1, N)
    return x*100, y*100, r

def data_sloped():
    N = 500
    x = np.random.random(size=N)
    y = np.random.random(size=N)
    r = 2*(x + y)*np.linspace(0, 1, N)
    return x*100, y*100, r

mapper = LinearColorMapper(palette="Plasma256", low_color="white", high_color="black")

p0 = figure(width=500, height=500, tooltips=tooltips, tools=tools)
x0, y0, r0 = data_flat(0.8)
g0 = p0.scatter(x0, y0, radius=r0,
               fill_color=transform("radius", mapper),
               fill_alpha=0.6, line_color=None)
mapper.domain.append((g0, "radius"))

p1 = figure(width=500, height=500, tooltips=tooltips, tools=tools)
x1, y1, r1 = data_flat(1.0)
g1 = p1.scatter(x1, y1, radius=r1,
               fill_color=transform("radius", mapper),
               fill_alpha=0.6, line_color=None)
mapper.domain.append((g1, "radius"))

p2 = figure(width=500, height=500, tooltips=tooltips, tools=tools)
x2, y2, r2 = data_flat(1.2)
g2 = p2.scatter(x2, y2, radius=r2,
               fill_color=transform("radius", mapper),
               fill_alpha=0.6, line_color=None)
mapper.domain.append((g2, "radius"))

p3 = figure(width=500, height=500, tooltips=tooltips, tools=tools)
x3, y3, r3 = data_sloped()
g3 = p3.scatter(x3, y3, radius=r3,
               fill_color=transform("radius", mapper),
               fill_alpha=0.6, line_color=None)
mapper.domain.append((g3, "radius"))

color_bar = g3.construct_color_bar(padding=0)
p3.add_layout(color_bar, "below")

show(gridplot([[p0, p1], [p2, p3]]))
